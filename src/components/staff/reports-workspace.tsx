"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, BookOpenCheck, CircleCheck, Clock3, Download, GraduationCap, RefreshCcw, Target, TrendingUp, UsersRound } from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { ResourceHub } from "@/components/staff/resource-hub";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/curriculum/api";
import { staffApi, type ReportsOverview } from "@/lib/staff/api";
import { cn } from "@/lib/utils";

const number = new Intl.NumberFormat("en-IN");
const dateFormat = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" });
const timeFormat = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

function percent(value: number | null | undefined) {
  return value == null ? "—" : `${Math.round(value)}%`;
}

function daysAgo(value: string | null) {
  if (!value) return "Never started";
  const days = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000));
  return days === 0 ? "Today" : days === 1 ? "Yesterday" : `${days} days ago`;
}

function StatTile({ icon: Icon, label, value, hint }: { icon: LucideIcon; label: string; value: string; hint: string }) {
  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-1">
        <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Icon className="size-4 text-brand-teal-strong" aria-hidden="true" />{label}
        </span>
        <span className="font-heading text-3xl font-semibold tracking-tight tabular-nums">{value}</span>
        <span className="text-xs text-muted-foreground">{hint}</span>
      </CardContent>
    </Card>
  );
}

function WeeklyActivityChart({ data }: { data: ReportsOverview["activity"] }) {
  const [active, setActive] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);
  const max = Math.max(1, ...data.map((row) => row.learners));
  const ticks = [...new Set([0, Math.ceil(max / 2), max])];
  const height = 160;

  return (
    <Card>
      <CardHeader className="grid-cols-[1fr_auto]">
        <div>
          <CardTitle>Active learners per week</CardTitle>
          <CardDescription>Learners who opened at least one activity, last {data.length} weeks.</CardDescription>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={() => setShowTable((value) => !value)} aria-pressed={showTable}>
          {showTable ? "Show chart" : "Show table"}
        </Button>
      </CardHeader>
      <CardContent>
        {showTable ? (
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-xs text-muted-foreground"><th className="py-2 font-medium">Week of</th><th className="py-2 text-right font-medium">Active learners</th><th className="py-2 text-right font-medium">Activities opened</th></tr></thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.week} className="border-b last:border-0"><td className="py-2">{dateFormat.format(new Date(row.week))}</td><td className="py-2 text-right tabular-nums">{row.learners}</td><td className="py-2 text-right tabular-nums">{row.activities}</td></tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="relative">
            <div className="grid grid-cols-[2rem_1fr] gap-2">
              <div className="relative text-right text-xs text-muted-foreground" style={{ height }} aria-hidden="true">
                {ticks.map((tick) => <span key={tick} className="absolute right-0 -translate-y-1/2 tabular-nums" style={{ top: height - (tick / max) * height }}>{tick}</span>)}
              </div>
              <div className="relative" style={{ height }} onMouseLeave={() => setActive(null)}>
                {ticks.map((tick) => <div key={tick} className="absolute inset-x-0 border-t border-border/70" style={{ top: height - (tick / max) * height }} aria-hidden="true" />)}
                <div className="absolute inset-0 flex items-end gap-[2px]" role="list" aria-label="Active learners per week">
                  {data.map((row, index) => (
                    <div
                      key={row.week}
                      role="listitem"
                      tabIndex={0}
                      aria-label={`Week of ${dateFormat.format(new Date(row.week))}: ${row.learners} active learners, ${row.activities} activities opened`}
                      className="group relative flex h-full flex-1 items-end justify-center outline-none"
                      onMouseEnter={() => setActive(index)}
                      onFocus={() => setActive(index)}
                      onBlur={() => setActive(null)}
                    >
                      <div
                        className={cn("w-full max-w-10 rounded-t-[4px] bg-chart-1 transition-opacity", active !== null && active !== index && "opacity-50")}
                        style={{ height: row.learners ? Math.max(2, (row.learners / max) * height) : 0 }}
                      />
                      {active === index && (
                        <div className="pointer-events-none absolute bottom-full z-10 mb-2 w-max rounded-lg border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
                          <p className="font-semibold">Week of {dateFormat.format(new Date(row.week))}</p>
                          <p className="text-muted-foreground"><span className="font-medium text-foreground tabular-nums">{row.learners}</span> active learners</p>
                          <p className="text-muted-foreground"><span className="font-medium text-foreground tabular-nums">{row.activities}</span> activities opened</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-2 grid grid-cols-[2rem_1fr] gap-2 text-xs text-muted-foreground" aria-hidden="true">
              <span />
              <div className="flex gap-[2px]">
                {data.map((row, index) => <span key={row.week} className="flex-1 truncate text-center">{index % 2 === data.length % 2 ? "" : dateFormat.format(new Date(row.week))}</span>)}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const STATUS_SERIES = [
  { key: "completed", label: "Completed", className: "bg-chart-2" },
  { key: "in_progress", label: "In progress", className: "bg-chart-1" },
  { key: "not_started", label: "Not started", className: "bg-muted-foreground/25" },
] as const;

function CourseTable({ courses }: { courses: ReportsOverview["courses"] }) {
  return (
    <Card>
      <CardHeader className="grid-cols-[1fr_auto]">
        <div>
          <CardTitle>Course progress</CardTitle>
          <CardDescription>Active enrolments by status, with learning check results.</CardDescription>
        </div>
        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground" aria-label="Legend">
          {STATUS_SERIES.map((series) => (
            <li key={series.key} className="flex items-center gap-1.5"><span className={cn("size-2.5 rounded-sm", series.className)} aria-hidden="true" />{series.label}</li>
          ))}
        </ul>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full min-w-[42rem] text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              <th className="py-2 pr-4 font-medium">Course</th>
              <th className="py-2 pr-4 text-right font-medium">Learners</th>
              <th className="w-[32%] py-2 pr-4 font-medium">Status</th>
              <th className="py-2 pr-4 text-right font-medium">Avg progress</th>
              <th className="py-2 pr-4 text-right font-medium">Check pass rate</th>
              <th className="py-2 text-right font-medium">Avg score</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((course) => (
              <tr key={course.id} className="border-b last:border-0">
                <td className="py-3 pr-4"><span className="font-medium">{course.name}</span><span className="block text-xs text-muted-foreground">{course.code}</span></td>
                <td className="py-3 pr-4 text-right tabular-nums">{number.format(course.enrolled)}</td>
                <td className="py-3 pr-4">
                  <div
                    className="flex h-2.5 gap-[2px] overflow-hidden rounded-full"
                    role="img"
                    aria-label={`${course.completed} completed, ${course.in_progress} in progress, ${course.not_started} not started`}
                  >
                    {STATUS_SERIES.map((series) => {
                      const value = course[series.key];
                      return value ? <div key={series.key} className={cn("h-full first:rounded-l-full last:rounded-r-full", series.className)} style={{ flexGrow: value }} title={`${series.label}: ${value}`} /> : null;
                    })}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground tabular-nums">{course.completed} done · {course.in_progress} in progress · {course.not_started} not started</p>
                </td>
                <td className="py-3 pr-4 text-right tabular-nums">{percent(course.average_progress)}</td>
                <td className="py-3 pr-4 text-right tabular-nums">{percent(course.check_pass_rate)}{course.check_attempts ? <span className="block text-xs text-muted-foreground">{course.check_attempts} attempts</span> : null}</td>
                <td className="py-3 text-right tabular-nums">{percent(course.average_check_score)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

function AttentionList({ rows, days }: { rows: ReportsOverview["attention"]; days: number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Learners who may need a nudge</CardTitle>
        <CardDescription>Not finished and no activity in the last {days} days.</CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="flex items-center gap-2 rounded-lg bg-brand-teal-soft/60 p-4 text-sm"><CircleCheck className="size-4 text-brand-teal-strong" aria-hidden="true" />Everyone has been active recently.</p>
        ) : (
          <ul className="divide-y">
            {rows.map((row) => (
              <li key={row.enrollment_id}>
                <Link href={`/people/${row.student_id}`} className="group flex items-center gap-3 py-3 outline-none focus-visible:rounded-lg">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-indigo-soft text-sm font-semibold text-primary">{row.student.slice(0, 1).toUpperCase()}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium group-hover:text-primary">{row.student}</span>
                    <span className="block truncate text-xs text-muted-foreground">{row.course} · {Math.round(row.progress)}% complete</span>
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">{daysAgo(row.last_seen)}</span>
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function downloadCsv(report: ReportsOverview) {
  const header = ["Course", "Code", "Learners", "Completed", "In progress", "Not started", "Average progress %", "Check attempts", "Check pass rate %", "Average check score %"];
  const rows = report.courses.map((course) => [course.name, course.code, course.enrolled, course.completed, course.in_progress, course.not_started, course.average_progress, course.check_attempts, course.check_pass_rate ?? "", course.average_check_score ?? ""]);
  const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = Object.assign(document.createElement("a"), { href: url, download: `sofiaa-course-report-${report.generated_at.slice(0, 10)}.csv` });
  link.click();
  URL.revokeObjectURL(url);
}

export function ReportsWorkspace() {
  const { user } = useAuth();
  const [report, setReport] = useState<ReportsOverview | null>(null);
  const [error, setError] = useState<"denied" | "failed" | null>(null);
  const [loading, setLoading] = useState(true);
  const canViewProgress = Boolean(user?.permissions.includes("students.view_enrollment"));

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setReport(await staffApi.reports());
    } catch (caught) {
      setError(caught instanceof ApiError && caught.status === 403 ? "denied" : "failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (canViewProgress) void load();
    else setLoading(false);
  }, [canViewProgress, load]);

  const totals = report?.totals;

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-6 p-4 md:p-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[.16em] text-brand-teal-strong uppercase">Insights</p>
          <h1 className="mt-1 font-heading text-3xl font-semibold tracking-tight">Reports</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">How learners are progressing across the courses you can see.</p>
        </div>
        {report && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Updated {timeFormat.format(new Date(report.generated_at))}</span>
            <Button type="button" variant="outline" size="sm" onClick={() => void load()} disabled={loading}><RefreshCcw data-icon="inline-start" className={cn(loading && "animate-spin")} />Refresh</Button>
            <Button type="button" variant="outline" size="sm" onClick={() => downloadCsv(report)} disabled={!report.courses.length}><Download data-icon="inline-start" />Download CSV</Button>
          </div>
        )}
      </header>

      {canViewProgress && loading && !report && (
        <div className="flex flex-col gap-4" role="status">
          <span className="sr-only">Loading reports</span>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[0, 1, 2, 3].map((item) => <Skeleton key={item} className="h-28 rounded-xl" />)}</div>
          <Skeleton className="h-64 rounded-xl" />
        </div>
      )}

      {error === "failed" && (
        <Alert variant="destructive">
          <AlertTitle>Reports couldn’t be loaded</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center justify-between gap-3">Check your connection and try again.<Button type="button" size="sm" variant="outline" onClick={() => void load()}>Try again</Button></AlertDescription>
        </Alert>
      )}

      {totals && report && (
        totals.active_enrollments === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-start gap-3 py-6">
              <span className="grid size-12 place-items-center rounded-2xl bg-brand-indigo-soft text-primary"><GraduationCap className="size-6" aria-hidden="true" /></span>
              <h2 className="font-heading text-lg font-semibold">No active enrolments yet</h2>
              <p className="max-w-lg text-sm text-muted-foreground">Reports fill in once learners are assigned to courses. Assign a course to a student group to get started.</p>
              <Button render={<Link href="/student-groups" />} nativeButton={false}>Go to student groups<ArrowRight data-icon="inline-end" /></Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <section aria-label="Key figures" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatTile icon={UsersRound} label="Active learners" value={number.format(totals.learners)} hint={`${number.format(totals.active_enrollments)} active enrolments`} />
              <StatTile icon={TrendingUp} label="Average progress" value={percent(totals.average_progress)} hint={`${percent(totals.completion_rate)} of enrolments completed`} />
              <StatTile icon={Target} label="Check pass rate" value={percent(totals.check_pass_rate)} hint={totals.check_attempts ? `Avg score ${percent(totals.average_check_score)} · ${number.format(totals.check_attempts)} attempts` : "No learning checks submitted yet"} />
              <StatTile icon={Clock3} label="Time learning" value={`${number.format(totals.learning_hours ?? 0)} h`} hint="Tracked across all activities" />
            </section>
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
              <WeeklyActivityChart data={report.activity} />
              <AttentionList rows={report.attention} days={report.inactive_after_days} />
            </div>
            <CourseTable courses={report.courses} />
          </>
        )
      )}

      <section aria-labelledby="records-heading" className="flex flex-col gap-4">
        <div>
          <h2 id="records-heading" className="flex items-center gap-2 font-heading text-lg font-semibold"><BookOpenCheck className="size-5 text-brand-teal-strong" aria-hidden="true" />Detailed records</h2>
          <p className="text-sm text-muted-foreground">Individual progress entries, attempts and awards.</p>
        </div>
        <ResourceHub section="operations" embedded />
      </section>
    </main>
  );
}
