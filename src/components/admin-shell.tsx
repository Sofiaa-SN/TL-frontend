"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  BriefcaseBusiness,
  ChartColumn,
  ClipboardCheck,
  FileStack,
  FolderOpen,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  MessagesSquare,
  ShieldCheck,
  UserRoundCog,
  UsersRound,
} from "lucide-react";
import { useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { BrandMark, LearnerMark } from "@/components/learner/brand";
import { ThemeToggle } from "@/components/theme";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/toast";
import type { User } from "@/lib/curriculum/types";
import { staffResources } from "@/lib/staff/resources";
import { cn } from "@/lib/utils";

type NavigationItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  group: "Overview" | "Teach" | "People" | "Insights" | "Careers";
  permissions?: string[];
  feature?: "support_chat";
};

export const navigation: NavigationItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, group: "Overview" },
  {
    href: "/courses",
    label: "Curriculum",
    icon: BookOpen,
    group: "Teach",
    permissions: ["curriculum.view_course"],
  },
  {
    href: "/content",
    label: "Content",
    icon: FileStack,
    group: "Teach",
    permissions: [
      "content.view_activitycontent",
      "content.view_video",
      "content.view_experiment",
    ],
  },
  {
    href: "/media",
    label: "Media",
    icon: FolderOpen,
    group: "Teach",
    permissions: ["media_library.view_mediaasset"],
  },
  {
    href: "/assessments",
    label: "Assessments",
    icon: ClipboardCheck,
    group: "Teach",
    permissions: [
      "assessments.view_question",
      "assessments.view_learningcheck",
    ],
  },
  {
    href: "/learners",
    label: "Learners",
    icon: GraduationCap,
    group: "People",
    permissions: ["students.view_studentgroup", "students.view_enrollment"],
  },
  {
    href: "/student-groups",
    label: "Student groups",
    icon: UsersRound,
    group: "People",
    permissions: ["students.view_studentgroup"],
  },
  {
    href: "/chats",
    label: "Support chats",
    icon: MessagesSquare,
    group: "People",
    feature: "support_chat",
    permissions: [
      "tutoring.reply_to_assigned_course_support_chats",
      "tutoring.view_all_course_support_chats",
    ],
  },
  {
    href: "/people",
    label: "Staff directory",
    icon: UserRoundCog,
    group: "People",
    permissions: ["accounts.manage_users"],
  },
  {
    href: "/access",
    label: "Access & roles",
    icon: ShieldCheck,
    group: "People",
    permissions: ["accounts.manage_users"],
  },
  {
    href: "/operations",
    label: "Reports",
    icon: ChartColumn,
    group: "Insights",
    permissions: [
      "progress.view_activityprogress",
      "assessments.view_assessmentattempt",
      "assessments.view_assessmentanswer",
      "progress.view_pointevent",
      "progress.view_badgeaward",
      "progress.view_careeropportunity",
      "progress.view_assessmentattempt",
      "workshops.view_workshopconfig",
      "workshops.view_workshopmodel",
    ],
  },
  {
    href: "/opportunities",
    label: "Opportunities",
    icon: BriefcaseBusiness,
    group: "Careers",
    permissions: ["progress.view_careeropportunity"],
  },
];

const GROUP_ORDER: NavigationItem["group"][] = ["Overview", "Teach", "People", "Insights", "Careers"];

export function canSee(item: NavigationItem, permissions: string[], features?: User["features"]) {
  if (item.feature && features && features[item.feature] === false) return false;
  return (
    !item.permissions ||
    item.permissions.some((permission) => permissions.includes(permission))
  );
}

export function roleName(groups: string[]) {
  if (groups.includes("SUPER_ADMIN")) return "Super administrator";
  if (groups.includes("ADMIN")) return "Administrator";
  if (groups.includes("ACADEMIC_MANAGER")) return "Academic manager";
  if (groups.includes("CONTENT_MANAGER")) return "Content manager";
  if (groups.includes("TEACHER")) return "Teacher";
  return "Staff";
}

function Brand() {
  return (
    <Link href="/dashboard" aria-label="Sofiaa staff workspace home" className="flex flex-col gap-1.5 rounded-lg">
      <LearnerMark className="w-32" />
      <span className="pl-0.5 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Staff workspace</span>
    </Link>
  );
}

