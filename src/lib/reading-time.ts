/**
 * Reading time estimate from raw Markdown body text (design.md §11 — words /
 * 200 wpm). Ceilinged and floored to a minimum of 1 minute so a very short
 * post never reads "0 min".
 */
export function readingTimeMinutes(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}
