import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { SupportConversation, SupportMessage, SupportServerEvent } from "@/lib/support-chat/types";
import { CourseHelp } from "./course-help";

const api = vi.hoisted(() => ({
  availability: vi.fn(),
  openConversation: vi.fn(),
  messages: vi.fn(),
  markRead: vi.fn(),
  ticket: vi.fn(),
}));
const socket = vi.hoisted(() => ({
  sendResult: true,
  send: vi.fn(),
  emit: undefined as ((event: SupportServerEvent) => void) | undefined,
}));

vi.mock("@/lib/support-chat/api", async (original) => ({
  ...(await original<typeof import("@/lib/support-chat/api")>()),
  supportChatApi: api,
}));
const learner = vi.hoisted(() => ({ course: vi.fn() }));
vi.mock("@/lib/learner/api", async (original) => ({
  ...(await original<typeof import("@/lib/learner/api")>()),
  learnerApi: learner,
}));
vi.mock("@/lib/support-chat/socket-client", () => ({
  SupportSocketClient: class {
    constructor(
      _ticket: unknown,
      onEvent: (event: SupportServerEvent) => void,
      private onState: (state: "idle" | "live") => void,
    ) { socket.emit = onEvent; }
    connect() { this.onState("live"); }
    disconnect() { this.onState("idle"); }
    send(command: unknown) { socket.send(command); return socket.sendResult; }
  },
}));

const person = { id: "student-1", email: "leena@example.com", first_name: "Leena", last_name: "Rao" };
const conversation: SupportConversation = {
  id: "conversation-1",
  student: person,
  course: { id: "course-1", name: "Physics", code: "PHY" },
  course_version: { id: "version-1", name: "Term 1", version_number: 1 },
  groups: [{ id: "group-1", name: "Grade 9", code: "G9" }],
  status: "OPEN",
  last_sequence: 1,
  last_message_at: "2026-09-22T10:00:00Z",
  last_message: null,
  unread_count: 1,
  can_send: true,
  can_close: false,
  created_at: "2026-09-22T10:00:00Z",
  updated_at: "2026-09-22T10:00:00Z",
};
const teacherMessage: SupportMessage = {
  id: "message-1",
  conversation: conversation.id,
  sender: { id: "teacher-1", email: "teacher@example.com", first_name: "Mira", last_name: "Sen" },
  sender_role: "TEACHER",
  sequence: 1,
  client_message_id: "client-1",
  content: "Try <img src=x onerror=alert(1)> chapter two.",
  created_at: "2026-09-22T10:00:00Z",
};

beforeEach(() => {
  api.availability.mockReset().mockResolvedValue({ available: true, conversation });
  api.openConversation.mockReset().mockResolvedValue(conversation);
  api.messages.mockReset().mockResolvedValue({ results: [teacherMessage], has_more: false, next_after_sequence: 1 });
  api.markRead.mockReset().mockResolvedValue({ conversation_id: conversation.id, sequence: 1 });
  api.ticket.mockReset();
  learner.course.mockReset().mockResolvedValue({ id: "course-1", chatbot_available: false });
  socket.send.mockReset();
  socket.sendResult = true;
  socket.emit = undefined;
  Element.prototype.scrollIntoView = vi.fn();
});
afterEach(cleanup);

describe("Teacher support", () => {
  it("hides the launcher when no conversation can be started or read", async () => {
    api.availability.mockResolvedValueOnce({ available: false, conversation: null });
    render(<CourseHelp courseId="course-1" />);
    await waitFor(() => expect(api.availability).toHaveBeenCalledWith("course-1"));
    expect(screen.queryByRole("button", { name: /Ask a teacher/ })).toBeNull();
  });

  it("loads persisted history, marks it read, and renders markup as inert text", async () => {
    render(<CourseHelp courseId="course-1" />);
    await userEvent.click(await screen.findByRole("button", { name: /Ask a teacher/ }));

    expect(await screen.findByText(teacherMessage.content)).toBeDefined();
    expect(document.querySelector("img")).toBeNull();
    expect(api.messages).toHaveBeenCalledWith("learner", conversation.id, 0);
    expect(api.markRead).toHaveBeenCalledWith("learner", conversation.id, 1);
    expect(screen.getAllByText("Live")).toHaveLength(2);
  });

  it("keeps a message visibly pending until the server acknowledges it", async () => {
    api.messages.mockResolvedValueOnce({ results: [], has_more: false, next_after_sequence: 0 });
    render(<CourseHelp courseId="course-1" />);
    await userEvent.click(await screen.findByRole("button", { name: /Ask a teacher/ }));
    await userEvent.type(await screen.findByLabelText("Message your teacher"), "Please explain question four");
    await userEvent.click(screen.getByRole("button", { name: "Send to teacher" }));

    expect(screen.getByText("Sending…")).toBeDefined();
    const command = socket.send.mock.calls.at(-1)?.[0] as { client_message_id: string; request_id: string };
    socket.emit?.({
      v: 1,
      type: "message.accepted",
      request_id: command.request_id,
      created: true,
      message: { ...teacherMessage, id: "message-2", sequence: 2, sender: person, sender_role: "STUDENT", content: "Please explain question four", client_message_id: command.client_message_id },
    });
    expect(await screen.findByLabelText("You message")).toBeDefined();
    expect(screen.queryByText("Sending…")).toBeNull();
  });

  it("shows a retry action when a message cannot reach a live socket", async () => {
    socket.sendResult = false;
    api.messages.mockResolvedValueOnce({ results: [], has_more: false, next_after_sequence: 0 });
    render(<CourseHelp courseId="course-1" />);
    await userEvent.click(await screen.findByRole("button", { name: /Ask a teacher/ }));
    await userEvent.type(await screen.findByLabelText("Message your teacher"), "Can you help?");
    await userEvent.click(screen.getByRole("button", { name: "Send to teacher" }));
    expect(screen.getByText("Not sent")).toBeDefined();
    expect(screen.getByRole("button", { name: /Retry/ })).toBeDefined();
  });

  it("keeps expired-enrollment history readable without a composer", async () => {
    api.availability.mockResolvedValueOnce({ available: false, conversation: { ...conversation, can_send: false } });
    render(<CourseHelp courseId="course-1" />);
    await userEvent.click(await screen.findByRole("button", { name: /Ask a teacher/ }));
    expect(await screen.findByText(/no longer active/)).toBeDefined();
    expect(screen.queryByLabelText("Message your teacher")).toBeNull();
  });

  it("combines both helpers behind one launcher with tabs", async () => {
    learner.course.mockResolvedValue({ id: "course-1", chatbot_available: true });
    render(<CourseHelp courseId="course-1" />);
    await userEvent.click(await screen.findByRole("button", { name: /Get help/ }));
    expect(screen.getByRole("tab", { name: /Ask a teacher/ }).getAttribute("aria-selected")).toBe("true");
    await userEvent.click(screen.getByRole("tab", { name: /Course tutor/ }));
    expect(screen.getByLabelText("Message course tutor")).toBeDefined();
    expect(screen.getByRole("dialog").getAttribute("aria-modal")).toBe("false");
  });
});
