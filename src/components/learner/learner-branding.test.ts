import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const sourceRoot = resolve(process.cwd(), "src");
const css = readFileSync(resolve(sourceRoot, "app/globals.css"), "utf8");
const rootLayout = readFileSync(resolve(sourceRoot, "app/layout.tsx"), "utf8");
const learnerLayout = readFileSync(resolve(sourceRoot, "app/learn/layout.tsx"), "utf8");
const lightTheme = css.match(/:root \{([\s\S]*?)\n\}/)?.[1] ?? "";
const darkTheme = css.match(/\.dark \{([\s\S]*?)\n\}/)?.[1] ?? "";

function token(block: string, name: string): string {
  const value = block.match(new RegExp(`--${name}:\\s*([^;]+);`))?.[1]?.trim();
  if (!value) throw new Error(`Missing theme token: ${name}`);
  const reference = value.match(/^var\(--([\w-]+)\)$/)?.[1];
  return reference ? token(block, reference) : value.toLowerCase();
}

function luminance(hex: string) {
  const channels = [1, 3, 5].map((index) => Number.parseInt(hex.slice(index, index + 2), 16) / 255);
  const [red, green, blue] = channels.map((channel) =>
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrast(foreground: string, background: string) {
  const foregroundLuminance = luminance(foreground);
  const backgroundLuminance = luminance(background);
  return (Math.max(foregroundLuminance, backgroundLuminance) + 0.05)
    / (Math.min(foregroundLuminance, backgroundLuminance) + 0.05);
}

describe("Sofiaa branding", () => {
  it("loads the brand fonts once in the root layout", () => {
    expect(rootLayout).toContain("Lexend");
    expect(rootLayout).toContain("Plus_Jakarta_Sans");
    expect(learnerLayout).not.toContain("next/font");
  });

  it("maps the logo colours to shared theme tokens", () => {
    expect(token(lightTheme, "brand-indigo")).toBe("#0920a0");
    expect(token(lightTheme, "brand-teal")).toBe("#029f9f");
    expect(token(lightTheme, "primary")).toBe("#0920a0");
  });

  it("keeps brand foreground pairings at WCAG AA contrast in both themes", () => {
    for (const theme of [lightTheme, darkTheme]) {
      expect(contrast(token(theme, "primary-foreground"), token(theme, "primary"))).toBeGreaterThanOrEqual(4.5);
      expect(contrast(token(theme, "brand-teal-strong"), token(theme, "background"))).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("provides a visible focus outline", () => {
    expect(css).toMatch(/:where\([^)]+\):focus-visible \{/);
    expect(contrast(token(lightTheme, "ring"), token(lightTheme, "background"))).toBeGreaterThanOrEqual(3);
    expect(contrast(token(darkTheme, "ring"), token(darkTheme, "background"))).toBeGreaterThanOrEqual(3);
  });
});
