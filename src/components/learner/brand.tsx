import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

/** The Sofiaa Systems wordmark; swaps to the light-on-dark version in dark mode. */
export function LearnerMark({ className = "" }: { className?: string }) {
  return (
    <span
      className={cn("relative block aspect-[1000/342] w-28 shrink-0 sm:w-32", className)}
      aria-hidden="true"
    >
      <Image src="/sofiaa-logo.png" alt="" fill sizes="(max-width: 640px) 208px, 160px" className="object-contain object-left dark:hidden" priority />
      <Image src="/sofiaa-logo-inverse.png" alt="" fill sizes="(max-width: 640px) 208px, 160px" className="hidden object-contain object-left dark:block" />
    </span>
  );
}

export function LearnerBrand({ markClassName = "", href = "/learn", label = "Sofiaa learning home" }: { markClassName?: string; href?: string; label?: string }) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="learner-pressable inline-flex rounded-lg"
    >
      <LearnerMark className={markClassName} />
    </Link>
  );
}

/** Square brand mark for compact spaces (collapsed headers, avatars, icons). */
export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <span className={cn("relative block size-8 shrink-0", className)} aria-hidden="true">
      <Image src="/sofiaa-mark.png" alt="" fill sizes="64px" className="object-contain dark:brightness-0 dark:invert" />
    </span>
  );
}
