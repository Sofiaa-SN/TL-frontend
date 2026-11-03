"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ThemePreference = "light" | "dark" | "system";

const STORAGE_KEY = "sofiaa-theme";

// Runs before paint so the page never flashes the wrong theme.
const themeBootstrap = `(() => { try {
  const saved = localStorage.getItem("${STORAGE_KEY}");
  const dark = saved === "dark" || ((!saved || saved === "system") && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
} catch (e) {} })();`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />;
}

function readPreference(): ThemePreference {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === "light" || saved === "dark" ? saved : "system";
  } catch {
    return "system";
  }
}

function apply(preference: ThemePreference) {
  const dark = preference === "dark" || (preference === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

const NEXT: Record<ThemePreference, ThemePreference> = { system: "light", light: "dark", dark: "system" };
const LABEL: Record<ThemePreference, string> = { system: "Theme: match system", light: "Theme: light", dark: "Theme: dark" };

export function ThemeToggle({ className }: { className?: string }) {
  const [preference, setPreference] = useState<ThemePreference>("system");

  useEffect(() => {
    setPreference(readPreference());
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => { if (readPreference() === "system") apply("system"); };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  function cycle() {
    const next = NEXT[preference];
    setPreference(next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch {}
    apply(next);
  }

  const Icon = preference === "dark" ? Moon : preference === "light" ? Sun : Monitor;
  return (
    <Button type="button" variant="ghost" size="icon" onClick={cycle} className={cn("text-muted-foreground", className)} aria-label={`${LABEL[preference]}. Change theme`} title={LABEL[preference]}>
      <Icon />
    </Button>
  );
}
