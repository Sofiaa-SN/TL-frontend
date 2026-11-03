"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, BookOpenCheck, LineChart, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { ApiError, authApi } from "@/lib/curriculum/api";
import { LearnerBrand } from "./brand";
import { auth0LoginUrl, portalForContinuation, safeContinuation } from "@/lib/auth/continuation";

const FRIENDLY_ERRORS: Record<string, string> = {
  "No active account found with the given credentials": "That email and password don’t match an active account. Check them and try again.",
  "This account cannot access the requested workspace.": "This account doesn’t have access to that workspace.",
};

function friendlyError(message: string) {
  return FRIENDLY_ERRORS[message.replace(/\.$/, "")] ?? FRIENDLY_ERRORS[message] ?? message;
}

const HIGHLIGHTS = [
  { icon: BookOpenCheck, title: "Learn by doing", text: "Lessons, interactive experiments and quick checks in one place." },
  { icon: LineChart, title: "See your progress", text: "Every activity you finish is saved and counted toward your course." },
  { icon: Sparkles, title: "Help when you need it", text: "Ask the course tutor or message your teacher without leaving the lesson." },
];

export function LearnerLoginForm({ auth0Available = false }: { auth0Available?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const params = useSearchParams();
  const providerError = params.get("auth0_error")
    ? "Auth0 sign-in could not be completed. You can retry or use your email and password."
    : "";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const result = await authApi.login(
        String(form.get("email")),
        String(form.get("password")),
        portalForContinuation(params.get("next")),
      );
      router.replace(safeContinuation(result.portal, params.get("next")));
    } catch (caught) {
      setError(caught instanceof ApiError ? friendlyError(caught.message) : "We couldn’t reach Sofiaa. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="learner-theme grid min-h-screen bg-background lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <section aria-label="About Sofiaa" className="brand-hero relative hidden overflow-hidden p-12 lg:flex lg:flex-col">
        <div className="flex items-center gap-3">
          <span className="relative block aspect-[1000/342] w-40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/sofiaa-logo-inverse.png" alt="Sofiaa Systems" className="absolute inset-0 size-full object-contain object-left" />
          </span>
        </div>
        <div className="mt-auto max-w-lg">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#7fe3dc]">Teaching &amp; learning platform</p>
          <h2 className="mt-4 font-heading text-4xl leading-tight font-semibold text-white">Where every lesson builds real understanding.</h2>
          <ul className="mt-10 flex flex-col gap-6">
            {HIGHLIGHTS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/10 ring-1 ring-white/15"><Icon className="size-5 text-[#7fe3dc]" aria-hidden="true" /></span>
                <span>
                  <span className="block font-semibold text-white">{title}</span>
                  <span className="mt-0.5 block text-sm leading-6 text-white/75">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <span aria-hidden="true" className="pointer-events-none absolute -right-24 -bottom-24 size-96 rounded-full border-[40px] border-white/5" />
      </section>
      <div className="brand-backdrop flex items-center justify-center px-4 py-10 sm:px-6">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center lg:hidden"><LearnerBrand markClassName="w-48" /></div>
        <Card className="shadow-xl shadow-primary/5">
          <CardHeader className="gap-2">
            <h1 className="font-heading text-2xl font-semibold tracking-tight">Welcome back</h1>
            <CardDescription>Sign in with your Sofiaa account. We’ll take you to the right workspace for your role.</CardDescription>
          </CardHeader>
          <CardContent>
            {auth0Available && (
              <>
                <Button asChild type="button" size="lg" variant="outline" className="w-full">
                  <a href={auth0LoginUrl("auto", params.get("next"))}>
                    <ShieldCheck data-icon="inline-start" />
                    Continue with Auth0
                  </a>
                </Button>
                <div className="my-5 flex items-center gap-3" aria-hidden="true">
                  <span className="h-px flex-1 bg-border" />
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">or</span>
                  <span className="h-px flex-1 bg-border" />
                </div>
              </>
            )}
            {providerError && !error && <Alert variant="destructive" role="alert" className="mb-5"><AlertDescription>{providerError}</AlertDescription></Alert>}
            <form id="learner-login" className="flex flex-col gap-5" onSubmit={submit}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="learner-email">Email address</FieldLabel>
                  <Input id="learner-email" name="email" type="email" autoComplete="email" required placeholder="you@university.edu" className="h-10" />
                </Field>
                <Field>
                  <FieldLabel htmlFor="learner-password">Password</FieldLabel>
                  <Input id="learner-password" name="password" type="password" autoComplete="current-password" required className="h-10" aria-describedby="learner-password-help" />
                  <p id="learner-password-help" className="text-xs text-muted-foreground">Forgot your password? Ask your teacher or institution administrator to reset it.</p>
                </Field>
              </FieldGroup>
              {error && <Alert variant="destructive" role="alert"><AlertDescription>{error}</AlertDescription></Alert>}
              <Button type="submit" size="lg" disabled={busy} className="w-full">
                {busy ? <Spinner data-icon="inline-start" /> : null}
                {busy ? "Signing in…" : "Sign in"}
                {!busy ? <ArrowRight data-icon="inline-end" /> : null}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="justify-center">
            <p className="flex items-center gap-2 text-xs text-muted-foreground"><LockKeyhole className="size-3.5" />Your access and workspace are selected automatically.</p>
          </CardFooter>
        </Card>
        <p className="mt-6 text-center text-xs text-muted-foreground">Sofiaa Systems · Curriculum-connected learning</p>
      </div>
      </div>
    </main>
  );
}
