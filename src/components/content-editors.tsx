"use client";

import { useId, useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";

import { ContentRenderer } from "@/components/learner/content-renderer";
import { StructuredJsonEditor } from "@/components/structured-json-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SimpleSelect } from "@/components/ui/simple-select";
import { Textarea } from "@/components/ui/textarea";
import { formatTimestamp, parseCaptionFile, parseTimestamp, readCues, toWebVtt, type CaptionCue } from "@/lib/captions";
import { isJsonObject, type JsonObject, type JsonValue } from "@/lib/structured-json";
import { cn } from "@/lib/utils";

type Mode = "form" | "preview" | "json";

function text(value: JsonValue | undefined) {
  return typeof value === "string" ? value : "";
}

function object(value: JsonValue | undefined): JsonObject {
  return isJsonObject(value) ? value : {};
}

/** Drops empty strings so cleared fields don't linger as "" in stored content. */
function withField(source: JsonObject, key: string, value: JsonValue | undefined): JsonObject {
  const next = { ...source };
  if (value === undefined || value === "" || (Array.isArray(value) && value.length === 0)) delete next[key];
  else next[key] = value;
  return next;
}

function ModeSwitch({ mode, onChange, modes }: { mode: Mode; onChange: (mode: Mode) => void; modes: { value: Mode; label: string }[] }) {
  return (
    <div role="radiogroup" aria-label="Editor view" className="inline-flex rounded-lg bg-muted p-1">
      {modes.map((item) => (
        <button
          key={item.value}
          type="button"
          role="radio"
          aria-checked={mode === item.value}
          onClick={() => onChange(item.value)}
          className={cn("h-7 rounded-md px-3 text-xs font-medium transition-colors", mode === item.value ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

function TextField({ label, value, onChange, onBlur, multiline = false, placeholder, hint, mono = false }: { label: string; value: string; onChange: (value: string) => void; onBlur?: () => void; multiline?: boolean; placeholder?: string; hint?: string; mono?: boolean }) {
  const id = useId();
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {multiline
        ? <Textarea id={id} value={value} placeholder={placeholder} rows={3} onBlur={onBlur} onChange={(event) => onChange(event.target.value)} className={cn(mono && "font-mono text-xs")} />
        : <Input id={id} value={value} placeholder={placeholder} onBlur={onBlur} onChange={(event) => onChange(event.target.value)} className={cn(mono && "font-mono text-xs")} />}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function ListHeader({ title, description, action }: { title: string; description: string; action: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h4 className="text-sm font-semibold">{title}</h4>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  );
}

function RowActions({ index, count, label, onMove, onRemove }: { index: number; count: number; label: string; onMove: (from: number, to: number) => void; onRemove: () => void }) {
  return (
    <div className="flex gap-1">
      <Button type="button" size="icon-sm" variant="ghost" aria-label={`Move ${label} up`} disabled={index === 0} onClick={() => onMove(index, index - 1)}><ArrowUp /></Button>
      <Button type="button" size="icon-sm" variant="ghost" aria-label={`Move ${label} down`} disabled={index === count - 1} onClick={() => onMove(index, index + 1)}><ArrowDown /></Button>
      <Button type="button" size="icon-sm" variant="ghost" aria-label={`Remove ${label}`} onClick={onRemove}><Trash2 /></Button>
    </div>
  );
}

function move<T>(items: T[], from: number, to: number) {
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

const BLOCK_TYPES = [
  { value: "text", label: "Text" },
  { value: "callout", label: "Tip / callout" },
  { value: "equation", label: "Equation" },
];

/** Form editor for activity content: blocks, a facilitation task and a related source. */
export function ActivityContentEditor({ value, onChange, onValidityChange, label = "Learner content" }: { value: JsonObject; onChange: (value: JsonObject) => void; onValidityChange?: (valid: boolean) => void; label?: string }) {
  const [mode, setModeState] = useState<Mode>("form");
  // Leaving Advanced discards unapplied raw JSON, so it can no longer block saving.
  const setMode = (next: Mode) => { setModeState(next); onValidityChange?.(true); };
  const blocks = Array.isArray(value.blocks) ? value.blocks : [];
  const facilitation = object(value.facilitation);
  const source = object(value.source);

  const setBlocks = (next: JsonValue[]) => onChange(withField(value, "blocks", next));
  const updateBlock = (index: number, key: string, field: JsonValue | undefined) => {
    const current = blocks[index];
    const block = typeof current === "string" ? { body: current } : object(current);
    setBlocks(blocks.map((item, position) => position === index ? withField(block, key, field) : item));
  };

  return (
    <section className="flex min-w-0 flex-col gap-4 border-t border-border/70 pt-5" aria-label={label}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">{label}</h3>
          <p className="text-xs text-muted-foreground">What learners read in this activity. Preview shows it exactly as learners see it.</p>
        </div>
        <ModeSwitch mode={mode} onChange={setMode} modes={[{ value: "form", label: "Edit" }, { value: "preview", label: "Preview" }, { value: "json", label: "Advanced" }]} />
      </div>

      {mode === "preview" && (
        <div className="rounded-xl border bg-background p-5">
          {Object.keys(value).length ? <ContentRenderer content={value} /> : <p className="text-sm text-muted-foreground">Nothing to preview yet. Add a block in Edit.</p>}
        </div>
      )}

      {mode === "json" && <StructuredJsonEditor id="activity-content-json" label="Content data" description="Every field, including ones the form doesn’t show." value={value} onChange={onChange} onValidityChange={onValidityChange} />}

      {mode === "form" && (
        <>
          <ListHeader
            title="Content blocks"
            description="Shown in order. Use tips for key takeaways and equations for formulas."
            action={<Button type="button" size="sm" variant="outline" onClick={() => setBlocks([...blocks, { type: "text", heading: "", body: "" }])}><Plus data-icon="inline-start" />Add block</Button>}
          />
          {blocks.length === 0 && <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">No blocks yet. Add one to start writing.</p>}
          <ol className="flex flex-col gap-3">
            {blocks.map((raw, index) => {
              const block = typeof raw === "string" ? { body: raw } : object(raw);
              const type = text(block.type) || "text";
              const items = Array.isArray(block.items) ? block.items.filter((item): item is string => typeof item === "string") : [];
              return (
                <li key={index} className="flex flex-col gap-3 rounded-xl border bg-card p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="grid size-6 place-items-center rounded-full bg-muted text-xs font-semibold tabular-nums">{index + 1}</span>
                    <SimpleSelect aria-label={`Block ${index + 1} type`} size="sm" className="w-40" value={BLOCK_TYPES.some((item) => item.value === type) ? type : "text"} onValueChange={(next) => updateBlock(index, "type", next)} options={BLOCK_TYPES} />
                    <span className="flex-1" />
                    <RowActions index={index} count={blocks.length} label={`block ${index + 1}`} onMove={(from, to) => setBlocks(move(blocks, from, to))} onRemove={() => setBlocks(blocks.filter((_, position) => position !== index))} />
                  </div>
                  <TextField label="Heading" value={text(block.heading) || text(block.title)} onChange={(next) => updateBlock(index, block.title !== undefined && block.heading === undefined ? "title" : "heading", next)} />
                  <TextField label="Body" multiline value={text(block.body) || text(block.text)} onChange={(next) => updateBlock(index, block.text !== undefined && block.body === undefined ? "text" : "body", next)} />
                  {(type === "equation" || text(block.equation)) && <TextField label="Equation" mono value={text(block.equation)} placeholder="Profit = Revenue − Cost" onChange={(next) => updateBlock(index, "equation", next)} />}
                  <TextField label="Bullet points" multiline hint="One point per line." value={items.join("\n")} onChange={(next) => updateBlock(index, "items", next ? next.split("\n") : [])} onBlur={() => updateBlock(index, "items", items.map((item) => item.trim()).filter(Boolean))} />
                </li>
              );
            })}
          </ol>

          <div className="flex flex-col gap-3 rounded-xl border bg-card p-4">
            <ListHeader title="Learner task" description="Optional. Shown as three cards under the content." action={null} />
            <div className="grid gap-3 md:grid-cols-3">
              {[["prompt", "Your task"], ["deliverable", "What to produce"], ["reflection", "Reflect"]].map(([key, title]) => (
                <TextField key={key} label={title} multiline value={text(facilitation[key])} onChange={(next) => onChange(withField(value, "facilitation", Object.keys(withField(facilitation, key, next)).length ? withField(facilitation, key, next) : undefined))} />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-xl border bg-card p-4">
            <ListHeader title="Related source" description="Optional. A link learners can open for further reading." action={null} />
            <div className="grid gap-3 md:grid-cols-3">
              {[["title", "Title"], ["creator", "Author or creator"], ["url", "Link (https://…)"]].map(([key, title]) => (
                <TextField key={key} label={title} value={text(source[key])} onChange={(next) => onChange(withField(value, "source", Object.keys(withField(source, key, next)).length ? withField(source, key, next) : undefined))} />
              ))}
            </div>
          </div>
        </>
      )}
    </section>
  );
}

const RENDERERS = [
  { value: "geogebra", label: "GeoGebra applet" },
  { value: "graphspace", label: "GraphSpace 3D grapher" },
  { value: "placeholder", label: "Message only" },
];

const RESPONSE_TYPES = [
  { value: "textarea", label: "Long answer" },
  { value: "text", label: "Short answer" },
  { value: "number", label: "Number" },
];

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || "response";
}

/** Form editor for an experiment's configuration: renderer, its settings, tracking and response fields. */
export function ExperimentConfigEditor({ value, onChange }: { value: JsonObject; onChange: (value: JsonObject) => void }) {
  const [mode, setMode] = useState<Mode>("form");
  const renderer = text(value.renderer).toLowerCase();
  const config = object(value.renderer_config);
  const tracking = object(value.tracking);
  const completion = object(tracking.completion);
  const workspace = object(config.workspace);
  const responses = Array.isArray(value.response_fields) ? value.response_fields : [];

  const setConfig = (key: string, next: JsonValue | undefined) => onChange(withField(value, "renderer_config", withField(config, key, next)));
  const setTracking = (next: JsonObject) => onChange(withField(value, "tracking", Object.keys(next).length ? next : undefined));
  const setResponses = (next: JsonValue[]) => onChange(withField(value, "response_fields", next));
  const numberOrUndefined = (raw: string) => (raw.trim() === "" || !Number.isFinite(Number(raw)) ? undefined : Number(raw));

  return (
    <section className="flex min-w-0 flex-col gap-4 border-t border-border/70 pt-5" aria-label="Experiment setup">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">Experiment setup</h3>
          <p className="text-xs text-muted-foreground">Choose the interactive tool, then fill in its settings.</p>
        </div>
        <ModeSwitch mode={mode} onChange={setMode} modes={[{ value: "form", label: "Edit" }, { value: "json", label: "Advanced" }]} />
      </div>

      {mode === "json" && <StructuredJsonEditor id="experiment-config-json" label="Configuration data" description="Every field, including custom workspaces the form doesn’t show." value={value} onChange={onChange} />}

      {mode === "form" && (
        <>
          <div className="flex flex-col gap-1.5">
            <Label>Interactive tool</Label>
            <SimpleSelect aria-label="Interactive tool" placeholder="Choose a tool" value={RENDERERS.some((item) => item.value === renderer) ? renderer : ""} onValueChange={(next) => onChange(withField(value, "renderer", next))} options={RENDERERS} />
            {renderer && !RENDERERS.some((item) => item.value === renderer) && <p className="text-xs text-muted-foreground">Uses a custom tool “{renderer}”. Edit it in Advanced.</p>}
          </div>

          {renderer === "geogebra" && (
            <div className="flex flex-col gap-3 rounded-xl border bg-card p-4">
              {text(workspace.type) ? <p className="rounded-lg bg-brand-indigo-soft px-3 py-2 text-xs">This experiment uses the custom <strong>{text(workspace.type).replaceAll("_", " ")}</strong> workspace, which builds its own applet. Its steps are edited in Advanced.</p> : <>
              <div className="grid gap-3 md:grid-cols-2">
                <TextField label="GeoGebra material ID" mono value={text(config.material_id)} placeholder="e.g. hzz6vqqk" hint="From the applet’s geogebra.org link." onChange={(next) => setConfig("material_id", next.trim())} />
                <div className="flex flex-col gap-1.5">
                  <Label>App</Label>
                  <SimpleSelect aria-label="GeoGebra app" value={text(config.app_name) || "graphing"} onValueChange={(next) => setConfig("app_name", next)} options={[{ value: "graphing", label: "Graphing" }, { value: "geometry", label: "Geometry" }, { value: "3d", label: "3D" }, { value: "classic", label: "Classic" }]} />
                </div>
                <TextField label="Width (px)" value={config.width == null ? "" : String(config.width)} placeholder="960" onChange={(next) => setConfig("width", numberOrUndefined(next))} />
                <TextField label="Height (px)" value={config.height == null ? "" : String(config.height)} placeholder="600" onChange={(next) => setConfig("height", numberOrUndefined(next))} />
              </div>
              <ListHeader title="Progress tracking" description="Optional. Name GeoGebra objects that report progress and completion." action={null} />
              <div className="grid gap-3 md:grid-cols-3">
                <TextField label="Progress object" mono value={text(tracking.progress_object)} onChange={(next) => setTracking(withField(tracking, "progress_object", next))} />
                <TextField label="Completion object" mono value={text(completion.object)} onChange={(next) => setTracking(withField(tracking, "completion", Object.keys(withField(completion, "object", next)).length ? withField(completion, "object", next) : undefined))} />
                <TextField label="Watched objects" mono hint="Comma separated." value={(Array.isArray(tracking.watch_objects) ? tracking.watch_objects : []).join(", ")} onChange={(next) => setTracking(withField(tracking, "watch_objects", next ? next.split(",").map((item) => item.trimStart()) : []))} onBlur={() => setTracking(withField(tracking, "watch_objects", (Array.isArray(tracking.watch_objects) ? tracking.watch_objects : []).map((item) => String(item).trim()).filter(Boolean)))} />
              </div>
              </>}
            </div>
          )}

          {(renderer === "graphspace" || renderer === "placeholder") && (
            <div className="grid gap-3 rounded-xl border bg-card p-4 md:grid-cols-2">
              <TextField label="Heading" value={text(config.heading)} placeholder="Defaults to the activity title" onChange={(next) => setConfig("heading", next)} />
              <TextField label="Note" value={text(config.note)} onChange={(next) => setConfig("note", next)} />
              <div className="md:col-span-2"><TextField label="Message" multiline value={text(config.message)} placeholder="Defaults to the experiment instructions" onChange={(next) => setConfig("message", next)} /></div>
            </div>
          )}

          <ListHeader
            title="Learner responses"
            description="Optional questions learners answer alongside the tool."
            action={<Button type="button" size="sm" variant="outline" onClick={() => setResponses([...responses, { key: `response_${responses.length + 1}`, label: "", type: "textarea" }])}><Plus data-icon="inline-start" />Add question</Button>}
          />
          {responses.length > 0 && (
            <ol className="flex flex-col gap-3">
              {responses.map((raw, index) => {
                const field = typeof raw === "string" ? { key: raw, label: raw } : object(raw);
                const update = (key: string, next: JsonValue | undefined) => {
                  let updated = withField(field, key, next);
                  // The stored key follows the label until someone sets a custom key in Advanced.
                  const autoKey = !text(field.key) || text(field.key).startsWith("response_") || text(field.key) === slug(text(field.label));
                  if (key === "label" && typeof next === "string" && autoKey) updated = { ...updated, key: slug(next) };
                  setResponses(responses.map((item, position) => position === index ? updated : item));
                };
                return (
                  <li key={index} className="grid gap-3 rounded-xl border bg-card p-4 md:grid-cols-[1fr_10rem_auto] md:items-end">
                    <TextField label={`Question ${index + 1}`} value={text(field.label)} onChange={(next) => update("label", next)} />
                    <div className="flex flex-col gap-1.5">
                      <Label>Answer type</Label>
                      <SimpleSelect aria-label={`Question ${index + 1} answer type`} value={text(field.type) || "textarea"} onValueChange={(next) => update("type", next)} options={RESPONSE_TYPES} />
                    </div>
                    <RowActions index={index} count={responses.length} label={`question ${index + 1}`} onMove={(from, to) => setResponses(move(responses, from, to))} onRemove={() => setResponses(responses.filter((_, position) => position !== index))} />
                  </li>
                );
              })}
            </ol>
          )}
        </>
      )}
    </section>
  );
}

function TimeInput({ label, seconds, onCommit }: { label: string; seconds: number; onCommit: (seconds: number) => void }) {
  const [draft, setDraft] = useState(formatTimestamp(seconds));
  const [invalid, setInvalid] = useState(false);
  const [lastSeconds, setLastSeconds] = useState(seconds);
  if (seconds !== lastSeconds) {
    // An import or reorder replaced this value; show it instead of the stale draft.
    setLastSeconds(seconds);
    setDraft(formatTimestamp(seconds));
    setInvalid(false);
  }
  return (
    <Input
      aria-label={label}
      aria-invalid={invalid || undefined}
      value={draft}
      inputMode="decimal"
      className="w-24 font-mono text-xs tabular-nums"
      onChange={(event) => setDraft(event.target.value)}
      onBlur={() => {
        const parsed = parseTimestamp(draft);
        if (Number.isFinite(parsed)) {
          setInvalid(false);
          onCommit(parsed);
          setDraft(formatTimestamp(parsed));
        } else setInvalid(true);
      }}
    />
  );
}

/** Timed caption cues for a video, with WebVTT/SRT import and export. */
export function CaptionsEditor({ value, onChange }: { value: unknown; onChange: (cues: CaptionCue[]) => void }) {
  const cues = readCues(value);
  const fileId = useId();
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasted, setPasted] = useState("");
  const [message, setMessage] = useState("");
  const problems = cues.flatMap((cue, index) => [
    cue.end <= cue.start ? `Cue ${index + 1} must end after it starts.` : "",
    index > 0 && cue.start < cues[index - 1].start ? `Cue ${index + 1} starts before cue ${index}.` : "",
    !cue.text.trim() ? `Cue ${index + 1} needs caption text.` : "",
  ]).filter(Boolean);

  const update = (index: number, patch: Partial<CaptionCue>) => onChange(cues.map((cue, position) => position === index ? { ...cue, ...patch } : cue));
  const importText = (text: string) => {
    const parsed = parseCaptionFile(text);
    if (!parsed.length) { setMessage("No captions found. Use a WebVTT (.vtt) or SubRip (.srt) file."); return; }
    onChange(parsed);
    setMessage(`Imported ${parsed.length} caption${parsed.length === 1 ? "" : "s"}.`);
    setPasteOpen(false);
    setPasted("");
  };
  const download = () => {
    const url = URL.createObjectURL(new Blob([toWebVtt(cues)], { type: "text/vtt" }));
    Object.assign(document.createElement("a"), { href: url, download: "captions.vtt" }).click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="flex min-w-0 flex-col gap-3 border-t border-border/70 pt-5" aria-label="Captions">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">Captions</h3>
          <p className="text-xs text-muted-foreground">Shown on uploaded videos and used as the transcript when none is written. Times are minutes:seconds.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <label htmlFor={fileId} className="inline-flex h-8 cursor-pointer items-center rounded-lg border bg-card px-3 text-xs font-medium hover:bg-muted">Import .vtt / .srt</label>
          <input id={fileId} type="file" accept=".vtt,.srt,text/vtt" className="sr-only" onChange={async (event) => { const file = event.target.files?.[0]; if (file) importText(await file.text()); event.target.value = ""; }} />
          <Button type="button" size="sm" variant="outline" aria-expanded={pasteOpen} onClick={() => setPasteOpen((open) => !open)}>Paste captions</Button>
          <Button type="button" size="sm" variant="outline" disabled={!cues.length} onClick={download}>Download .vtt</Button>
        </div>
      </div>
      {message && <p role="status" className="text-xs text-muted-foreground">{message}</p>}
      {pasteOpen && (
        <div className="flex flex-col gap-2 rounded-xl border bg-card p-3">
          <Label htmlFor={`${fileId}-paste`}>Paste WebVTT or SRT text</Label>
          <Textarea id={`${fileId}-paste`} rows={6} value={pasted} onChange={(event) => setPasted(event.target.value)} className="font-mono text-xs" placeholder={"WEBVTT\n\n00:00:00.000 --> 00:00:03.000\nWelcome to the lesson."} />
          <Button type="button" size="sm" className="w-fit" disabled={!pasted.trim()} onClick={() => importText(pasted)}>Import pasted captions</Button>
        </div>
      )}
      {cues.length === 0 ? (
        <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">No captions yet. Import a caption file or add cues one by one.</p>
      ) : (
        <ol className="flex max-h-96 flex-col gap-2 overflow-y-auto pr-1">
          {cues.map((cue, index) => (
            <li key={index} className="flex flex-wrap items-center gap-2 rounded-lg border bg-card p-2">
              <span className="w-6 text-center text-xs text-muted-foreground tabular-nums">{index + 1}</span>
              <TimeInput label={`Cue ${index + 1} start`} seconds={cue.start} onCommit={(start) => update(index, { start })} />
              <span className="text-xs text-muted-foreground" aria-hidden="true">→</span>
              <TimeInput label={`Cue ${index + 1} end`} seconds={cue.end} onCommit={(end) => update(index, { end })} />
              <Input aria-label={`Cue ${index + 1} text`} value={cue.text} maxLength={500} className="min-w-48 flex-1" onChange={(event) => update(index, { text: event.target.value })} />
              <Button type="button" size="icon-sm" variant="ghost" aria-label={`Remove cue ${index + 1}`} onClick={() => onChange(cues.filter((_, position) => position !== index))}><Trash2 /></Button>
            </li>
          ))}
        </ol>
      )}
      {problems.length > 0 && <p role="alert" className="text-xs text-destructive">{problems[0]}</p>}
      <Button type="button" size="sm" variant="outline" className="w-fit" onClick={() => { const start = cues.at(-1)?.end ?? 0; onChange([...cues, { start, end: start + 3, text: "" }]); }}><Plus data-icon="inline-start" />Add cue</Button>
    </section>
  );
}
