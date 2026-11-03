"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { RefreshCcw, Send } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SupportApiError, supportChatApi } from "@/lib/support-chat/api";
import { mergeSupportMessages } from "@/lib/support-chat/reducer";
import { SupportSocketClient } from "@/lib/support-chat/socket-client";
import type { SupportConnectionState, SupportConversation, SupportMessage, SupportServerEvent } from "@/lib/support-chat/types";
import { cn } from "@/lib/utils";

type PendingMessage = {
  clientId: string;
  requestId: string;
  content: string;
  status: "sending" | "failed";
};

const connectionCopy: Record<SupportConnectionState, string> = {
  idle: "Not connected",
  connecting: "Connecting…",
  live: "Live",
  recovering: "Reconnecting…",
  offline: "Offline",
};

function uniqueId() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
}

function senderName(message: SupportMessage) {
  if (message.sender_role === "STUDENT") return "You";
  return `${message.sender.first_name} ${message.sender.last_name}`.trim() || "Course staff";
}

/** Conversation body for teacher support. Hosted inside the course help panel. */
export function CourseSupportPanel({ courseId, available, initialConversation, active, onUnreadChange }: {
  courseId: string;
  available: boolean;
  initialConversation: SupportConversation | null;
  active: boolean;
  onUnreadChange: (count: number) => void;
}) {
  const [conversation, setConversation] = useState<SupportConversation | null>(initialConversation);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [pending, setPending] = useState<PendingMessage[]>([]);
  const [connection, setConnection] = useState<SupportConnectionState>("idle");
  const open = active;
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const socketRef = useRef<SupportSocketClient | null>(null);
  const messagesRef = useRef<SupportMessage[]>([]);
  const endRef = useRef<HTMLDivElement>(null);

  const replaceMessages = useCallback((next: SupportMessage[] | ((current: SupportMessage[]) => SupportMessage[])) => {
    setMessages((current) => {
      const value = typeof next === "function" ? next(current) : next;
      messagesRef.current = value;
      return value;
    });
  }, []);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const unread = conversation?.unread_count ?? 0;

  useEffect(() => {
    onUnreadChange(unread);
  }, [onUnreadChange, unread]);

  useEffect(() => {
    if (open) textareaRef.current?.focus();
  }, [open]);

  const recover = useCallback(async (id: string, afterSequence: number) => {
    let cursor = afterSequence;
    let hasMore = true;
    let recovered: SupportMessage[] = [];
    while (hasMore) {
      const page = await supportChatApi.messages("learner", id, cursor);
      recovered = mergeSupportMessages(recovered, page.results);
      cursor = page.next_after_sequence;
      hasMore = page.has_more;
    }
    replaceMessages((current) => mergeSupportMessages(current, recovered));
    const recoveredIds = new Set(recovered.map((message) => message.client_message_id));
    setPending((current) => current.filter((item) => !recoveredIds.has(item.clientId)));
    if (cursor > 0) {
      await supportChatApi.markRead("learner", id, cursor);
      setConversation((current) => current?.id === id ? { ...current, unread_count: 0 } : current);
    }
  }, [replaceMessages]);

  const handleEvent = useCallback((event: SupportServerEvent) => {
    if (event.type === "message.created" || event.type === "message.accepted") {
      if (event.message.conversation !== conversation?.id) return;
      replaceMessages((current) => mergeSupportMessages(current, [event.message]));
      setPending((current) => current.filter((item) => item.clientId !== event.message.client_message_id));
      if (event.type === "message.created") {
        setConversation((current) => current ? { ...current, ...event.conversation, last_message: event.message } : current);
      }
      if (open && event.message.sequence > 0) {
        socketRef.current?.send({
          v: 1,
          type: "conversation.read",
          request_id: uniqueId(),
          conversation_id: event.message.conversation,
          sequence: event.message.sequence,
        });
      }
      return;
    }
    if (event.type === "conversation.updated" || event.type === "conversation.close.accepted") {
      setConversation((current) => current?.id === event.conversation.id ? { ...current, ...event.conversation } : current);
      return;
    }
    if (event.type === "error") {
      setPending((current) => current.map((item) => item.requestId === event.request_id ? { ...item, status: "failed" } : item));
      setError(event.error.message);
    }
  }, [conversation?.id, open, replaceMessages]);

  const conversationId = conversation?.id;

  useEffect(() => {
    if (!open || !conversationId) return;
    let active = true;
    setLoading(true);
    setError("");
    recover(conversationId, 0)
      .catch((caught) => active && setError(caught instanceof SupportApiError ? caught.message : "Could not load this conversation."))
      .finally(() => active && setLoading(false));
    const socket = new SupportSocketClient(
      () => supportChatApi.ticket("learner"),
      handleEvent,
      (state) => {
        setConnection(state);
        if (state === "recovering" || state === "offline") {
          setPending((current) => current.map((item) => item.status === "sending" ? { ...item, status: "failed" } : item));
        }
      },
      () => {
        const lastSequence = messagesRef.current.at(-1)?.sequence || 0;
        void recover(conversationId, lastSequence).catch(() => setError("Connected, but missed messages could not be recovered."));
      },
    );
    socketRef.current = socket;
    socket.connect();
    return () => {
      active = false;
      socket.disconnect();
      if (socketRef.current === socket) socketRef.current = null;
    };
  }, [conversationId, handleEvent, open, recover]);

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages, open, pending]);

  useEffect(() => {
    if (!open || conversation || !available) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    supportChatApi.openConversation(courseId)
      .then((opened) => !cancelled && setConversation(opened))
      .catch((caught) => !cancelled && setError(caught instanceof SupportApiError ? caught.message : "Could not start teacher support."))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [available, conversation, courseId, open]);

  function transmit(item: PendingMessage) {
    setError("");
    setPending((current) => current.map((row) => row.clientId === item.clientId ? { ...row, status: "sending" } : row));
    const sent = socketRef.current?.send({
      v: 1,
      type: "message.send",
      request_id: item.requestId,
      conversation_id: conversation!.id,
      client_message_id: item.clientId,
      content: item.content,
    });
    if (!sent) {
      setPending((current) => current.map((row) => row.clientId === item.clientId ? { ...row, status: "failed" } : row));
      setError("Message was not sent. Reconnect and retry.");
    }
  }

  function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = draft.trim();
    if (!content || !conversation?.can_send) return;
    const clientId = uniqueId();
    const item: PendingMessage = { clientId, requestId: uniqueId(), content, status: "sending" };
    setPending((current) => [...current, item]);
    setDraft("");
    transmit(item);
  }

  const canSend = Boolean(conversation?.can_send);
  return (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex items-center gap-2 border-b px-4 py-2.5 text-xs text-muted-foreground">
            <span className="min-w-0 flex-1">Saved here, so you can come back to it anytime.</span>
            <Badge variant={connection === "live" ? "secondary" : "outline"}>{connectionCopy[connection]}</Badge>
            {connection === "offline" && <Button type="button" size="xs" variant="outline" onClick={() => socketRef.current?.reconnect()}>Reconnect</Button>}
          </div>
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4" aria-label="Teacher support conversation" aria-busy={loading}>
            {loading && messages.length === 0 ? <p className="my-auto text-center text-sm text-muted-foreground" role="status">Loading conversation…</p> : null}
            {!loading && messages.length === 0 ? (
              <div className="my-auto border-l-2 border-primary/50 pl-4 text-sm leading-6 text-muted-foreground">
                Ask about course material, deadlines, or anything blocking your progress. Your conversation is saved here.
              </div>
            ) : null}
            {messages.map((message) => {
              const own = message.sender_role === "STUDENT";
              return (
                <article key={message.id} aria-label={`${senderName(message)} message`} className={cn("max-w-[88%]", own && "ml-auto text-right")}>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">{senderName(message)}</p>
                  <p className={cn("whitespace-pre-wrap break-words rounded-xl px-3 py-2.5 text-left text-sm leading-6", own ? "bg-primary text-primary-foreground" : "bg-muted text-foreground")}>{message.content}</p>
                </article>
              );
            })}
            {pending.map((item) => (
              <article key={item.clientId} className="ml-auto max-w-[88%] text-right" aria-label="Your pending message">
                <p className="rounded-xl border border-dashed bg-primary/5 px-3 py-2.5 text-left text-sm leading-6">{item.content}</p>
                <div className="mt-1 flex items-center justify-end gap-2 text-xs text-muted-foreground">
                  <span>{item.status === "sending" ? "Sending…" : "Not sent"}</span>
                  {item.status === "failed" ? <Button type="button" variant="ghost" size="sm" onClick={() => transmit(item)}><RefreshCcw data-icon="inline-start" />Retry</Button> : null}
                </div>
              </article>
            ))}
            <div ref={endRef} />
          </div>
          <div className="border-t p-4">
            {error ? <Alert variant="destructive" className="mb-3" role="alert"><AlertDescription>{error}</AlertDescription></Alert> : null}
            {canSend ? (
              <form onSubmit={send} className="flex items-end gap-2">
                <Textarea
                  ref={textareaRef}
                  aria-label="Message your teacher"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                      event.preventDefault();
                      event.currentTarget.form?.requestSubmit();
                    }
                  }}
                  maxLength={2000}
                  rows={2}
                  placeholder="Write a message…"
                  disabled={!conversation}
                />
                <Button type="submit" size="icon-lg" aria-label="Send to teacher" disabled={!conversation || !draft.trim()}><Send /></Button>
              </form>
            ) : (
              <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">This course is no longer active for you. You can still read the saved conversation.</p>
            )}
            <p className="mt-2 text-xs text-muted-foreground" aria-live="polite">
              {pending.some((item) => item.status === "failed") ? "A message needs to be retried." : connectionCopy[connection]}
            </p>
          </div>
        </div>
  );
}
