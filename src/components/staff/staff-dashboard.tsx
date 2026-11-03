"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BookOpen,
  ChartNoAxesColumn,
  GraduationCap,
  Layers,
  LibraryBig,
  Plus,
  UsersRound,
} from "lucide-react";
import { useEffect, useState } from "react";

import { canSee, navigation, roleName } from "@/components/admin-shell";
import { useAuth } from "@/components/auth-provider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { staffApi, type StaffSummaryRecord } from "@/lib/staff/api";

type DashboardModule = {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  permissions: string[];
};

const DESCRIPTIONS: Record<string, string> = {
  "/courses": "Build programs and courses, organise chapters and publish new versions.",
  "/content": "Write lesson content and set up videos, experiments and practice.",
  "/media": "Upload and organise videos, images and documents for lessons.",
  "/assessments": "Write questions and build learning checks and case studies.",
  "/learners": "Manage learner accounts, enrolments and course assignments.",
  "/student-groups": "Organise cohorts, assign teachers and deliver courses to groups.",
  "/chats": "Answer learner questions from the courses you support.",
  "/people": "Add staff and learners and review the people in your institution.",
  "/access": "Assign roles and control what each account can do.",
  "/operations": "Review progress, assessment results, awards and activity records.",
  "/opportunities": "Publish internships and roles, then review applicants.",
};

/** Dashboard workspace cards, derived from the sidebar so the two never drift apart. */
export const modules: DashboardModule[] = navigation
  .filter((item) => item.href !== "/dashboard")
  .map((item) => ({
    title: item.label,
    description: DESCRIPTIONS[item.href] ?? "",
    href: item.href,
    icon: item.icon,
    permissions: item.permissions ?? [],
  }));

const RECORD_ICONS: Record<string, LucideIcon> = {
  programs: Layers,
  courses: BookOpen,
  students: GraduationCap,
  enrollments: UsersRound,
  "course-progress": ChartNoAxesColumn,
};

const RECORD_HINTS: Record<string, string> = {
  programs: "Programs you can see",
  courses: "Courses in your catalogue",
  students: "Learners you can support",
  enrollments: "Active course enrolments",
  "course-progress": "Learners with recorded progress",
};

function greeting() {
  const hour = new Date().getHours();
  return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
}

export function StaffDashboard() {
  const { user, loading } = useAuth();
  const [summary, setSummary] = useState<StaffSummaryRecord[]>([]);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState("");
  const userId = user?.id;

  useEffect(() => {
    if (!userId) {
      setSummary([]);
      setSummaryLoading(false);
      return;
    }
    setSummaryLoading(true);
    setSummaryError("");
    staffApi
      .summary()
      .then((payload) => setSummary(payload.records))
      .catch(() => setSummaryError("We couldn’t load your totals. Refresh the page to try again."))
      .finally(() => setSummaryLoading(false));
  }, [userId]);

  if (loading || !user) {
    return (
      <main className="mx-auto grid max-w-7xl gap-4 p-4 md:grid-cols-2 md:p-8 lg:grid-cols-3" role="status">
        <span className="sr-only">Loading dashboard</span>
        {[0, 1, 2, 3, 4, 5].map((item) => <Skeleton key={item} className="h-40 rounded-xl" />)}
      </main>
    );
  }

  const visibleModules = modules.filter((module) => {
    const item = navigation.find((entry) => entry.href === module.href);
    return item ? canSee(item, user.permissions, user.features) : false;
  });
  const firstName = user.display_name.split(" ")[0] || user.display_name;
  const canCreateCourse = user.permissions.includes("curriculum.add_course");
  const canCreateGroup = user.permissions.includes("students.manage_student_groups");
  const today = new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long" }).format(new Date());

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-10 p-4 md:p-8">
      <header className="brand-hero relative overflow-hidden rounded-2xl px-6 py-8 shadow-lg shadow-primary/10 md:px-10 md:py-10">
        <p className="text-sm font-medium text-white/70">{today} · {roleName(user.groups)}</p>
        <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight text-white md:text-4xl">
          {greeting()}, {firstName}.
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-white/80 md:text-base">
          Here’s what’s happening across your courses and learners today.
        </p>
        {(canCreateCourse || canCreateGroup) && (
          <div className="mt-6 flex flex-wrap gap-3">
            {canCreateCourse && (
              <Button render={<Link href="/courses" />} nativeButton={false} className="bg-white text-primary hover:bg-white/90">
                <Plus data-icon="inline-start" />New course
              </Button>
            )}
            {canCreateGroup && (
              <Button render={<Link href="/student-groups" />} nativeButton={false} variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white">
                <UsersRound data-icon="inline-start" />Manage student groups
              </Button>
            )}
          </div>
        )}
        <span aria-hidden="true" className="pointer-events-none absolute -top-16 -right-16 size-64 rounded-full border-[28px] border-white/5" />
      </header>

      <section aria-labelledby="glance-heading">
        <h2 id="glance-heading" className="mb-4 text-lg font-semibold">At a glance</h2>
        {summaryError && (
          <Alert variant="destructive" role="alert" className="mb-4">
            <AlertDescription>{summaryError}</AlertDescription>
          </Alert>
        )}
        {summaryLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5" role="status">
            {[0, 1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-32 rounded-xl" />)}
            <span className="sr-only">Loading totals</span>
          </div>
        ) : summary.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {summary.map((record) => {
              const Icon = RECORD_ICONS[record.key] ?? LibraryBig;
              return (
                <Link
                  key={record.key}
                  href={record.href}
                  aria-label={`${record.label}: ${record.count.toLocaleString("en-IN")}. View ${record.label.toLowerCase()}`}
                  className="group rounded-xl"
                >
                  <Card size="sm" className="h-full transition-shadow group-hover:shadow-md group-hover:ring-primary/30">
                    <CardHeader className="gap-3">
                      <span className="grid size-9 place-items-center rounded-lg bg-brand-indigo-soft text-primary">
                        <Icon className="size-4" aria-hidden="true" />
                      </span>
                      <CardTitle className="font-heading text-3xl font-semibold tabular-nums">
                        {record.count.toLocaleString("en-IN")}
                      </CardTitle>
                      <CardDescription className="flex items-center justify-between gap-2">
                        <span>
                          <span className="block font-medium text-foreground">{record.label}</span>
                          <span className="text-xs">{RECORD_HINTS[record.key]}</span>
                        </span>
                        <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden="true" />
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No totals are available for your role yet.</p>
        )}
      </section>

      <section aria-labelledby="workspaces-heading">
        <div className="mb-4">
          <h2 id="workspaces-heading" className="text-lg font-semibold">Your workspaces</h2>
          <p className="mt-1 text-sm text-muted-foreground">Jump into the areas your role manages.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleModules.map((module) => {
            const Icon = module.icon;
            return (
              <Link key={module.href} href={module.href} className="group rounded-xl">
                <Card className="h-full transition-shadow group-hover:shadow-md group-hover:ring-primary/30">
                  <CardHeader className="grid-cols-[auto_1fr] items-start gap-x-4 gap-y-1">
                    <span className="row-span-2 grid size-11 place-items-center rounded-xl bg-brand-indigo-soft text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <CardTitle className="flex items-center gap-2">
                      {module.title}
                      <ArrowRight className="size-4 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:text-primary group-hover:opacity-100" aria-hidden="true" />
                    </CardTitle>
                    <CardDescription>{module.description}</CardDescription>
                  </CardHeader>
                  <CardContent />
                </Card>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