function useActiveItem(items: NavigationItem[]) {
  const pathname = usePathname();
  const managedKey = pathname.match(/^\/manage\/([^/]+)/)?.[1];
  const managedSection = managedKey ? staffResources[managedKey]?.section : undefined;
  const managedHref =
    managedSection === "curriculum" ? "/courses" : managedSection ? `/${managedSection}` : undefined;
  return items.find(
    (item) =>
      pathname === item.href ||
      managedHref === item.href ||
      (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`)),
  );
}

function Navigation({ items, onNavigate }: { items: NavigationItem[]; onNavigate?: () => void }) {
  const active = useActiveItem(items);
  return (
    <nav aria-label="Primary" className="flex flex-col gap-5">
      {GROUP_ORDER.map((group) => {
        const entries = items.filter((item) => item.group === group);
        if (!entries.length) return null;
        return (
          <div key={group} className="flex flex-col gap-0.5">
            {group !== "Overview" && (
              <p className="mb-1 px-3 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{group}</p>
            )}
            {entries.map((item) => {
              const Icon = item.icon;
              const current = active?.href === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={current ? "page" : undefined}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    current
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/75 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground",
                  )}
                >
                  {current && <span aria-hidden="true" className="absolute inset-y-1.5 left-0 w-1 rounded-full bg-brand-teal" />}
                  <Icon className={cn("size-4", current ? "text-primary" : "text-muted-foreground group-hover:text-primary")} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        );
      })}
    </nav>
  );
}

function initialsFor(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";
}

function ContentSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-8" role="status">
      <span className="sr-only">Loading workspace</span>
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-96 max-w-full" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((key) => <Skeleton key={key} className="h-28 rounded-xl" />)}
      </div>
      <Skeleton className="h-72 rounded-xl" />
    </div>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const items = user ? navigation.filter((item) => canSee(item, user.permissions, user.features)) : [];
  const active = useActiveItem(items);

  if (!loading && !user) return null;

  const userBlock = user && (
    <div className="flex items-center gap-3">
      <Avatar className="size-9">
        <AvatarFallback className="bg-brand-indigo-soft text-xs font-semibold text-primary">{initialsFor(user.display_name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{user.display_name}</p>
        <p className="truncate text-xs text-muted-foreground">{roleName(user.groups)}</p>
      </div>
      <Button size="icon-sm" variant="ghost" aria-label="Log out" title="Log out" onClick={() => void logout()}>
        <LogOut />
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <a href="#main-content" className="sr-only z-50 rounded-md bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3">
        Skip to content
      </a>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r bg-sidebar text-sidebar-foreground lg:flex">
        <div className="px-5 pt-6 pb-5"><Brand /></div>
        <div className="flex-1 overflow-y-auto px-3 pb-4">
          {loading ? (
            <div className="flex flex-col gap-2 px-2">{[0, 1, 2, 3, 4, 5].map((key) => <Skeleton key={key} className="h-8" />)}</div>
          ) : (
            <Navigation items={items} />
          )}
        </div>
        <div className="border-t px-4 py-4">{userBlock}</div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur-md md:px-8">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger render={<Button size="icon" variant="ghost" className="-ml-2 lg:hidden" aria-label="Open navigation" />}>
              <Menu />
            </SheetTrigger>
            <SheetContent side="left" className="flex w-72 flex-col gap-6 p-5">
              <SheetTitle className="sr-only">Staff navigation</SheetTitle>
              <Brand />
              <div className="flex-1 overflow-y-auto">
                <Navigation items={items} onNavigate={() => setOpen(false)} />
              </div>
              <SheetFooter className="gap-3 p-0">
                <Separator />
                {userBlock}
              </SheetFooter>
            </SheetContent>
          </Sheet>
          <Link href="/dashboard" className="lg:hidden" aria-label="Sofiaa staff workspace home"><BrandMark className="size-7" /></Link>
          <p className="truncate text-sm font-semibold text-foreground">{active?.label ?? "Staff workspace"}</p>
          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
          </div>
        </header>
        <div id="main-content" tabIndex={-1} className="outline-none">
          {loading ? <ContentSkeleton /> : children}
        </div>
        <Toaster />
      </div>
    </div>
  );
}
