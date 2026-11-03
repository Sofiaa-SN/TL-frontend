"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, BriefcaseBusiness, ChevronDown, ClipboardList, LayoutDashboard, LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/spinner";
import { ThemeToggle } from "@/components/theme";
import { Toaster } from "@/components/ui/toast";
import { initials } from "@/lib/learner/course";
import { cn } from "@/lib/utils";
import { LearnerBrand } from "./brand";
import { useLearnerAuth } from "./learner-auth-provider";

const nav = [
  { href: "/learn", label: "Overview", icon: LayoutDashboard },
  { href: "/learn/courses", label: "Courses", icon: BookOpen },
  { href: "/learn/opportunities", label: "Opportunities", icon: BriefcaseBusiness },
  { href: "/learn/applications", label: "Applications", icon: ClipboardList },
];

function isCurrent(pathname: string, href: string) {
  return href === "/learn" ? pathname === href : pathname.startsWith(href);
}

function DesktopNavigation() {
  const pathname = usePathname();
  return (
    <nav aria-label="Learner navigation" className="hidden items-center gap-1 md:flex">
      {nav.map(({ href, label }) => {
        const active = isCurrent(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "learner-pressable relative rounded-lg px-3 py-2 text-sm font-medium",
              active
                ? "text-primary after:absolute after:inset-x-3 after:-bottom-[13px] after:h-0.5 after:rounded-full after:bg-brand-teal"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
            aria-current={active ? "page" : undefined}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function MobileNavigation() {
  const pathname = usePathname();
  return (
    <nav aria-label="Learner navigation" className="fixed inset-x-0 bottom-0 grid grid-cols-4 border-t bg-background/95 px-2 pb-[max(.5rem,env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-8px_30px_oklch(0.2_0.02_255/.05)] backdrop-blur-xl md:hidden">
      {nav.map(({ href, label, icon: Icon }) => {
        const active = isCurrent(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "learner-pressable flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg text-xs font-medium",
              active ? "text-primary" : "text-muted-foreground",
            )}
            aria-current={active ? "page" : undefined}
          >
            <span className={cn("grid h-7 w-12 place-items-center rounded-full transition-colors", active && "bg-brand-indigo-soft")}>
              <Icon className="size-[18px]" aria-hidden="true" />
            </span>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function AccountMenu({ displayName, logout }: { displayName: string; logout: () => Promise<void> }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="lg" aria-label={`Open account menu for ${displayName}`} />}
      >
        <Avatar size="sm"><AvatarFallback className="bg-brand-indigo-soft text-xs font-semibold text-primary">{initials(displayName)}</AvatarFallback></Avatar>
        <span className="hidden max-w-36 truncate sm:inline">{displayName}</span>
        <ChevronDown data-icon="inline-end" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <span className="block truncate text-foreground">{displayName}</span>
            <span className="mt-0.5 block font-normal">Learner account</span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => void logout()}>
            <LogOut />
            Log out
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function LearnerShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useLearnerAuth();

  if (loading) {
    return (
      <div className="learner-theme grid min-h-screen place-items-center bg-background" role="status">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Spinner />
          Opening your learning space…
        </div>
      </div>
    );
  }
  if (!user) return null;

  return (
    <div className="learner-theme min-h-screen bg-background text-foreground">
      <a href="#main-content" className="sr-only z-50 rounded-md bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3">
        Skip to content
      </a>
      <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-8 px-4 sm:px-6 lg:px-8">
          <LearnerBrand />
          <DesktopNavigation />
          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <AccountMenu displayName={user.display_name} logout={logout} />
          </div>
        </div>
      </header>
      {/* Bottom padding leaves room for the mobile tab bar and floating help launcher. */}
      <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-7xl px-4 pt-8 pb-36 outline-none sm:px-6 sm:pt-10 md:pb-28 lg:px-8">
        {children}
      </main>
      <MobileNavigation />
      <Toaster />
    </div>
  );
}
