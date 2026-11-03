"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpenCheck, CheckCircle2, CircleX, Clock3, RotateCcw, ShieldCheck, Target, Trophy } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldGroup, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { LearnerApiError, learnerApi } from "@/lib/learner/api";
import type { AssessmentAttempt, LearningCheck, LearningCheckQuestion } from "@/lib/learner/types";
import { cn } from "@/lib/utils";
import { ErrorState, LoadingState } from "./common";

type AnswerMap = Record<string, string | string[]>;

function answered(value: string | string[] | undefined) {
  return Array.isArray(value) ? value.length > 0 : Boolean(value?.trim());
}

const number = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 1 });
const fmt = (value: string | number | null | undefined) => number.format(Number(value ?? 0));
const cleanTitle = (title: string) => title.replace(/\s*[—-]\s*Learning Check$/i, "");

function ResultSummary({ result, check, questions }: { result: AssessmentAttempt; check: LearningCheck; questions: LearningCheckQuestion[] }) {
  const passed = Boolean(result.passed);
  const percentage = Number(result.percentage ?? 0);
  const review = new Map((result.review ?? []).map((row) => [row.question, row]));
  const correct = (result.review ?? []).filter((row) => row.is_correct).length;
  return (
    <Card aria-label="Your latest result" className={cn("overflow-visible", passed ? "ring-brand-teal/40" : "ring-warning/40")}>
      <CardHeader className="gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
        <span className={cn("grid size-14 place-items-center rounded-2xl", passed ? "bg-brand-teal-soft text-brand-teal-strong" : "bg-warning/15 text-warning-foreground dark:text-warning")}>
          {passed ? <Trophy className="size-7" aria-hidden="true" /> : <RotateCcw className="size-7" aria-hidden="true" />}
        </span>
        <div>
          <CardTitle className="font-heading text-2xl">{passed ? "You passed!" : "Not quite yet"}</CardTitle>
          <CardDescription className="mt-1">
            You scored <strong className="text-foreground">{fmt(percentage)}%</strong> on attempt {result.attempt_number} of {check.max_attempts}. {passed ? "Great work." : `You need ${fmt(check.passing_score)}% to pass.`}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="relative h-3 overflow-hidden rounded-full bg-muted" role="img" aria-label={`Score ${fmt(percentage)} percent, pass mark ${fmt(check.passing_score)} percent`}>
          <div className={cn("h-full rounded-full transition-[width]", passed ? "bg-brand-teal" : "bg-warning")} style={{ width: `${Math.min(100, percentage)}%` }} />
          <span className="absolute inset-y-0 w-0.5 bg-foreground/60" style={{ left: `${Math.min(100, Number(check.passing_score))}%` }} aria-hidden="true" />
        </div>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Target className="size-3.5" aria-hidden="true" />Pass mark {fmt(check.passing_score)}%{result.review ? ` · ${correct} of ${result.review.length} correct` : ""}</p>
        {result.review && result.review.length > 0 && (
          <ol className="flex flex-col divide-y rounded-xl border">
            {questions.map((item, index) => {
              const row = review.get(item.question);
              if (!row) return null;
              return (
                <li key={item.id} className="flex gap-3 p-4">
                  {row.is_correct
                    ? <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-brand-teal" aria-label="Correct" />
                    : <CircleX className="mt-0.5 size-5 shrink-0 text-destructive" aria-label="Incorrect" />}
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-6"><span className="text-muted-foreground">{index + 1}. </span>{item.question_detail.question_text}</p>
                    {row.explanation && <p className="mt-1 text-sm leading-6 text-muted-foreground">{row.explanation}</p>}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
        {!passed && result.review && !result.review.some((row) => row.explanation) && (
          <p className="text-xs text-muted-foreground">Explanations unlock once you pass or use all your attempts. Review the lesson and try again.</p>
        )}
      </CardContent>
    </Card>
  );
}

function QuestionInput({ item, value, onChange, promptId }: { item: LearningCheckQuestion; value?: string | string[]; onChange: (value: string | string[]) => void; promptId: string }) {
  const question = item.question_detail;
  if (question.question_type === "MCQ" || question.question_type === "TRUE_FALSE") {
    return (
      <FieldGroup className="gap-2">
        {question.options.map((option) => {
          const selected = value === option.id;
          return (
            <label key={option.id} className={cn("learner-pressable flex min-h-12 cursor-pointer items-start gap-3 rounded-lg border px-3.5 py-3 text-sm leading-5", selected ? "border-primary/50 bg-accent ring-1 ring-primary/30" : "bg-background hover:bg-muted/55")}>
              <input type="radio" name={`question-${question.id}`} value={option.id} checked={selected} onChange={() => onChange(option.id)} className="mt-0.5 size-4 accent-primary" />
              <span>{option.option_text}</span>
            </label>
          );
        })}
      </FieldGroup>
    );
  }
  if (question.question_type === "MULTI_SELECT") {
    const selected = Array.isArray(value) ? value : [];
    return (
      <FieldGroup className="gap-2">
        {question.options.map((option) => {
          const checked = selected.includes(option.id);
          return (
            <label key={option.id} className={cn("learner-pressable flex min-h-12 cursor-pointer items-start gap-3 rounded-lg border px-3.5 py-3 text-sm leading-5", checked ? "border-primary/50 bg-accent ring-1 ring-primary/30" : "bg-background hover:bg-muted/55")}>
              <input type="checkbox" value={option.id} checked={checked} onChange={() => onChange(checked ? selected.filter((id) => id !== option.id) : [...selected, option.id])} className="mt-0.5 size-4 rounded accent-primary" />
              <span>{option.option_text}</span>
            </label>
          );
        })}
      </FieldGroup>
    );
  }
  if (question.question_type === "LONG_TEXT") return <Textarea value={typeof value === "string" ? value : ""} onChange={(event) => onChange(event.target.value)} rows={6} placeholder="Write your answer" aria-labelledby={promptId} />;
  return <Input type={question.question_type === "NUMERIC" ? "number" : "text"} inputMode={question.question_type === "NUMERIC" ? "decimal" : undefined} value={typeof value === "string" ? value : ""} onChange={(event) => onChange(event.target.value)} placeholder={question.question_type === "MATH_EXPRESSION" ? "Enter your mathematical expression" : "Enter your answer"} aria-labelledby={promptId} className="h-10" />;
}

export function LearningCheckView({ courseId, checkId }: { courseId: string; checkId: string }) {
  const [check, setCheck] = useState<LearningCheck | null>(null);
  const [attempts, setAttempts] = useState<AssessmentAttempt[]>([]);
  const [attempt, setAttempt] = useState<AssessmentAttempt | null>(null);
  const [result, setResult] = useState<AssessmentAttempt | null>(null);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [missing, setMissing] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const startedAt = useRef(0);

  const load = useCallback(async () => {
    setError("");
    try {
      const [checkRow, resultRows] = await Promise.all([learnerApi.learningCheck(checkId), learnerApi.checkResults(checkId).catch(() => [])]);
      setCheck(checkRow);
      setAttempts(resultRows);
      const open = [...resultRows].reverse().find((row) => row.status === "STARTED") ?? null;
      if (open) { setAttempt(open); startedAt.current = new Date(open.started_at).getTime(); }
    } catch (caught) { setError(caught instanceof LearnerApiError ? caught.message : "This learning check could not be loaded."); }
  }, [checkId]);

  useEffect(() => { void load(); }, [load]);
  const orderedQuestions = useMemo(() => [...(check?.questions || [])].sort((a, b) => a.display_order - b.display_order), [check]);

  async function start() {
    setBusy(true); setFormError(""); setResult(null); setAnswers({});
    try {
      const row = await learnerApi.startCheck(checkId);
      setAttempt(row); setAttempts((current) => [...current, row]); startedAt.current = Date.now();
    } catch (caught) { setFormError(caught instanceof LearnerApiError ? caught.message : "A new attempt could not be started."); }
    finally { setBusy(false); }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!attempt || !check) return;
    const unanswered = orderedQuestions.filter((item) => item.is_required && !answered(answers[item.question]));
    if (unanswered.length) {
      setMissing(new Set(unanswered.map((item) => item.question)));
      setFormError(`Answer ${unanswered.length === 1 ? "the highlighted question" : `the ${unanswered.length} highlighted questions`} before submitting.`);
      document.getElementById(`question-${unanswered[0].id}`)?.focus();
      return;
    }
    setBusy(true); setFormError(""); setMissing(new Set());
    try {
      const payload = orderedQuestions.map((item) => ({ question: item.question, answer: answers[item.question] ?? "" }));
      const row = await learnerApi.submitCheck(checkId, attempt.id, payload, Math.max(0, Math.round((Date.now() - startedAt.current) / 1000)));
      setResult(row); setAttempt(null); setAttempts((current) => [...current.filter((item) => item.id !== row.id), row]);
    } catch (caught) { setFormError(caught instanceof LearnerApiError ? caught.message : "Your answers could not be submitted."); }
    finally { setBusy(false); }
  }

  if (!check && !error) return <LoadingState label="Preparing your learning check…" />;
  if (error) return <ErrorState message={error} onRetry={() => void load()} />;
  if (!check) return null;

  const usedAttempts = attempts.length;
  const remaining = Math.max(0, check.max_attempts - usedAttempts);
  const latestResult = result ?? [...attempts].reverse().find((row) => row.status === "GRADED") ?? null;
  const answeredCount = orderedQuestions.filter((item) => answered(answers[item.question])).length;

  if (!attempt) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <Button asChild variant="ghost" className="self-start"><Link href={`/learn/courses/${courseId}`}><ArrowLeft data-icon="inline-start" />Back to course</Link></Button>
        <Card>
          <CardHeader>
            <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-brand-teal-strong">
              <BookOpenCheck className="size-4" aria-hidden="true" />
              Learning check
            </p>
            <h1 className="font-heading text-3xl font-semibold tracking-tight">{cleanTitle(check.title)}</h1>
            {check.instructions && <CardDescription className="max-w-2xl leading-6">{check.instructions}</CardDescription>}
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <span className="rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground"><span className="tabular-nums">{orderedQuestions.length}</span> {orderedQuestions.length === 1 ? "question" : "questions"}</span>
            <span className="rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground"><span className="tabular-nums">{fmt(check.passing_score)}%</span> to pass</span>
            <span className="rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground"><span className="tabular-nums">{check.max_attempts}</span> {check.max_attempts === 1 ? "attempt" : "attempts"}</span>
            {check.time_limit_minutes && <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground"><Clock3 className="size-3.5" aria-hidden="true" /><span className="tabular-nums">{check.time_limit_minutes}</span> minutes</span>}
          </CardContent>
        </Card>

        {latestResult && <ResultSummary result={latestResult} check={check} questions={orderedQuestions} />}

        {remaining > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ShieldCheck className="size-4 text-brand-teal" />{latestResult ? (latestResult.passed ? "Want to improve your score?" : "Ready to try again?") : "Before you begin"}</CardTitle>
            <CardDescription className="leading-6">{latestResult ? "Your best result is kept, so another attempt can only help." : "Answer every question, then submit. Your answers are scored as soon as you submit."}</CardDescription>
          </CardHeader>
          <CardFooter className="flex-col gap-3 sm:flex-row sm:justify-between">
            <p className="text-xs tabular-nums text-muted-foreground">{remaining} {remaining === 1 ? "attempt" : "attempts"} remaining</p>
            <Button onClick={() => void start()} disabled={busy || remaining === 0}>
              {busy ? <Spinner data-icon="inline-start" /> : null}
              {busy ? "Starting…" : latestResult ? "Try again" : "Start learning check"}
              {!busy ? <ArrowRight data-icon="inline-end" /> : null}
            </Button>
          </CardFooter>
        </Card>
        )}
        {formError && <Alert variant="destructive"><AlertDescription>{formError}</AlertDescription></Alert>}
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost"><Link href={`/learn/courses/${courseId}`}><ArrowLeft data-icon="inline-start" />Exit learning check</Link></Button>
        <span className="text-sm text-muted-foreground">Attempt <span className="tabular-nums">{attempt.attempt_number}</span> of <span className="tabular-nums">{check.max_attempts}</span></span>
      </div>
      <Card>
        <CardHeader>
          <p className="mb-2 text-sm font-semibold text-brand-teal-strong">Learning check</p>
          <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">{cleanTitle(check.title)}</h1>
          <CardDescription className="flex flex-wrap gap-4">
            <span className="inline-flex items-center gap-1.5"><BookOpenCheck className="size-3.5" />{orderedQuestions.length} questions</span>
            {check.time_limit_minutes && <span className="inline-flex items-center gap-1.5"><Clock3 className="size-3.5" />{check.time_limit_minutes} minute guide</span>}
          </CardDescription>
        </CardHeader>
      </Card>

      <form onSubmit={submit} className="flex flex-col gap-4">
        {orderedQuestions.map((item, index) => {
          const promptId = `question-prompt-${item.id}`;
          return (
            <FieldSet
              key={item.id}
              id={`question-${item.id}`}
              tabIndex={-1}
              aria-invalid={missing.has(item.question) || undefined}
              className={cn("scroll-mt-24 rounded-xl border bg-card p-5 shadow-xs outline-none sm:p-6", missing.has(item.question) && "border-destructive ring-2 ring-destructive/20")}
            >
              <FieldLegend className="sr-only">{item.question_detail.question_text}</FieldLegend>
              <div className="flex items-start gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-secondary text-xs font-semibold tabular-nums text-secondary-foreground">{index + 1}</span>
                <div className="flex flex-col gap-1">
                  <p id={promptId} className="text-sm font-medium leading-6 sm:text-base">{item.question_detail.question_text}</p>
                  <p className="text-xs text-muted-foreground"><span className="tabular-nums">{fmt(item.marks)}</span> {Number(item.marks) === 1 ? "mark" : "marks"}{item.is_required ? "" : " · Optional"}</p>
                  {missing.has(item.question) && <p className="text-xs font-medium text-destructive">Choose an answer for this question.</p>}
                </div>
              </div>
              <QuestionInput
                item={item}
                value={answers[item.question]}
                promptId={promptId}
                onChange={(value) => {
                  setAnswers((current) => ({ ...current, [item.question]: value }));
                  if (missing.has(item.question)) {
                    const next = new Set(missing);
                    next.delete(item.question);
                    setMissing(next);
                    if (!next.size) setFormError("");
                  }
                }}
              />
            </FieldSet>
          );
        })}
        {formError && <Alert variant="destructive"><AlertDescription>{formError}</AlertDescription></Alert>}
        <Card size="sm" className="sticky bottom-20 z-10 md:bottom-4">
          <CardFooter className="flex-col gap-3 border-t-0 bg-card sm:flex-row sm:justify-between">
            <div className="flex w-full flex-col gap-1.5 sm:w-auto">
              <p className="text-sm font-medium tabular-nums" aria-live="polite">{answeredCount} of {orderedQuestions.length} answered</p>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted sm:w-48" aria-hidden="true">
                <div className="h-full rounded-full bg-brand-teal transition-[width]" style={{ width: `${orderedQuestions.length ? (answeredCount / orderedQuestions.length) * 100 : 0}%` }} />
              </div>
            </div>
            <Button type="submit" disabled={busy}>
              {busy ? <Spinner data-icon="inline-start" /> : null}
              {busy ? "Submitting…" : "Submit answers"}
              {!busy ? <CheckCircle2 data-icon="inline-end" /> : null}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
