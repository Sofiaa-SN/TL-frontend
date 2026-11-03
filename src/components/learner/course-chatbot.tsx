"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { LearnerApiError, learnerApi } from "@/lib/learner/api";
import type { ChatCitation } from "@/lib/learner/types";
import { cn } from "@/lib/utils";

type DisplayMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: ChatCitation[];
  failed?: boolean;
};

const STARTERS = [
  "What are the key ideas in this course?",
  "Explain a key term from this course with an example",
  "What should I revise before the learning check?",
];

/** Conversation body for the AI course tutor. Hosted inside the course help panel. */
export function CourseTutorPanel({ courseId, active, onUnavailable }: { courseId: string; active: boolean; onUnavailable: () => void }) {
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const messageEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messageSequence = useRef(0);

  useEffect(() => {
    setMessages([]);
    setSessionId(null);
    setError("");
  }, [courseId]);

  useEffect(() => {
    if (active) messageEndRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages, active, pending]);

  useEffect(() => {
    if (active) inputRef.current?.focus();
  }, [active]);

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
      if (caught instanceof LearnerApiError && caught.status === 404) onUnavailable();
      setMessages((current) => current.map((item) => item.id === userMessage.id ? { ...item, failed: true } : item));
      setError(caught instanceof LearnerApiError ? caught.message : "The tutor couldn’t answer just now.");
    } finally {
      setPending(false);
      inputRef.current?.focus();
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4" aria-label="Course tutor conversation" aria-live="polite">
        {messages.length === 0 && (
          <div className="my-auto flex flex-col gap-3">
            <div className="rounded-xl border bg-brand-teal-soft/60 p-4 text-sm leading-6 text-foreground">
              <p className="flex items-center gap-2 font-semibold"><Sparkles className="size-4 text-brand-teal-strong" aria-hidden="true" />Ask anything about this course</p>
              <p className="mt-1 text-muted-foreground">Answers come only from this course’s materials. If they don’t cover your question, the tutor will say so.</p>
            </div>
            <p className="text-xs font-medium text-muted-foreground">Try asking</p>
            <div className="flex flex-col gap-2">
              {STARTERS.map((starter) => (
                <button key={starter} type="button" onClick={() => void ask(starter)} className="rounded-lg border bg-card px-3 py-2 text-left text-sm transition-colors hover:border-primary/40 hover:bg-accent">
                  {starter}
                </button>
              ))}
            </div>
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
        {pending && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
            <span className="flex gap-1" aria-hidden="true">
              <span className="size-1.5 animate-bounce rounded-full bg-brand-teal [animation-delay:-0.2s]" />
              <span className="size-1.5 animate-bounce rounded-full bg-brand-teal [animation-delay:-0.1s]" />
              <span className="size-1.5 animate-bounce rounded-full bg-brand-teal" />
            </span>
            The tutor is looking through the course…
          </p>
        )}
        <div ref={messageEndRef} />
      </div>
      <div className="border-t p-4">
        {error && <Alert variant="destructive" className="mb-3" role="alert"><AlertDescription>{error}</AlertDescription></Alert>}
        <form onSubmit={send} className="flex items-end gap-2">
          <Textarea
            ref={inputRef}
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
  );
}
