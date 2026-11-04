import { describe, expect, it } from "vitest";

import { formatTimestamp, parseCaptionFile, parseTimestamp, readCues, toWebVtt } from "./captions";

describe("captions", () => {
  it("parses common timestamp forms", () => {
    expect(parseTimestamp("1:02.5")).toBe(62.5);
    expect(parseTimestamp("01:00:03,250")).toBe(3603.25);
    expect(parseTimestamp("45")).toBe(45);
    expect(parseTimestamp("1:xx")).toBeNaN();
    expect(formatTimestamp(62.5)).toBe("1:02.5");
    expect(formatTimestamp(3603.25)).toBe("1:00:03.3");
  });

  it("reads WebVTT and SRT, dropping ids, settings and markup", () => {
    const vtt = "WEBVTT\n\nintro\n00:00:00.000 --> 00:00:02.500 align:start\n<v Host>Welcome</v> back\n\n00:00:02.500 --> 00:00:05.000\nLet's begin.";
    expect(parseCaptionFile(vtt)).toEqual([{ start: 0, end: 2.5, text: "Welcome back" }, { start: 2.5, end: 5, text: "Let's begin." }]);
    const srt = "1\r\n00:00:01,000 --> 00:00:02,000\r\nHello\r\n\r\n2\r\n00:00:02,000 --> 00:00:03,500\r\nWorld\r\n";
    expect(parseCaptionFile(srt)).toEqual([{ start: 1, end: 2, text: "Hello" }, { start: 2, end: 3.5, text: "World" }]);
  });

  it("round-trips through WebVTT", () => {
    const cues = [{ start: 0, end: 1.25, text: "One" }, { start: 61, end: 62, text: "Two" }];
    expect(toWebVtt(cues)).toBe("WEBVTT\n\n00:00:00.000 --> 00:00:01.250\nOne\n\n00:01:01.000 --> 00:01:02.000\nTwo\n");
    expect(parseCaptionFile(toWebVtt(cues))).toEqual(cues);
  });

  it("keeps only well-formed stored cues", () => {
    expect(readCues([{ start: 0, end: 1, text: "ok" }, { start: 2, end: 1, text: "bad" }, "nope", null])).toEqual([{ start: 0, end: 1, text: "ok" }]);
    expect(readCues({})).toEqual([]);
  });
});
