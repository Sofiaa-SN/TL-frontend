import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Branded full-width message for 404s and unexpected errors. */
export function StatusPage({
  icon: Icon,
  code,
  title,
  description,
  homeHref,
  homeLabel,
  onRetry,
}: {
  icon: LucideIcon;
  code?: string;
  title: string;
  description: string;
  homeHref: string;
  homeLabel: string;
  onRetry?: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 py-16 text-center">
      <span className="grid size-16 place-items-center rounded-2xl bg-brand-indigo-soft text-primary">
        <Icon className="size-7" aria-hidden="true" />
      </span>
      {code && <p className="mt-6 text-sm font-semibold tracking-[0.2em] text-brand-teal-strong">{code}</p>}
      <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {onRetry && <Button onClick={onRetry}>Try again</Button>}
        <Button render={<Link href={homeHref} />} nativeButton={false} variant={onRetry ? "outline" : "default"}>
          {homeLabel}
        </Button>
      </div>
    </main>
  );
}
