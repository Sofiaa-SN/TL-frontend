export type CaptionCue = { start: number; end: number; text: string };

/** "1:02:03.5", "02:03.500", "2:03,5" or "123.5" → seconds; NaN when unreadable. */
export function parseTimestamp(value: string): number {
  const trimmed = value.trim().replace(",", ".");
  if (!trimmed) return Number.NaN;
  const parts = trimmed.split(":");
  if (parts.length > 3 || parts.some((part) => !/^\d+(\.\d+)?$/.test(part))) return Number.NaN;
  return parts.reduce((total, part) => total * 60 + Number(part), 0);
}

/** Seconds → "m:ss.s" (or "h:mm:ss.s"), the format shown in the editor. */
export function formatTimestamp(seconds: number): string {
  const safe = Math.max(0, seconds);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const rest = (safe % 60).toFixed(1).padStart(4, "0");
  return hours ? `${hours}:${String(minutes).padStart(2, "0")}:${rest}` : `${minutes}:${rest}`;
}

function vttTime(seconds: number) {
  const ms = Math.round(Math.max(0, seconds) * 1000);
  const pad = (value: number, size = 2) => String(value).padStart(size, "0");
  return `${pad(Math.floor(ms / 3_600_000))}:${pad(Math.floor(ms / 60_000) % 60)}:${pad(Math.floor(ms / 1000) % 60)}.${pad(ms % 1000, 3)}`;
}

/** Reads WebVTT or SRT text into cues, ignoring headers, cue ids and styling notes. */
export function parseCaptionFile(source: string): CaptionCue[] {
  const cues: CaptionCue[] = [];
  const blocks = source.replace(/\r\n?/g, "\n").replace(/^﻿/, "").split(/\n{2,}/);
  for (const block of blocks) {
    const lines = block.split("\n").filter((line) => line.trim());
    const timing = lines.findIndex((line) => line.includes("-->"));
    if (timing === -1) continue;
    const [rawStart, rawEnd] = lines[timing].split("-->");
    const start = parseTimestamp(rawStart);
    const end = parseTimestamp((rawEnd ?? "").trim().split(/\s+/)[0] ?? "");
    const text = lines.slice(timing + 1).join("\n").replace(/<[^>]+>/g, "").trim();
    if (Number.isFinite(start) && Number.isFinite(end) && end > start && text) cues.push({ start, end, text });
  }
  return cues.sort((a, b) => a.start - b.start);
}

export function toWebVtt(cues: CaptionCue[]): string {
  return ["WEBVTT", ...cues.map((cue) => `${vttTime(cue.start)} --> ${vttTime(cue.end)}\n${cue.text}`)].join("\n\n") + "\n";
}

/** Keeps only well-formed cues from stored JSON. */
export function readCues(value: unknown): CaptionCue[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const cue = item as Partial<CaptionCue> | null;
    return cue && typeof cue.start === "number" && typeof cue.end === "number" && typeof cue.text === "string" && cue.end > cue.start
      ? [{ start: cue.start, end: cue.end, text: cue.text }]
      : [];
  });
}
