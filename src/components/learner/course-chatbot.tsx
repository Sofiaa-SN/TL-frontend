"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Bot, Send } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { LearnerApiError, learnerApi } from "@/lib/learner/api";
import type { ChatCitation } from "@/lib/learner/types";
import { cn } from "@/lib/utils";

type DisplayMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: ChatCitation[]; failed?: boolean };

export function CourseChatbot({ courseId }: { courseId: string }) {
  const [available, setAvailable] = useState(false);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const messageEndRef = useRef<HTMLDivElement>(null);
  const messageSequence = useRef(0);

  useEffect(() => {
    let active = true;
    setAvailable(false);
    setMessages([]);
    setSessionId(null);
    setError("");
    learnerApi.course(courseId)
      .then((course) => active && setAvailable(Boolean(course.chatbot_available)))
      .catch(() => active && setAvailable(false));
    return () => { active = false; };
  }, [courseId]);

  useEffect(() => {
    if (open) messageEndRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages, open, pending]);

  if (!available) return null;

  async function send(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    await ask(draft.trim());
  }

  async function ask(message: string, retryId?: string) {
    if (!message || pending) return;
    const userMessage: DisplayMessage = { id: retryId ?? `${courseId}-${++messageSequence.current}`, role: "user", content: message };
    setMessages((current) => retryId
      ? current.map((item) => item.id === retryId ? { ...item, failed: false } : item)
      : [...current, userMessage]);
    if (!retryId) setDraft("");
    setPending(true);
    setError("");
    try {
      const response = await learnerApi.sendCourseChat(courseId, message, sessionId);
      setSessionId(response.session_id);
      setMessages((current) => [...current, {
        id: `${courseId}-${++messageSequence.current}`,
        role: "assistant",
        content: response.reply,
        citations: response.citations,
      }]);
    } catch (caught) {
      if (caught instanceof LearnerApiError && caught.status === 404) setAvailable(false);
      setMessages((current) => current.map((item) => item.id === userMessage.id ? { ...item, failed: true } : item));
      setError(caught instanceof LearnerApiError ? caught.message : "The tutor couldn’t answer just now.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="brand" className="h-11 rounded-full px-4 shadow-lg shadow-brand-teal/25" />}>
        <Bot data-icon="inline-start" />Ask course tutor
      </SheetTrigger>
      <SheetContent side="right" className="w-full gap-0 sm:max-w-md">
        <SheetHeader className="border-b pr-12">
          <SheetTitle>Course tutor</SheetTitle>
          <SheetDescription>Answers come from this course’s materials.</SheetDescription>
        </SheetHeader>
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4" aria-label="Course tutor conversation">
            {messages.length === 0 && (
              <div className="my-auto rounded-xl border bg-muted/40 p-4 text-sm leading-6 text-muted-foreground">
                Ask anything about this course. If the course materials don’t cover it, I’ll tell you.
              </div>
            )}
            {messages.map((message) => (
              <article key={message.id} aria-label={`${message.role === "user" ? "Your" : "Course tutor"} message`} className={cn("max-w-[88%] rounded-xl px-3 py-2.5 text-sm", message.role === "user" ? "ml-auto bg-primary text-primary-foreground" : "bg-muted text-foreground")}>
                <p className="whitespace-pre-wrap break-words leading-6">{message.content}</p>
                {message.failed && (
                  <p className="mt-2 flex items-center gap-2 border-t border-current/20 pt-2 text-xs">
                    Not sent.
                    <button type="button" className="font-semibold underline underline-offset-2" onClick={() => void ask(message.content, message.id)} disabled={pending}>Retry</button>
                  </p>
                )}
                {message.citations?.length ? (
                  <details className="mt-2 border-t border-current/15 pt-2 text-xs">
                    <summary className="cursor-pointer font-medium">Supporting course context</summary>
                    <ul className="mt-2 space-y-2">
                      {message.citations.map((citation, index) => <li key={`${citation.chunk_id}-${index}`}><span className="font-semibold">{citation.chunk_id}</span>: “{citation.excerpt}”</li>)}
                    </ul>
                  </details>
                ) : null}
              </article>
            ))}
            {pending && <p className="text-sm text-muted-foreground" role="status">The tutor is looking through the course…</p>}
            <div ref={messageEndRef} />
          </div>
          <div className="border-t p-4">
            {error && <Alert variant="destructive" className="mb-3" role="alert"><AlertDescription>{error}</AlertDescription></Alert>}
            <form onSubmit={send} className="flex items-end gap-2">
              <Textarea
                aria-label="Message course tutor"
                aria-describedby="course-tutor-hint"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                    event.preventDefault();
                    void send();
                  }
                }}
                maxLength={1000}
                rows={2}
                placeholder="Ask about this course…"
                disabled={pending}
              />
              <Button type="submit" size="icon-lg" aria-label="Send message" disabled={pending || !draft.trim()}><Send /></Button>
            </form>
            <p id="course-tutor-hint" className="mt-2 text-xs text-muted-foreground">Press Enter to send · Shift+Enter for a new line</p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
