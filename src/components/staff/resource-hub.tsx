"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookCopy,
  ChevronDown,
  CircleCheckBig,
  ClipboardList,
  FileQuestion,
  FileText,
  FlaskConical,
  FolderOpen,
  GraduationCap,
  History,
  Layers,
  Link2,
  ListChecks,
  ListTodo,
  NotebookPen,
  PlaySquare,
  ShieldAlert,
  Sparkles,
  Target,
  UsersRound,
} from "lucide-react";
import { useEffect } from "react";

import { useAuth } from "@/components/auth-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { resourcesBySection, type StaffResourceDefinition } from "@/lib/staff/resources";

const sectionCopy: Record<StaffResourceDefinition["section"], { title: string; description: string }> = {
  curriculum: {
    title: "Curriculum",
    description: "Organise programs and courses and manage what learners can see.",
  },
  content: {
    title: "Content library",
    description: "Create the lessons, videos, experiments and practice inside each activity.",
  },
  media: {
    title: "Media library",
    description: "Upload and organise the files used in lessons.",
  },
  learners: {
    title: "Learners",
    description: "Manage learner accounts, enrolments and course assignments.",
  },
  assessments: {
    title: "Assessments",
    description: "Write questions and build learning checks and case studies.",
  },
  operations: {
    title: "Reports",
    description: "Review learner progress, assessment results and awards.",
  },
};

const ICONS: Record<string, LucideIcon> = {
  programs: Layers,
  courses: BookCopy,
  "activity-content": FileText,
  videos: PlaySquare,
  experiments: FlaskConical,
  "practice-sets": ListTodo,
  "practice-items": NotebookPen,
  "media-assets": FolderOpen,
  students: GraduationCap,
  "student-groups": UsersRound,
  "student-group-members": UsersRound,
  enrollments: CircleCheckBig,
  "course-assignments": ClipboardList,
  "external-user-mappings": Link2,
  questions: FileQuestion,
  "question-options": ListChecks,
  "case-studies": Target,
  "case-study-questions": ListChecks,
  "learning-checks": ListChecks,
  "learning-check-questions": ListChecks,
  "activity-progress-records": Target,
  "assessment-attempts": ClipboardList,
  "assessment-answers": ListChecks,
  "point-events": Sparkles,
  "badge-awards": Award,
  "legacy-assessment-attempts": History,
  "workshop-configs": History,
  "staff-workshop-models": History,
};

/** Link tables and compatibility records: still reachable, but out of the main path. */
const ADVANCED = new Set([
  "student-group-members",
  "external-user-mappings",
  "question-options",
  "case-study-questions",
  "learning-check-questions",
  "assessment-answers",
  "legacy-assessment-attempts",
  "workshop-configs",
  "staff-workshop-models",
]);

function ResourceCard({ resource, access }: { resource: StaffResourceDefinition; access: string }) {
  const Icon = ICONS[resource.key] ?? FileText;
  return (
    <Link href={`/manage/${resource.key}`} className="group rounded-xl" aria-label={`${resource.title}: ${access}`}>
      <Card className="h-full transition-shadow group-hover:shadow-md group-hover:ring-primary/30">
        <CardHeader className="grid-cols-[auto_1fr] items-start gap-x-4 gap-y-1">
          <span className="row-span-3 grid size-10 place-items-center rounded-xl bg-brand-indigo-soft text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
            <Icon className="size-5" aria-hidden="true" />
          </span>
          <CardTitle className="flex items-center gap-2">
            {resource.title}
            <ArrowRight className="size-4 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:text-primary group-hover:opacity-100" aria-hidden="true" />
          </CardTitle>
          <CardDescription>{resource.description}</CardDescription>
          <span className="mt-2 w-fit rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">{access}</span>
        </CardHeader>
      </Card>
    </Link>
  );
}

/** `embedded` renders only the record cards, for use inside another page. */
export function ResourceHub({ section, embedded = false }: { section: StaffResourceDefinition["section"]; embedded?: boolean }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const copy = sectionCopy[section];
  const resources = resourcesBySection(section).filter((resource) => user?.permissions.includes(resource.viewPermission));
  const single = !embedded && !loading && resources.length === 1 ? resources[0] : null;

  // A hub with one destination is just an extra click.
  useEffect(() => {
    if (single) router.replace(`/manage/${single.key}`);
  }, [router, single]);

  if (loading || single) {
    const Wrapper = embedded ? "div" : "main";
    return (
      <Wrapper className={embedded ? "grid gap-4 md:grid-cols-2" : "mx-auto grid max-w-7xl gap-4 p-4 md:grid-cols-2 md:p-8"} role="status">
        <span className="sr-only">Loading</span>
        {[0, 1, 2, 3].map((item) => <Skeleton key={item} className="h-36 rounded-xl" />)}
      </Wrapper>
    );
  }

  const accessFor = (resource: StaffResourceDefinition) => {
    if (resource.addPermission && user?.permissions.includes(resource.addPermission)) return "Create & edit";
    if (resource.changePermission && user?.permissions.includes(resource.changePermission)) return "Edit";
    return "View only";
  };
  const primary = resources.filter((resource) => !ADVANCED.has(resource.key));
  const advanced = resources.filter((resource) => ADVANCED.has(resource.key));

  if (embedded) {
    if (resources.length === 0) return null;
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {resources.map((resource) => <ResourceCard key={resource.key} resource={resource} access={accessFor(resource)} />)}
      </div>
    );
  }

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-8 p-4 md:p-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">{copy.title}</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{copy.description}</p>
      </header>

      {resources.length === 0 ? (
        <div className="flex flex-col gap-3">
          <Alert>
            <ShieldAlert />
            <AlertTitle>Nothing to show here</AlertTitle>
            <AlertDescription>Your role doesn’t include access to this area. Ask an administrator if you need it.</AlertDescription>
          </Alert>
          <Button render={<Link href="/dashboard" />} nativeButton={false} variant="outline" className="w-fit">
            <ArrowLeft data-icon="inline-start" />Back to dashboard
          </Button>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {primary.map((resource) => <ResourceCard key={resource.key} resource={resource} access={accessFor(resource)} />)}
          </div>
          {advanced.length > 0 && (
            <details className="group/advanced rounded-xl border bg-card">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-5 py-4 [&::-webkit-details-marker]:hidden">
                <span>
                  <span className="block text-sm font-semibold">Advanced records</span>
                  <span className="block text-xs text-muted-foreground">Link tables and older records. Most tasks are easier from the main tools above.</span>
                </span>
                <ChevronDown className="size-4 text-muted-foreground transition-transform group-open/advanced:rotate-180" aria-hidden="true" />
              </summary>
              <div className="grid gap-4 border-t p-5 md:grid-cols-2 xl:grid-cols-3">
                {advanced.map((resource) => <ResourceCard key={resource.key} resource={resource} access={accessFor(resource)} />)}
              </div>
            </details>
          )}
        </>
      )}
    </main>
  );
}
