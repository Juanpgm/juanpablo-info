#!/usr/bin/env node
// One-shot WCAG contrast check for the color pairings the 2026-08-10 visual
// redesign introduces or repaints (run: `node scripts/check-contrast.mjs`).
// ponytail: hardcoded pairs, not a general color-token scanner — this repo
// has a handful of accent-adjacent pairs, not hundreds; revisit only if
// that changes.

function srgbToLinear(c) {
  const cs = c / 255;
  return cs <= 0.03928 ? cs / 12.92 : ((cs + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance([r, g, b]) {
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

function hexToRgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function contrastRatio(hexA, hexB) {
  const lA = relativeLuminance(hexToRgb(hexA));
  const lB = relativeLuminance(hexToRgb(hexB));
  const lighter = Math.max(lA, lB);
  const darker = Math.min(lA, lB);
  return (lighter + 0.05) / (darker + 0.05);
}

// [label, foreground, background, minimum ratio]. Backgrounds that are a
// color-mix() tint over a surface are pre-composited to their effective
// rendered hex (18% accent/ink-muted over the surface it actually sits on).
const pairs = [
  ['.btn / .chip.is-active text (--on-accent) on --accent fill (identical both themes)', '#0a0a0a', '#22d3ee', 4.5],
  ['light: :focus-visible outline (--accent-ink) vs --surface', '#155e75', '#fafafa', 3],
  ['dark: :focus-visible outline (--accent) vs --surface', '#22d3ee', '#0a0a0a', 3],
  ['light: .badge-current text (--accent-ink) on 18% --accent tint', '#155e75', '#d3f3f8', 4.5],
  ['dark: .badge-current text (--accent) on 18% --accent tint', '#22d3ee', '#0e2e33', 4.5],
  ['light: .badge-example text (--ink-muted) on 18% --ink-muted tint', '#4b5563', '#dbdcdf', 4.5],
  ['light: .post-content a:hover (--accent-ink) vs --surface', '#155e75', '#fafafa', 4.5],
];

let failed = false;
for (const [label, fg, bg, min] of pairs) {
  const ratio = contrastRatio(fg, bg);
  const pass = ratio >= min;
  if (!pass) failed = true;
  console.log(`${pass ? 'PASS' : 'FAIL'} ${ratio.toFixed(2)}:1 (min ${min}:1) — ${label}`);
}

if (failed) {
  console.error('\nOne or more color pairs fail WCAG AA.');
  process.exit(1);
}
console.log('\nAll pairs pass WCAG AA.');
