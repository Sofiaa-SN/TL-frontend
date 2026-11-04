"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Bot, LifeBuoy, MessageCircleQuestion, X } from "lucide-react";

import { CourseTutorPanel } from "@/components/learner/course-chatbot";
import { CourseSupportPanel } from "@/components/learner/course-support-chat";
import { Button } from "@/components/ui/button";
import { learnerApi } from "@/lib/learner/api";
import { publishedVersion } from "@/lib/learner/course";
import { supportChatApi } from "@/lib/support-chat/api";
import type { SupportConversation } from "@/lib/support-chat/types";
import { cn } from "@/lib/utils";

type Tab = "tutor" | "teacher";

const TABS: Record<Tab, { label: string; title: string; description: string; icon: typeof Bot }> = {
  tutor: { label: "Course tutor", title: "Course tutor", description: "Instant answers from this course’s materials.", icon: Bot },
  teacher: { label: "Ask a teacher", title: "Teacher support", description: "Message the staff who teach this course.", icon: MessageCircleQuestion },
};

/**
 * One help launcher for a course. It opens a docked, non-modal panel so learners
 * can keep reading the activity while they ask the AI tutor or a teacher.
 * Hidden during learning checks.
 */
export function CourseHelp({ courseId }: { courseId: string }) {
  const pathname = usePathname() ?? "";
  const [tutorAvailable, setTutorAvailable] = useState(false);
  const [starters, setStarters] = useState<string[]>([]);
  const [teacherAvailable, setTeacherAvailable] = useState(false);
  const [conversation, setConversation] = useState<SupportConversation | null>(null);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<Tab>("tutor");
  const launcherRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const titleId = useId();

  useEffect(() => {
    let active = true;
    learnerApi.course(courseId)
      .then((course) => {
        if (!active) return;
        setTutorAvailable(Boolean(course.chatbot_available));
        // Chapter titles make good first questions: they match the course's approved context.
        const chapters = (Array.isArray(course.versions) ? publishedVersion(course) : course.published_version)?.chapters ?? [];
        setStarters([...chapters].sort((a, b) => a.display_order - b.display_order).slice(0, 3).map((chapter) => `Help me understand “${chapter.title}”`));
      })
      .catch(() => active && setTutorAvailable(false));
    supportChatApi.availability(courseId)
      .then((result) => {
        if (!active) return;
        setTeacherAvailable(result.available || Boolean(result.conversation));
        setConversation(result.conversation);
        setUnread(result.conversation?.unread_count ?? 0);
      })
      .catch(() => active && setTeacherAvailable(false));
    return () => { active = false; };
  }, [courseId]);

  const tabs = [tutorAvailable && "tutor", teacherAvailable && "teacher"].filter(Boolean) as Tab[];
  const currentTab: Tab | undefined = tabs.includes(tab) ? tab : tabs[0];
  const hidden = pathname.includes("/checks/") || tabs.length === 0;

  const close = useCallback(() => {
    setOpen(false);
    // The launcher re-renders once the panel closes; focus it on the next frame.
    requestAnimationFrame(() => launcherRef.current?.focus());
  }, []);

  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    root.dataset.helpPanel = "open";
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && panelRef.current?.contains(document.activeElement)) close();
    }
    document.addEventListener("keydown", onKey);
    return () => {
      delete root.dataset.helpPanel;
      document.removeEventListener("keydown", onKey);
    };
  }, [close, open]);

  useEffect(() => {
    if (hidden && open) setOpen(false);
  }, [hidden, open]);

  const onUnreadChange = useCallback((count: number) => setUnread(count), []);
  const onTutorUnavailable = useCallback(() => setTutorAvailable(false), []);

  if (hidden || !currentTab) return null;

  const single = tabs.length === 1;
  const launcherLabel = single ? (tabs[0] === "tutor" ? "Ask course tutor" : "Ask a teacher") : "Get help";
  const LauncherIcon = single ? TABS[tabs[0]].icon : LifeBuoy;
  const meta = TABS[currentTab];
  const MetaIcon = meta.icon;

  return (
    <>
      {!open && (
        <div className="fixed right-4 bottom-20 z-40 md:right-6 md:bottom-6">
          <Button
            ref={launcherRef}
            type="button"
            variant="brand"
            className="h-11 rounded-full px-4 shadow-lg shadow-brand-teal/25"
            aria-haspopup="dialog"
            onClick={() => {
              if (unread > 0) setTab("teacher");
              setMounted(true);
              setOpen(true);
            }}
          >
            <LauncherIcon data-icon="inline-start" />
            {launcherLabel}
            {unread > 0 && (
              <span className="ml-1 grid min-w-5 place-items-center rounded-full bg-white px-1 text-xs font-semibold text-brand-teal-strong" aria-label={`${unread} unread messages`}>
                {unread}
              </span>
            )}
          </Button>
        </div>
      )}
      {mounted && (
        <aside
          ref={panelRef}
          role="dialog"
          aria-modal="false"
          aria-labelledby={titleId}
          hidden={!open}
          className="fixed inset-0 z-50 flex flex-col bg-card text-card-foreground md:inset-y-0 md:right-0 md:left-auto md:w-[26rem] md:border-l md:shadow-2xl"
        >
          <header className="flex items-start gap-3 border-b px-4 pt-4 pb-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-teal-soft text-brand-teal-strong"><MetaIcon className="size-5" aria-hidden="true" /></span>
            <div className="min-w-0 flex-1">
              <h2 id={titleId} className="font-heading text-base font-semibold">{meta.title}</h2>
              <p className="text-xs text-muted-foreground">{meta.description}</p>
            </div>
            <Button type="button" variant="ghost" size="icon" aria-label="Close help" onClick={close}><X /></Button>
          </header>
          {!single && (
            <div role="tablist" aria-label="Help options" className="grid grid-cols-2 gap-1 border-b bg-muted/40 p-1.5">
              {tabs.map((key) => {
                const Icon = TABS[key].icon;
                const selected = key === currentTab;
                return (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    id={`${titleId}-${key}-tab`}
                    aria-selected={selected}
                    aria-controls={`${titleId}-${key}-panel`}
                    tabIndex={selected ? 0 : -1}
                    onClick={() => setTab(key)}
                    onKeyDown={(event) => {
                      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
                      const next = tabs[(tabs.indexOf(key) + 1) % tabs.length];
                      setTab(next);
                      document.getElementById(`${titleId}-${next}-tab`)?.focus();
                    }}
                    className={cn(
                      "inline-flex h-9 items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors",
                      selected ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                    {TABS[key].label}
                    {key === "teacher" && unread > 0 && <span className="grid min-w-5 place-items-center rounded-full bg-brand-teal px-1 text-xs text-white">{unread}</span>}
                  </button>
                );
              })}
            </div>
          )}
          {teacherAvailable && (
            <div role={single ? undefined : "tabpanel"} id={`${titleId}-teacher-panel`} aria-labelledby={single ? undefined : `${titleId}-teacher-tab`} hidden={currentTab !== "teacher"} className="flex min-h-0 flex-1 flex-col">
              <CourseSupportPanel
                courseId={courseId}
                available={teacherAvailable}
                initialConversation={conversation}
                active={open && currentTab === "teacher"}
                onUnreadChange={onUnreadChange}
              />
            </div>
          )}
          {tutorAvailable && (
            <div role={single ? undefined : "tabpanel"} id={`${titleId}-tutor-panel`} aria-labelledby={single ? undefined : `${titleId}-tutor-tab`} hidden={currentTab !== "tutor"} className="flex min-h-0 flex-1 flex-col">
              <CourseTutorPanel courseId={courseId} starters={starters} active={open && currentTab === "tutor"} onUnavailable={onTutorUnavailable} />
            </div>
          )}
        </aside>
      )}
    </>
  );
}
