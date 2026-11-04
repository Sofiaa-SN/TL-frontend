"use client";

import { CircleAlert, CircleCheck, X } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type Toast = { id: number; message: string; tone: "success" | "error" };
type Listener = (toast: Toast) => void;

const listeners = new Set<Listener>();
let nextId = 1;

function emit(message: string, tone: Toast["tone"]) {
  const item = { id: nextId++, message, tone };
  listeners.forEach((listener) => listener(item));
}

/** Short confirmation shown after a save, create or delete. */
export const toast = {
  success: (message: string) => emit(message, "success"),
  error: (message: string) => emit(message, "error"),
};

const DURATION_MS = 4000;

export function Toaster() {
  const [items, setItems] = useState<Toast[]>([]);

  useEffect(() => {
    const listener: Listener = (item) => {
      setItems((current) => [...current.slice(-2), item]);
      window.setTimeout(() => setItems((current) => current.filter((entry) => entry.id !== item.id)), DURATION_MS);
    };
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, []);

  return (
    <div aria-live="polite" role="status" className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex flex-col items-center gap-2 px-4 md:bottom-6">
      {items.map((item) => {
        const Icon = item.tone === "success" ? CircleCheck : CircleAlert;
        return (
          <div
            key={item.id}
            className={cn(
              "pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-xl border bg-popover px-4 py-3 text-sm text-popover-foreground shadow-lg animate-in fade-in slide-in-from-bottom-2",
            )}
          >
            <Icon className={cn("size-5 shrink-0", item.tone === "success" ? "text-brand-teal" : "text-destructive")} aria-hidden="true" />
            <span className="flex-1">{item.message}</span>
            <button
              type="button"
              aria-label="Dismiss"
              className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={() => setItems((current) => current.filter((entry) => entry.id !== item.id))}
            >
              <X className="size-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
