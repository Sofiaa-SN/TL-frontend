import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import LearnerCourseLayout from "@/app/learn/(app)/courses/[courseId]/layout";

vi.mock("@/components/learner/course-help", () => ({
  CourseHelp: ({ courseId }: { courseId: string }) => <button data-course={courseId}>Get help</button>,
}));

afterEach(cleanup);

describe("learner course help placement", () => {
  it("mounts one help launcher after the course content", async () => {
    render(await LearnerCourseLayout({ children: <div>Course content</div>, params: Promise.resolve({ courseId: "course-1" }) }));
    const content = screen.getByText("Course content");
    const help = screen.getByRole("button", { name: "Get help" });
    expect(content.compareDocumentPosition(help) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(help.getAttribute("data-course")).toBe("course-1");
  });
});
