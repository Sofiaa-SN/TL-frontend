"use client";

import { usePathname } from "next/navigation";

/**
 * Stacks the course tutor and "Ask a teacher" launchers in one place so they
 * never overlap each other, and hides them during learning checks.
 */
export function CourseHelpDock({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  if (pathname.includes("/checks/")) return null;
  return (
    <div className="pointer-events-none fixed right-4 bottom-20 z-40 flex flex-col items-end gap-2 md:right-6 md:bottom-6 [&>*]:pointer-events-auto">
      {children}
    </div>
  );
}
