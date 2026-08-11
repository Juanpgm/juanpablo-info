# Visual Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the site's teal/amber "engineering blueprint" identity with a cool, single-accent, minimalist identity (electric-cyan `--accent`, geometric sans display type, a diagonal-cut structural motif, a staggered-numeral listing pattern) while keeping the two already-distinctive elements (TwoWorlds bridge, photo duotone) and switching the theme's unset default from OS `prefers-color-scheme` to local device time.

**Architecture:** Every visual change is driven from a small set of CSS custom properties in `src/styles/global.css` (`--accent`, `--accent-hover`, `--accent-ink`, `--on-accent`, plus the retired `--primary`/`--secondary` names re-aliased to the new palette so the ~30 existing `--color-primary`/`--color-secondary` consumers repaint for free). Component-level tasks then add the structural motif (diagonal `clip-path`, staggered index numerals, skewed divider rules) to Hero, the Project/Blog listings, Timeline/EarlyExperience, TwoWorlds, and ContactModal, each consuming the Task 1 tokens. `src/layouts/BaseLayout.astro`'s no-flash theme script gets one self-contained local-time function; `ThemeToggle.astro` is untouched.

**Tech Stack:** Astro v7, Tailwind v4 CSS-first (`@theme` in `src/styles/global.css`, no `tailwind.config`), vanilla CSS (`clip-path`, `color-mix`, `@keyframes`), vitest for existing unit tests, Node (no new runtime deps) for a small WCAG contrast-check script.

## Global Constraints

- Cool-only palette: `--surface` `#fafafa` (light) / `#0a0a0a` (dark); `--ink` `#0a0a0a` (light) / `#fafafa` (dark); `--accent` `#22d3ee` — **identical hex in both themes**.
- `--ink-muted`, `--border`, `--error` are unchanged in value (spec: "theme-neutral utility tokens, not part of the identity palette being replaced").
- Any text literally colored in accent must hit WCAG AA (4.5:1 normal, 3:1 for non-text UI components like focus rings) in both themes — verified with real numbers, not eyeballed (`scripts/check-contrast.mjs`, Task 1).
- Display typography (hero headline, page/section titles, listing numerals) uses the geometric sans stack `system-ui, -apple-system, "Inter", sans-serif` via `--font-display`, negative letter-spacing (`-0.02em` to `-0.04em` by size), heavy weight (700–800) at large sizes. Body copy (Manrope, `--font-body`) is unchanged — blog prose is explicitly out of scope.
- The diagonal-cut motif's canonical clip-path values (from the design spec, used verbatim): mobile/default `polygon(0 0, 100% 0, 100% 78%, 0 100%)`, desktop (`min-width: 64rem`) `polygon(0 0, 100% 0, 100% 52%, 0 100%)`.
- Motion (marquee, scroll-reveal) must respect `prefers-reduced-motion` — reuse the existing sitewide guard at the bottom of `global.css`, don't duplicate it.
- Breakpoints to verify: 360px, 768px, 1280px+.
- Out of scope (do not touch): blog post inline prose/typography, `src/pages/og/[...slug].ts` and `scripts/generate-og-image.mjs`, i18n copy/translation content, the 20 hand-authored blog SVGs' own markup (only verify their color indirection still resolves).
- Every task's last code-verification step is `npm run build` (Astro build must succeed) plus a dev-server spot-check note — this repo has no visual/E2E test tooling, so build success + manual spot-check is the real verification signal (Standard testing mode, not Strict TDD).

---

## Design decisions made during planning (read before implementing)

These aren't in the design spec verbatim — they're concrete choices needed to turn its prose into real code. Flagging them so a reviewer can push back before Task 1 lands, since every later task depends on the names chosen here.

1. **Token renaming vs. re-aliasing.** `--primary`/`--secondary`/`--color-primary`/`--color-secondary` keep their existing *names* (touched in ~15 places across `global.css` alone) but their *values* are retired: `--primary` now aliases `--accent` (teal → cyan), `--secondary` aliases `--ink-muted` (amber has no replacement — the new palette has exactly one accent, so amber's former consumers become neutral). This avoids a sitewide find-replace rename; only the few places that need the *new* vocabulary explicitly (new AA-safe shades) reference `--color-accent`/`--color-accent-ink`/`--color-on-accent` directly.
2. **`--accent-ink` vs. raw `--accent` as text.** Raw `--accent` (`#22d3ee`) on `--surface` (`#fafafa`) measures ~1.7:1 — far below AA. Rule used everywhere in this plan: **raw `--color-accent` is for fills/backgrounds and non-text decorative marks (dividers, bullets, clip-path blocks) only.** Any place accent appears as literal foreground *text* (eyebrow, active numeral, timeline year, badge text, focus ring) uses `--color-accent-ink` instead — a darker cyan (`#155e75`, Tailwind's cyan-800) that clears AA in light mode; in dark mode `--accent-ink` just aliases `--accent` itself (already ~10.9:1 on `#0a0a0a`).
3. **`--on-accent`.** `.btn` and `.chip.is-active` painted their text with `var(--color-surface)`, which happened to work with the old dark teal fill but fails badly (~1.7:1) once the fill is bright cyan in light mode. Fixed with a new fixed-dark token, `--on-accent: #0a0a0a` (same value both themes, since `--accent` itself doesn't change between themes).
4. **Hero diagonal block placed as a top band, not an edge-to-edge overlay behind the headline.** To avoid ever needing headline text to sit ON the accent fill (which would need per-theme color-swapping to stay AA-safe), `.hero-content` is pushed below the block's bottom edge via `margin-top: calc(var(--hero-block-h) + var(--space-lg))`. No text ever overlaps the accent fill, so no additional contrast case is introduced by the hero redesign.
5. **Listing "active/current" numeral = first entry in the list.** Projects/blog posts have no natural "current" flag (unlike Timeline's `current` boolean); the first entry of each listing (already the newest/most-featured by each page's own sort order) gets the accent-ink numeral, every other entry gets the low-opacity ink "ghost" treatment.
6. **`ProjectCard`/`BlogCard` share one CSS block already** (`.project-grid,.blog-grid`, `.project-card,.blog-card`, and the combined title-typography selector) — confirmed by reading `global.css` — so Task 4 is one task covering both components, not two.
7. **EarlyExperience gets a proportionally smaller numeral**, not the full oversized listing numeral — it's a compact one-line-per-role accordion; an oversized numeral there would overwhelm the layout. A new `.listing-numeral--xs` modifier is added for it.

---

### Task 1: Color token + font-stack foundation

**Files:**
- Modify: `src/styles/global.css:1-11` (imports/comment header), `:42-81` (`@theme` block), `:83-115` (`:root` / `[data-theme='dark']`), `:160-171` (`.page-title`, `:focus-visible`), `:327-339` (`.btn`), `:452-458` (`.section-header h2`), `:470-492` (`.badge-example`, `.badge-current`), `:1050-1054` (`.chip.is-active`)
- Modify: `package.json:19` (drop `@fontsource-variable/fraunces`)
- Create: `scripts/check-contrast.mjs`

**Interfaces:**
- Produces (every later task consumes these): `--color-accent`, `--color-accent-hover`, `--color-accent-ink`, `--color-on-accent` (new); `--color-primary`, `--color-primary-hover`, `--color-secondary` (existing names, repointed values); `--font-display` (now the geometric sans stack). **Rule for later tasks:** use `--color-accent`/`--accent` only for fills/backgrounds/decorative marks; use `--color-accent-ink`/`--accent-ink` for any literal accent-colored text/foreground.
- Consumes: nothing (this is the foundation task).

- [ ] **Step 1: Update the font imports and header comment**

Replace lines 1–11 of `src/styles/global.css`:

```css
@import 'tailwindcss';

/* Self-hosted variable fonts (design directive) — no external Google Fonts
   request, better CWV. wght.css/opsz.css are the smaller single-axis files
   (skip italic/full/soft/wonk axes, not used here). */
@import '@fontsource-variable/fraunces/opsz.css';
@import '@fontsource-variable/manrope/wght.css';

/* Dark mode driven by `data-theme="dark"` on <html> (see design §8),
   not the OS-only `prefers-color-scheme` media variant. */
@custom-variant dark (&:where([data-theme='dark'], [data-theme='dark'] *));
```

with:

```css
@import 'tailwindcss';

/* Self-hosted variable font (design directive) — no external Google Fonts
   request, better CWV. wght.css is the smaller single-axis file (skip
   italic/full/soft/wonk axes, not used here). Fraunces was dropped in the
   2026-08-10 visual redesign — nothing references --font-display's old
   serif value anymore (grep-confirmed), so its import/package are gone too,
   not just its @theme value. Body copy keeps Manrope unchanged. */
@import '@fontsource-variable/manrope/wght.css';

/* Dark mode driven by `data-theme="dark"` on <html> (see design §8),
   not the OS-only `prefers-color-scheme` media variant. */
@custom-variant dark (&:where([data-theme='dark'], [data-theme='dark'] *));
```

- [ ] **Step 2: Update the palette doc comment**

Replace this paragraph inside the big comment block (originally lines 20–24):

```css
 * Palette: warm-tinted ink dark theme / cool-tinted off-white light theme
 * ("engineering blueprint" feel, not pure black/white). Two accents only:
 * technical teal (primary) + warm amber/copper (secondary, sparing use).
 * Exact WCAG AA audit is a later polish task (design R4, Phase 9.1) — these
 * pairings are chosen to already be close (teal-700/teal-400 class ratios).
```

with:

```css
 * Palette (2026-08-10 visual redesign): near-black ink / near-white surface,
 * single electric-cyan accent (--accent, IDENTICAL hex in both themes) used
 * only for "shout" elements (fills, active states, dividers) — ink/surface
 * carry ~90% of any view. Old teal (--primary)/amber (--secondary) VALUES
 * are retired but the NAMES survive as aliases (--primary -> --accent,
 * --secondary -> --ink-muted) so every existing --color-primary/
 * --color-secondary consumer repaints for free. WCAG AA is verified with
 * `node scripts/check-contrast.mjs`, not just eyeballed — --accent as TEXT
 * needed a dedicated darker --accent-ink shade in light mode (raw --accent
 * only hits ~1.7:1 on #fafafa, far below the 4.5:1 floor).
```

- [ ] **Step 3: Add the new tokens to the `@theme` block**

In `src/styles/global.css`, change line 43:

```css
  --font-display: 'Fraunces Variable', ui-serif, Georgia, serif;
```

to:

```css
  --font-display: system-ui, -apple-system, 'Inter', sans-serif;
```

Then extend the color block (originally lines 46–55):

```css
  --color-surface: var(--surface);
  --color-surface-subtle: var(--surface-subtle);
  --color-ink: var(--ink);
  --color-ink-muted: var(--ink-muted);
  --color-border: var(--border);
  --color-primary: var(--primary);
  --color-primary-hover: var(--primary-hover);
  --color-secondary: var(--secondary);
  --color-error: var(--error);
```

to:

```css
  --color-surface: var(--surface);
  --color-surface-subtle: var(--surface-subtle);
  --color-ink: var(--ink);
  --color-ink-muted: var(--ink-muted);
  --color-border: var(--border);
  --color-primary: var(--primary);
  --color-primary-hover: var(--primary-hover);
  --color-secondary: var(--secondary);
  --color-error: var(--error);
  --color-accent: var(--accent);
  --color-accent-hover: var(--accent-hover);
  --color-accent-ink: var(--accent-ink);
  --color-on-accent: var(--on-accent);
```

- [ ] **Step 4: Replace the `:root` theme values**

Replace the whole `:root { ... }` block (originally lines 83–103):

```css
:root {
  --surface: #f7f8fa;
  --surface-subtle: #eef0f3;
  --ink: #1a2027;
  --ink-muted: #4b5563;
  --border: #dde1e6;
  --primary: #0f766e;
  --primary-hover: #115e59;
  --secondary: #b45309;
  --error: #b91c1c;

  /* Hero diagram palette (design.md "Theme palette as indirected CSS vars")
     — indirected through --color-* so inline SVGs (set:html, no external doc
     boundary) auto-flip with the theme instead of needing a dark-mode
     override block here. */
  --diagram-ink: var(--color-ink);
  --diagram-line: var(--color-border);
  --diagram-fill: var(--color-surface-subtle);
  --diagram-accent: var(--color-primary);
  --diagram-accent-2: var(--color-secondary);
}
```

with:

```css
:root {
  --surface: #fafafa;
  --surface-subtle: #ececec;
  --ink: #0a0a0a;
  --ink-muted: #4b5563;
  --border: #dde1e6;
  --error: #b91c1c;

  /* --accent-hover: tactile hover-state shade for accent-filled buttons
     (darker in light mode, lighter in dark — same convention the old
     --primary-hover used). --accent-ink: AA-safe darker shade for TEXT set
     directly in accent on a light surface (see scripts/check-contrast.mjs).
     --on-accent: fixed dark text color for content painted ON an --accent
     fill (buttons, active chips) — always dark because --accent itself is
     always the same bright cyan in both themes. */
  --accent: #22d3ee;
  --accent-hover: #0891b2;
  --accent-ink: #155e75;
  --on-accent: #0a0a0a;

  /* --primary/--secondary keep their old NAMES (avoids renaming 30+
     --color-primary/--color-secondary consumers across every component)
     but their teal/amber VALUES are retired: --primary aliases the new
     accent, --secondary (no second accent color in the new one-accent
     palette) aliases --ink-muted so its former consumers (badge-example,
     .world-civil, --diagram-accent-2) render as a neutral tone instead of a
     second brand color. */
  --primary: var(--accent);
  --primary-hover: var(--accent-hover);
  --secondary: var(--ink-muted);

  /* Hero diagram palette (design.md "Theme palette as indirected CSS vars")
     — indirected through --color-* so inline SVGs (set:html, no external doc
     boundary) auto-flip with the theme instead of needing a dark-mode
     override block here. */
  --diagram-ink: var(--color-ink);
  --diagram-line: var(--color-border);
  --diagram-fill: var(--color-surface-subtle);
  --diagram-accent: var(--color-primary);
  --diagram-accent-2: var(--color-secondary);
}
```

- [ ] **Step 5: Replace the `[data-theme='dark']` theme values**

Replace (originally lines 105–115):

```css
[data-theme='dark'] {
  --surface: #1b1815;
  --surface-subtle: #242019;
  --ink: #f2ede6;
  --ink-muted: #b7ada0;
  --border: #332d25;
  --primary: #2dd4bf;
  --primary-hover: #5eead4;
  --secondary: #f59e0b;
  --error: #f87171;
}
```

with:

```css
[data-theme='dark'] {
  --surface: #0a0a0a;
  --surface-subtle: #181818;
  --ink: #fafafa;
  --ink-muted: #b7ada0;
  --border: #332d25;
  --error: #f87171;

  --accent: #22d3ee;
  --accent-hover: #67e8f9;
  --accent-ink: var(--accent);
  --on-accent: #0a0a0a;

  --primary: var(--accent);
  --primary-hover: var(--accent-hover);
  --secondary: var(--ink-muted);
}
```

- [ ] **Step 6: Fix `:focus-visible` and `.page-title` tracking**

Replace (originally lines 160–171):

```css
.page-title {
  font-size: var(--text-3xl);
  font-weight: 700;
  margin-bottom: var(--space-lg);
}

/* Accessible focus ring — never removed, never left to the browser default. */
:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
  border-radius: 2px;
}
```

with:

```css
.page-title {
  font-size: var(--text-3xl);
  font-weight: 800;
  letter-spacing: -0.03em;
  margin-bottom: var(--space-lg);
}

/* Accessible focus ring — never removed, never left to the browser default.
   --color-accent-ink, not raw --color-accent: a focus ring is a WCAG 2.4.11
   non-text-contrast target (3:1 minimum against its surroundings) — raw
   --accent only hits ~1.7:1 on the light-theme surface, --accent-ink clears
   ~6.9:1 (scripts/check-contrast.mjs). */
:focus-visible {
  outline: 2px solid var(--color-accent-ink);
  outline-offset: 2px;
  border-radius: 2px;
}
```

- [ ] **Step 7: Fix `.btn`'s text color**

Replace (originally lines 327–333):

```css
.btn {
  padding: var(--space-2xs) var(--space-sm);
  background-color: var(--color-primary);
  color: var(--color-surface);
  text-decoration: none;
  font-weight: 600;
}
```

with:

```css
.btn {
  padding: var(--space-2xs) var(--space-sm);
  background-color: var(--color-primary);
  /* --color-on-accent, not --color-surface: --color-primary now aliases the
     bright --accent cyan in BOTH themes, and --color-surface flips from
     near-white (light) to near-black (dark) — the old pairing accidentally
     still worked in dark mode but failed AA in light mode (~1.7:1, see
     scripts/check-contrast.mjs). --on-accent is a fixed dark value that's
     correct against --accent in either theme. */
  color: var(--color-on-accent);
  text-decoration: none;
  font-weight: 600;
}
```

- [ ] **Step 8: Fix `.section-header h2` tracking**

Replace (originally lines 452–458):

```css
.section-header h2 {
  font-size: var(--text-2xl);
  font-weight: 700;
  /* .section-header itself owns the bottom spacing (margin-bottom below) —
     zero the h2's own margin so they don't stack. */
  margin-bottom: 0;
}
```

with:

```css
.section-header h2 {
  font-size: var(--text-2xl);
  font-weight: 800;
  letter-spacing: -0.02em;
  /* .section-header itself owns the bottom spacing (margin-bottom below) —
     zero the h2's own margin so they don't stack. */
  margin-bottom: 0;
}
```

- [ ] **Step 9: Fix `.badge-example` and `.badge-current`**

Replace (originally lines 470–492):

```css
.badge-example {
  background-color: color-mix(in srgb, var(--color-secondary) 18%, transparent);
  /* Light-theme --secondary (#b45309) on this 18%-tint background only hits
     3.69:1 (Lighthouse-measured, Phase 9.1 R4 audit) — darkened for AA 4.5:1.
     Dark-theme --secondary (#f59e0b) on its tint already clears ~5.9:1. */
  color: #92400e;
}

[data-theme='dark'] .badge-example {
  color: var(--color-secondary);
}

.badge-current {
  background-color: color-mix(in srgb, var(--color-primary) 18%, transparent);
  /* Light-theme --primary (#0f766e) on this 18%-tint background only hits
     4.03:1 (Phase 9.1 R4 audit) — reuses the existing --primary-hover token
     (already darker, already defined) for AA 4.5:1 instead of a new color. */
  color: var(--color-primary-hover);
}

[data-theme='dark'] .badge-current {
  color: var(--color-primary);
}
```

with:

```css
.badge-example {
  background-color: color-mix(in srgb, var(--color-secondary) 18%, transparent);
  /* --secondary now aliases --ink-muted (2026-08-10 redesign, no second
     accent color in the new palette) — a same-hue tint+text pairing is
     inherently well-contrasted (~5.5:1 light, ~similar dark — verified by
     scripts/check-contrast.mjs), so the old per-theme hardcoded override
     hex is gone. */
  color: var(--color-ink-muted);
}

.badge-current {
  background-color: color-mix(in srgb, var(--color-primary) 18%, transparent);
  /* --primary now aliases --accent (bright cyan) — --accent-hover isn't
     dark enough on this tint (~3.1:1, fails AA), --accent-ink is
     (~6.2:1, scripts/check-contrast.mjs). */
  color: var(--color-accent-ink);
}

[data-theme='dark'] .badge-current {
  /* --accent already clears ~8:1 on its own dark-theme tint. */
  color: var(--color-accent);
}
```

- [ ] **Step 10: Fix `.chip.is-active`**

Replace (originally lines 1050–1054):

```css
.chip.is-active {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-surface);
}
```

with:

```css
.chip.is-active {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
  /* Same fix as .btn above — text painted on an --accent fill needs the
     fixed --on-accent dark value, not the theme-flipping --color-surface. */
  color: var(--color-on-accent);
}
```

- [ ] **Step 11: Create the contrast-check script**

Create `scripts/check-contrast.mjs`:

```js
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
```

- [ ] **Step 12: Run the contrast check**

Run: `node scripts/check-contrast.mjs`
Expected: every line prints `PASS`, final line `All pairs pass WCAG AA.`, exit code 0.

- [ ] **Step 13: Drop the Fraunces dependency**

In `package.json`, remove line 19 (`"@fontsource-variable/fraunces": "^5.3.0",`).

Run: `npm install`
Expected: `package-lock.json` updates, removing the `@fontsource-variable/fraunces` entries; no errors.

- [ ] **Step 14: Verify nothing else references Fraunces**

Run: `rg -i fraunces` (or `grep -ri fraunces .` if `rg` isn't available)
Expected: no matches under `src/` or `package.json` (the only remaining hits, if any, are historical mentions in `docs/superpowers/specs/*.md`, which are fine to leave — they're history, not code).

- [ ] **Step 15: Run the existing test suite and build**

Run: `npm run test`
Expected: all existing tests pass unchanged (this task touches no TS-visible exports).

Run: `npm run build`
Expected: build succeeds with no errors.

- [ ] **Step 16: Commit**

```bash
git add src/styles/global.css package.json package-lock.json scripts/check-contrast.mjs
git commit -m "feat(theme): retire teal/amber palette for single-accent cyan, drop Fraunces"
```

---

### Task 2: Theme-default behavior (local time)

**Files:**
- Modify: `src/layouts/BaseLayout.astro:54-64`

**Interfaces:**
- Consumes: nothing new (this task is self-contained; `ThemeToggle.astro`'s `localStorage.setItem('theme', ...)` contract is unchanged and still wins whenever present).
- Produces: nothing later tasks reference (leaf task).

- [ ] **Step 1: Replace the theme-init script's fallback**

Replace (originally lines 54–64 of `src/layouts/BaseLayout.astro`):

```html
    <script is:inline>
      (function () {
        function applyTheme() {
          var stored = localStorage.getItem('theme');
          var theme = stored || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
          document.documentElement.dataset.theme = theme;
        }
        applyTheme();
        document.addEventListener('astro:after-swap', applyTheme);
      })();
    </script>
```

with:

```html
    <script is:inline>
      (function () {
        // Local-time default (2026-08-10 visual redesign) replaces the old
        // matchMedia('(prefers-color-scheme: dark)') fallback — 7:00-19:00
        // local device time reads as light, otherwise dark.
        // localStorage.theme (set by ThemeToggle.astro) still wins whenever
        // present — only the *unset* default changed. No running interval:
        // this only re-evaluates on page load / astro:after-swap, so a tab
        // left open across the 7:00/19:00 boundary won't flip live —
        // acceptable for a portfolio site.
        function defaultThemeForLocalTime() {
          var hour = new Date().getHours();
          return hour >= 7 && hour < 19 ? 'light' : 'dark';
        }
        function applyTheme() {
          var stored = localStorage.getItem('theme');
          var theme = stored || defaultThemeForLocalTime();
          document.documentElement.dataset.theme = theme;
        }
        applyTheme();
        document.addEventListener('astro:after-swap', applyTheme);
      })();
    </script>
```

- [ ] **Step 2: Manually verify the local-time default in the browser**

Run: `npm run dev`, open the site in a browser with dev tools, clear `localStorage` (`localStorage.removeItem('theme')` in the console), then reload.
Expected: `document.documentElement.dataset.theme` is `'light'` if the current wall-clock hour is 7–18, else `'dark'` — confirm by running `new Date().getHours()` in the same console and comparing.

- [ ] **Step 3: Verify the manual override still works and persists**

In the same session, click the theme-toggle button (sun/moon icon in the header).
Expected: theme flips immediately; `localStorage.getItem('theme')` now holds the new value; reloading the page keeps that value regardless of the current hour (manual choice still wins).

- [ ] **Step 4: Run the build**

Run: `npm run build`
Expected: build succeeds with no errors.

- [ ] **Step 5: Commit**

```bash
git add src/layouts/BaseLayout.astro
git commit -m "feat(theme): default to local-time light/dark instead of prefers-color-scheme"
```

---

### Task 3: Hero redesign

**Files:**
- Modify: `src/components/Hero.astro` (full rewrite), `src/styles/global.css:501-559` (`.hero` section)

**Interfaces:**
- Consumes: `--color-accent`, `--color-accent-ink`, `--color-on-accent` (Task 1); `--space-*`, `--text-display-lg`, `--text-display-sm`, `--font-display` (existing); `.btn`, `.btn-lg`, `.btn-outline` (existing, already accent-filled via Task 1's repoint — no changes needed here).
- Produces: the literal clip-path values `polygon(0 0, 100% 0, 100% 78%, 0 100%)` (default/mobile) and `polygon(0 0, 100% 0, 100% 52%, 0 100%)` (desktop, `min-width: 64rem`) — reused verbatim by Task 6's TwoWorlds connector badge.

- [ ] **Step 1: Rewrite Hero.astro**

Replace the full contents of `src/components/Hero.astro`:

```astro
---
// Home hero (2026-08-10 visual redesign): full-bleed diagonal accent block
// bleeding from the top edge, an oversized geometric-sans headline, a solid
// accent CTA (`.btn`, already accent-filled via global.css's token
// repoint), and a secondary CSS-only marquee of skill keywords below the
// fold line. The "puentes entre..." tagline hook and the two CTAs are
// unchanged content-wise (proposal.md §4.1) — only the visual treatment
// changes.
import { getRelativeLocaleUrl } from 'astro:i18n';
import ContactModal from './ContactModal.astro';
import { t, useLocale } from '../i18n';
import { skills } from '../data/skills';

const locale = useLocale(Astro.currentLocale);
// Marquee content: real, already-localized skill labels (data/skills.ts) —
// no new i18n strings needed. Duplicated once so the CSS-only loop
// (@keyframes translateX -50%) has no visible seam.
const marqueeItems = [...skills.ai, ...skills.civil].map((skill) => t(locale, skill.labelKey));
---

<section class="hero" data-reveal aria-labelledby="hero-title">
  <div class="hero-block" aria-hidden="true"></div>
  <div class="hero-content">
    <p class="hero-eyebrow">{t(locale, 'hero.subtitle')}</p>
    <h1 id="hero-title" class="hero-title">{t(locale, 'hero.title')}</h1>
    <p class="hero-tagline">{t(locale, 'hero.tagline')}</p>
    <div class="hero-actions">
      <a href={getRelativeLocaleUrl(locale, 'experience')} class="btn btn-lg">
        {t(locale, 'hero.ctaExperience')}
      </a>
      <button type="button" class="btn btn-lg btn-outline" data-open-contact-modal>
        {t(locale, 'hero.ctaContact')}
      </button>
      <span class="hero-location">{t(locale, 'hero.location')}</span>
    </div>
  </div>
  <div class="hero-marquee" aria-hidden="true">
    <div class="hero-marquee__track">
      {marqueeItems.map((item) => <span class="hero-marquee__item">{item}</span>)}
      {marqueeItems.map((item) => <span class="hero-marquee__item">{item}</span>)}
    </div>
  </div>
</section>

<ContactModal locale={locale} />
```

(`aria-hidden="true"` on the marquee: it's decorative/duplicated content — the same skill labels are already announced accessibly in the TwoWorlds section below, so this avoids redundant screen-reader noise.)

- [ ] **Step 2: Replace the Hero CSS block**

Replace the `.hero` section of `src/styles/global.css` (originally lines 501–544, i.e. from `/* Hero */` through `.hero-location`'s closing brace):

```css
/* Hero */
.hero {
  max-width: 56rem;
  margin-inline: auto;
  /* Compacted (was --space-3xl/--space-2xl, 96px/64px) — that plus the
     next .section's own 64px top padding stacked to 128px of dead space
     between the CTA row and "Sobre mí" below it. */
  padding: var(--space-2xl) var(--space-md) var(--space-lg);
  text-align: center;
}

.hero-eyebrow {
  color: var(--color-primary);
  font-weight: 600;
  letter-spacing: 0.02em;
}

.hero-title {
  margin-block: var(--space-xs) var(--space-sm);
  font-size: var(--text-display-lg);
  font-weight: 700;
  line-height: 1.05;
}

.hero-tagline {
  max-width: 42rem;
  margin-inline: auto;
  font-size: var(--text-display-sm);
  color: var(--color-ink-muted);
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: var(--space-md);
  margin-top: var(--space-md);
}

.hero-location {
  color: var(--color-ink-muted);
  font-size: var(--text-sm);
}
```

with:

```css
/* Hero (2026-08-10 visual redesign): full-bleed section (no more centered
   max-width column) so `.hero-block`'s diagonal clip-path can bleed across
   the top edge — `.hero-content` re-applies the readable column width and
   is pushed below the block's bottom edge (see --hero-block-h below), so
   headline text never overlaps the accent fill and never needs its own
   on-accent color handling. Text-align switches from center to left. */
.hero {
  position: relative;
  isolation: isolate;
  padding: var(--space-lg) var(--space-md) var(--space-lg);
  --hero-block-h: 8rem;
}

/* Diagonal accent block — the site's structural motif. Steep ~52% cut is a
   desktop flourish; mobile keeps a shallower ~78% cut so it stays a small
   band, matching "never a large ambient background" — see the responsive
   override below. Solid fill (not tinted): the design spec explicitly
   calls out "the diagonal block fill" as one of the few places raw accent
   saturation belongs. */
.hero-block {
  position: absolute;
  inset: 0 0 auto 0;
  z-index: -1;
  height: var(--hero-block-h);
  background-color: var(--color-accent);
  clip-path: polygon(0 0, 100% 0, 100% 78%, 0 100%);
}

@media (min-width: 64rem) {
  .hero {
    --hero-block-h: 12rem;
  }

  .hero-block {
    clip-path: polygon(0 0, 100% 0, 100% 52%, 0 100%);
  }
}

.hero-content {
  position: relative;
  max-width: 56rem;
  margin-inline: auto;
  margin-top: calc(var(--hero-block-h) + var(--space-lg));
}

/* Eyebrow: light-weight, wide-tracked label contrasted against the heavy
   headline below — --color-accent-ink, not raw --color-accent (real text
   on --color-surface needs the AA-safe shade, see global.css's palette
   comment). */
.hero-eyebrow {
  display: block;
  color: var(--color-accent-ink);
  font-size: 0.625rem;
  font-weight: 500;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.hero-title {
  margin-block: var(--space-xs) var(--space-sm);
  font-size: var(--text-display-lg);
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 1.05;
}

.hero-tagline {
  max-width: 42rem;
  font-size: var(--text-display-sm);
  color: var(--color-ink-muted);
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-md);
  margin-top: var(--space-md);
}

.hero-location {
  color: var(--color-ink-muted);
  font-size: var(--text-sm);
}

/* Marquee ribbon: secondary kinetic element below the fold line, CSS-only
   (no JS animation library). It sits after the CTA row in both source
   order and visual position on every viewport, so the primary CTA always
   reads first — mobile just shrinks its height/font-size, per the
   responsive requirement. prefers-reduced-motion is handled by the
   sitewide `*, *::before, *::after { animation-duration: 0.01ms !important }`
   guard further down this file — no separate rule needed here. */
.hero-marquee {
  margin-top: var(--space-xl);
  overflow: hidden;
  border-top: 1px solid var(--color-border);
  border-bottom: 1px solid var(--color-border);
  padding-block: var(--space-2xs);
}

.hero-marquee__track {
  display: flex;
  width: max-content;
  gap: var(--space-lg);
  animation: hero-marquee-scroll 32s linear infinite;
}

.hero-marquee__item {
  flex-shrink: 0;
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-ink-muted);
  white-space: nowrap;
}

@keyframes hero-marquee-scroll {
  from {
    transform: translateX(0);
  }
  to {
    /* The track is rendered twice (see Hero.astro) — translating by
       exactly -50% of the doubled track loops seamlessly with no jump. */
    transform: translateX(-50%);
  }
}

@media (max-width: 40rem) {
  .hero-marquee {
    margin-top: var(--space-lg);
    padding-block: var(--space-3xs);
  }

  .hero-marquee__item {
    font-size: var(--text-xs);
  }
}
```

- [ ] **Step 3: Run the build and spot-check**

Run: `npm run build`
Expected: build succeeds.

Run: `npm run dev`, open the home page.
Expected: hero shows a cyan diagonal band across the top, headline is large/bold/tight-tracked and left-aligned (not centered), a thin scrolling keyword ribbon appears below the CTA row, "Ver experiencia" is a solid cyan button, "Contactar" stays an outline button. Toggle the theme and confirm both render correctly.

- [ ] **Step 4: Commit**

```bash
git add src/components/Hero.astro src/styles/global.css
git commit -m "feat(hero): diagonal accent block, oversized headline, marquee ribbon"
```

---

### Task 4: Project/blog listing redesign

**Files:**
- Modify: `src/components/ProjectCard.astro`, `src/components/BlogCard.astro`, `src/styles/global.css:917-1023` (project/blog card section), `src/pages/[locale]/projects.astro:30`, `src/pages/[locale]/blog/index.astro:32`, `src/pages/[locale]/index.astro:90,100`

**Interfaces:**
- Consumes: `--color-accent-ink`, `--color-border`, `--font-display`, `--space-*` (Task 1/existing).
- Produces: `.listing-numeral`, `.listing-numeral__index`, `.listing-numeral__ghost`, `.listing-content` — reused (with a `--sm`/`--xs` size modifier) by Task 5's Timeline/EarlyExperience re-skin.

- [ ] **Step 1: Add an `index` prop to `ProjectCard.astro` and wire the numeral markup**

In `src/components/ProjectCard.astro`, change the `Props` interface (originally lines 11–28):

```ts
interface Props {
  project: ProjectSeed & {
    stars?: number | null;
    primaryLanguage?: string | null;
    lastUpdated?: string | null;
    stale?: boolean;
  };
  locale: Locale;
  headingLevel?: 'h2' | 'h3';
}

const { project, locale, headingLevel = 'h3' } = Astro.props;
```

to:

```ts
interface Props {
  project: ProjectSeed & {
    stars?: number | null;
    primaryLanguage?: string | null;
    lastUpdated?: string | null;
    stale?: boolean;
  };
  locale: Locale;
  headingLevel?: 'h2' | 'h3';
  /** 0-based position in the listing — drives the oversized index numeral
   * (2026-08-10 visual redesign). Must match the array index the caller
   * maps over. */
  index: number;
}

const { project, locale, headingLevel = 'h3', index } = Astro.props;
```

Then replace the template (originally lines 35–65):

```astro
<article class="project-card" data-reveal>
  <header class="project-card__header">
    <Heading class="project-card__title">{project.name}</Heading>
    {project.isExample && <span class="badge badge-example">{t(locale, 'projects.exampleBadge')}</span>}
  </header>

  <p class="project-card__description">{project.description[locale]}</p>

  <ul class="project-card__stack">
    {project.stack.map((tech) => <li class="badge badge-stack">{tech}</li>)}
  </ul>

  {
    hasLiveMeta && (
      <p class="project-card__meta">
        {project.primaryLanguage && <span>{project.primaryLanguage}</span>}
        {project.lastUpdated && (
          <time datetime={project.lastUpdated}>{new Date(project.lastUpdated).toLocaleDateString(locale)}</time>
        )}
      </p>
    )
  }

  {
    project.repoUrl && (
      <a href={project.repoUrl} class="nav-link" target="_blank" rel="noreferrer noopener">
        {t(locale, 'projects.viewRepo')}
      </a>
    )
  }
</article>
```

with:

```astro
<article class="project-card" data-reveal>
  <div class="listing-numeral" aria-hidden="true">
    <span class="listing-numeral__ghost">{String(index + 2).padStart(2, '0')}</span>
    <span class="listing-numeral__index">{String(index + 1).padStart(2, '0')}</span>
  </div>
  <div class="listing-content">
    <header class="project-card__header">
      <Heading class="project-card__title">{project.name}</Heading>
      {project.isExample && <span class="badge badge-example">{t(locale, 'projects.exampleBadge')}</span>}
    </header>

    <p class="project-card__description">{project.description[locale]}</p>

    <ul class="project-card__stack">
      {project.stack.map((tech) => <li class="badge badge-stack">{tech}</li>)}
    </ul>

    {
      hasLiveMeta && (
        <p class="project-card__meta">
          {project.primaryLanguage && <span>{project.primaryLanguage}</span>}
          {project.lastUpdated && (
            <time datetime={project.lastUpdated}>{new Date(project.lastUpdated).toLocaleDateString(locale)}</time>
          )}
        </p>
      )
    }

    {
      project.repoUrl && (
        <a href={project.repoUrl} class="nav-link" target="_blank" rel="noreferrer noopener">
          {t(locale, 'projects.viewRepo')}
        </a>
      )
    }
  </div>
</article>
```

- [ ] **Step 2: Add an `index` prop to `BlogCard.astro` and wire the numeral markup**

In `src/components/BlogCard.astro`, change the `Props` interface and destructure (originally lines 10–19):

```ts
interface Props {
  entry: CollectionEntry<'blog'>;
  locale: Locale;
  headingLevel?: 'h2' | 'h3';
}

const { entry, locale, headingLevel = 'h3' } = Astro.props;
```

to:

```ts
interface Props {
  entry: CollectionEntry<'blog'>;
  locale: Locale;
  headingLevel?: 'h2' | 'h3';
  /** 0-based position in the listing — drives the oversized index numeral
   * (2026-08-10 visual redesign). Must match the array index the caller
   * maps over. */
  index: number;
}

const { entry, locale, headingLevel = 'h3', index } = Astro.props;
```

Then replace the template (originally lines 35–52):

```astro
<article class="blog-card" data-reveal data-tags={entry.data.tags.join(' ')}>
  {heroDiagram && (
    <div class="blog-card__image" role="img" aria-label={entry.data.heroImageAlt} set:html={heroDiagram} />
  )}
  <p class="blog-card__meta">
    <time datetime={entry.data.pubDate.toISOString()}>{formatCalendarDate(entry.data.pubDate, locale, { year: 'numeric', month: 'long' })}</time>
    <span aria-hidden="true"> · </span>
    {minutes} {t(locale, 'blog.readingTimeSuffix')}
  </p>
  <Heading class="blog-card__title">
    <a href={href}>{entry.data.title}</a>
  </Heading>
  <p class="blog-card__description">{entry.data.description}</p>
  <ul class="blog-card__tags">
    {entry.data.tags.map((tag) => <li class="badge badge-tag">{t(locale, `blog.tag.${tag}` as UIKey)}</li>)}
  </ul>
  <a href={href} class="nav-link">{t(locale, 'blog.readMore')} →</a>
</article>
```

with:

```astro
<article class="blog-card" data-reveal data-tags={entry.data.tags.join(' ')}>
  <div class="listing-numeral" aria-hidden="true">
    <span class="listing-numeral__ghost">{String(index + 2).padStart(2, '0')}</span>
    <span class="listing-numeral__index">{String(index + 1).padStart(2, '0')}</span>
  </div>
  <div class="listing-content">
    {heroDiagram && (
      <div class="blog-card__image" role="img" aria-label={entry.data.heroImageAlt} set:html={heroDiagram} />
    )}
    <p class="blog-card__meta">
      <time datetime={entry.data.pubDate.toISOString()}>{formatCalendarDate(entry.data.pubDate, locale, { year: 'numeric', month: 'long' })}</time>
      <span aria-hidden="true"> · </span>
      {minutes} {t(locale, 'blog.readingTimeSuffix')}
    </p>
    <Heading class="blog-card__title">
      <a href={href}>{entry.data.title}</a>
    </Heading>
    <p class="blog-card__description">{entry.data.description}</p>
    <ul class="blog-card__tags">
      {entry.data.tags.map((tag) => <li class="badge badge-tag">{t(locale, `blog.tag.${tag}` as UIKey)}</li>)}
    </ul>
    <a href={href} class="nav-link">{t(locale, 'blog.readMore')} →</a>
  </div>
</article>
```

- [ ] **Step 3: Pass `index` from every call site**

In `src/pages/[locale]/projects.astro`, change line 30 from:

```astro
      {projects.map((project) => <ProjectCard project={project} locale={locale} headingLevel="h2" />)}
```

to:

```astro
      {projects.map((project, index) => <ProjectCard project={project} locale={locale} index={index} headingLevel="h2" />)}
```

In `src/pages/[locale]/blog/index.astro`, change line 32 from:

```astro
      {posts.map((post) => <BlogCard entry={post} locale={locale} headingLevel="h2" />)}
```

to:

```astro
      {posts.map((post, index) => <BlogCard entry={post} locale={locale} index={index} headingLevel="h2" />)}
```

In `src/pages/[locale]/index.astro`, change line 90 from:

```astro
      {featuredProjects.map((project) => <ProjectCard project={project} locale={locale} />)}
```

to:

```astro
      {featuredProjects.map((project, index) => <ProjectCard project={project} locale={locale} index={index} />)}
```

and change line 100 from:

```astro
      {latestPosts.map((post) => <BlogCard entry={post} locale={locale} />)}
```

to:

```astro
      {latestPosts.map((post, index) => <BlogCard entry={post} locale={locale} index={index} />)}
```

- [ ] **Step 4: Replace the listing CSS**

Replace (originally lines 917–958 of `src/styles/global.css`, from `/* Project cards */` through the end of the `.project-card:hover, .blog-card:hover` rule):

```css
/* Project cards */
.project-grid,
.blog-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
  gap: var(--space-md);
}

.blog-empty-state {
  color: var(--color-ink-muted);
  text-align: center;
  padding: var(--space-xl) 0;
}

.project-card,
.blog-card {
  display: grid;
  /* minmax(0, 1fr), not the implicit `auto` an unqualified single-column
     grid gets by default: `auto` tracks size to the max-content of their
     widest child, so an unbreakable long title (e.g. a repo name like
     "AutoML4RainEstimation" with no spaces) grows the card's own internal
     column past its padding box — `min-width: 0` on the card itself (below)
     only fixes its sizing as a *grid item* of .project-grid/.blog-card,
     this fixes it as a *grid container* for its own children. */
  grid-template-columns: minmax(0, 1fr);
  gap: var(--space-xs);
  align-content: start;
  padding: var(--space-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background-color: var(--color-surface);
  min-width: 0;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;
}

.project-card:hover,
.blog-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 24px -12px rgb(0 0 0 / 0.25);
}
```

with:

```css
/* Project / blog listings (2026-08-10 visual redesign): the bordered-card
   grid is replaced by a staggered, asymmetric list — an oversized index
   numeral anchors each entry, a skewed divider rule replaces the card
   border, and alternating left/right indentation (desktop only, see the
   min-width media query below) replaces the uniform grid rhythm. */
.project-grid,
.blog-grid {
  display: flex;
  flex-direction: column;
}

.blog-empty-state {
  color: var(--color-ink-muted);
  text-align: center;
  padding: var(--space-xl) 0;
}

.project-card,
.blog-card {
  position: relative;
  display: grid;
  grid-template-columns: clamp(3.5rem, 8vw, 6rem) minmax(0, 1fr);
  align-items: start;
  gap: var(--space-md);
  padding-block: var(--space-lg);
  min-width: 0;
  transition: padding-inline-start 0.15s ease;
}

.project-card:hover,
.blog-card:hover {
  padding-inline-start: var(--space-sm);
}

/* Divider: a thin rule with a slight skewY, isolated on its own
   pseudo-element (not the card's own border-bottom) so the skew never
   distorts the card's actual text content. */
.project-card::after,
.blog-card::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 1px;
  background-color: var(--color-border);
  transform: skewY(-1deg);
}

.project-card:last-child::after,
.blog-card:last-child::after {
  display: none;
}

@media (min-width: 48rem) {
  .project-card:nth-child(even),
  .blog-card:nth-child(even) {
    margin-inline-start: var(--space-xl);
  }

  .project-card:nth-child(odd),
  .blog-card:nth-child(odd) {
    margin-inline-end: var(--space-xl);
  }
}

/* Oversized index numeral: clamp() (same technique as --text-display-lg)
   so it scales down and never forces horizontal scroll on mobile. The
   first entry in the list reads as "active/current" (--color-accent-ink,
   the AA-safe accent shade); every other entry's numeral is a low-opacity
   ink "ghost" instead, giving the staggered/overlapping depth cue the
   design calls for. Reused (with a --sm/--xs size modifier) by Timeline
   and EarlyExperience. */
.listing-numeral {
  position: relative;
  font-family: var(--font-display);
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1;
  user-select: none;
}

.listing-numeral__index {
  position: relative;
  z-index: 1;
  font-size: clamp(2.5rem, 6vw, 4rem);
  color: var(--color-ink);
}

.project-card:first-child .listing-numeral__index,
.blog-card:first-child .listing-numeral__index {
  color: var(--color-accent-ink);
}

.listing-numeral__ghost {
  position: absolute;
  top: 0.4em;
  left: 0.5em;
  z-index: 0;
  font-size: clamp(2.5rem, 6vw, 4rem);
  color: var(--color-ink);
  opacity: 0.08;
}

.project-card:last-child .listing-numeral__ghost,
.blog-card:last-child .listing-numeral__ghost {
  display: none;
}

.listing-content {
  display: grid;
  gap: var(--space-xs);
  min-width: 0;
}
```

- [ ] **Step 5: Type-check, test, and build**

Run: `npx astro check`
Expected: no type errors (the new `index: number` prop is required and now passed at every call site).

Run: `npm run test`
Expected: unaffected existing tests pass.

Run: `npm run build`
Expected: build succeeds.

Run: `npm run dev`, open `/projects`, `/blog`, and the home page.
Expected: each project/post renders as a divider-separated row with a large index numeral on the left (first row's numeral in cyan, the rest in low-opacity dark), alternating slight indentation from the second row on at ≥768px width, no horizontal scroll at 360px.

- [ ] **Step 6: Commit**

```bash
git add src/components/ProjectCard.astro src/components/BlogCard.astro src/styles/global.css src/pages/\[locale\]/projects.astro src/pages/\[locale\]/blog/index.astro src/pages/\[locale\]/index.astro
git commit -m "feat(listings): staggered index-numeral layout for projects and blog"
```

---

### Task 5: Timeline / EarlyExperience re-skin

**Files:**
- Modify: `src/components/Timeline.astro`, `src/components/TimelineCard.astro`, `src/components/EarlyExperience.astro`, `src/styles/global.css:771-916` (timeline/early-experience section)

**Interfaces:**
- Consumes: `.listing-numeral`, `.listing-numeral__index`, `.listing-numeral__ghost` (Task 4); `--color-accent-ink` (Task 1).
- Produces: `.listing-numeral--sm`, `.listing-numeral--xs` size modifiers (leaf task, nothing later consumes these, but kept as generically-named modifiers in case a future pass wants them).

- [ ] **Step 1: Pass `index` through to `TimelineCard`**

In `src/components/Timeline.astro`, the `.map` already destructures `index` (used for `open={index === 0}`). Change line 23 from:

```astro
        <TimelineCard entry={entry} locale={locale} open={index === 0} headingLevel={headingLevel} />
```

to:

```astro
        <TimelineCard entry={entry} locale={locale} open={index === 0} headingLevel={headingLevel} index={index} />
```

- [ ] **Step 2: Add the `index` prop and numeral markup to `TimelineCard.astro`**

Change the `Props` interface (originally lines 11–20):

```ts
interface Props {
  entry: CollectionEntry<'experience'>;
  locale: Locale;
  open?: boolean;
  headingLevel?: 'h2' | 'h3';
}

const { entry, locale, open = false, headingLevel = 'h3' } = Astro.props;
```

to:

```ts
interface Props {
  entry: CollectionEntry<'experience'>;
  locale: Locale;
  open?: boolean;
  headingLevel?: 'h2' | 'h3';
  /** 0-based position in the timeline — drives the small index numeral
   * (2026-08-10 visual redesign). Must match the array index the caller
   * maps over. */
  index: number;
}

const { entry, locale, open = false, headingLevel = 'h3', index } = Astro.props;
```

Then change the `<summary>` (originally lines 40–47):

```astro
  <summary class="timeline-card__summary">
    <Heading class="timeline-card__heading">
      <strong>{company}</strong>
      <span class="timeline-card__role">{role}</span>
    </Heading>
    <span class="timeline-card__year">{getCalendarYear(startDate)}</span>
    {current && <span class="badge badge-current">{t(locale, 'experience.current')}</span>}
  </summary>
```

to:

```astro
  <summary class="timeline-card__summary">
    <div class="listing-numeral listing-numeral--sm" aria-hidden="true">
      <span class="listing-numeral__ghost">{String(index + 2).padStart(2, '0')}</span>
      <span class="listing-numeral__index">{String(index + 1).padStart(2, '0')}</span>
    </div>
    <Heading class="timeline-card__heading">
      <strong>{company}</strong>
      <span class="timeline-card__role">{role}</span>
    </Heading>
    <span class="timeline-card__year">{getCalendarYear(startDate)}</span>
    {current && <span class="badge badge-current">{t(locale, 'experience.current')}</span>}
  </summary>
```

- [ ] **Step 3: Add numerals to `EarlyExperience.astro`**

Change the `.map` call and item markup (originally lines 29–44):

```astro
      entries.map((entry) => {
        const { startDate, endDate, current } = entry.data;
        const endLabel = current || !endDate ? t(locale, 'experience.present') : formatCalendarDate(endDate, locale, { year: 'numeric' });
        const duration = formatCalendarDuration(getCalendarDuration(startDate, endDate ?? new Date()), durationWords);
        return (
          <li class="early-experience__item">
            <span class="early-experience__year">
              {formatCalendarDate(startDate, locale, { year: 'numeric' })}–{endLabel} · {duration}
            </span>
            <span class="early-experience__role">
              <strong>{entry.data.company}</strong> — {entry.data.role}
            </span>
            <span class="early-experience__note">{entry.data.highlights[0]}</span>
          </li>
        );
      })
```

to:

```astro
      entries.map((entry, index) => {
        const { startDate, endDate, current } = entry.data;
        const endLabel = current || !endDate ? t(locale, 'experience.present') : formatCalendarDate(endDate, locale, { year: 'numeric' });
        const duration = formatCalendarDuration(getCalendarDuration(startDate, endDate ?? new Date()), durationWords);
        return (
          <li class="early-experience__item">
            <span class="listing-numeral listing-numeral--xs" aria-hidden="true">
              <span class="listing-numeral__index">{String(index + 1).padStart(2, '0')}</span>
            </span>
            <span class="early-experience__year">
              {formatCalendarDate(startDate, locale, { year: 'numeric' })}–{endLabel} · {duration}
            </span>
            <span class="early-experience__role">
              <strong>{entry.data.company}</strong> — {entry.data.role}
            </span>
            <span class="early-experience__note">{entry.data.highlights[0]}</span>
          </li>
        );
      })
```

(`.listing-numeral--xs` has no ghost span — at this compact size a second overlapping numeral would be illegible, so only `.listing-numeral__index` is rendered.)

- [ ] **Step 4: Replace the Timeline/EarlyExperience CSS**

Replace (originally lines 771–915 of `src/styles/global.css`, the full `/* Timeline */` through `/* Early experience accordion */` sections):

```css
/* Timeline */
.timeline {
  list-style: none;
  display: grid;
  gap: var(--space-sm);
  border-left: 2px solid var(--color-border);
  padding-left: var(--space-md);
}

.timeline-card {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background-color: var(--color-surface);
  padding: var(--space-3xs) var(--space-sm);
}

.timeline-card__summary {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-sm);
  padding-block: var(--space-sm);
  cursor: pointer;
  list-style: none;
}

.timeline-card__summary::-webkit-details-marker {
  display: none;
}

/* Overflow fix: badge and year stay a fixed size and never get squeezed by
   a long company/role string; the heading text is the one allowed to wrap
   or shrink (min-width: 0 overrides flex's default min-width: auto, which
   otherwise refuses to shrink below the text's intrinsic content width). */
.timeline-card__summary .badge {
  flex-shrink: 0;
  order: 3;
}

/* `.timeline-card__heading` is now a real heading element (h2/h3, see
   TimelineCard.astro's `headingLevel` prop) so it can be <summary>'s first
   DOM child per the HTML spec (a heading is only valid as a <summary>'s
   first child). `order` restores the original visual order — year, then
   company/role, then badge — without touching the DOM order. */
.timeline-card__year {
  font-family: var(--font-display);
  color: var(--color-primary);
  font-weight: 600;
  min-width: 3.5rem;
  flex-shrink: 0;
  order: 1;
}

.timeline-card__heading {
  display: flex;
  flex-direction: column;
  gap: var(--space-3xs);
  min-width: 0;
  /* Zero out the base h1/h2/h3 rule's margin-bottom so this heading doesn't
     break the flex layout/gap of .timeline-card__summary. */
  margin: 0;
  order: 2;
}

.timeline-card__role {
  color: var(--color-ink-muted);
  font-size: var(--text-sm);
  /* .timeline-card__heading is now a real heading element (base h1/h2/h3
     rule sets font-weight: 600) — without this override this plain span
     would unintentionally inherit bold. */
  font-weight: 400;
}

.early-experience__role {
  color: var(--color-ink-muted);
  font-size: var(--text-sm);
}

.timeline-card__body {
  padding-bottom: var(--space-sm);
  display: grid;
  gap: var(--space-xs);
}

.timeline-card__meta {
  color: var(--color-ink-muted);
  font-size: var(--text-sm);
}

.timeline-card__highlights {
  display: grid;
  gap: var(--space-2xs);
  padding-left: var(--space-sm);
}

.timeline-card__stack {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2xs);
}

.timeline-card__stack-label {
  color: var(--color-ink-muted);
  font-size: var(--text-sm);
  margin-right: var(--space-3xs);
}

/* Early experience accordion */
.early-experience {
  margin-top: var(--space-lg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-3xs) var(--space-sm);
}

.early-experience__summary {
  padding-block: var(--space-sm);
  cursor: pointer;
  font-weight: 600;
}

.early-experience__list {
  list-style: none;
  display: grid;
  gap: var(--space-xs);
  padding-bottom: var(--space-sm);
}

.early-experience__item {
  display: grid;
  grid-template-columns: 4rem 1fr;
  gap: var(--space-3xs) var(--space-sm);
  font-size: var(--text-sm);
}

.early-experience__year {
  color: var(--color-primary);
  font-weight: 600;
}

.early-experience__note {
  grid-column: 2;
  color: var(--color-ink-muted);
}
```

with:

```css
/* Timeline (2026-08-10 visual redesign): the left spine + bordered-box-per-
   role treatment is replaced by the same numeral/divider language as the
   project/blog listings (.listing-numeral, defined in the "Project / blog
   listings" section above) at a smaller size (.listing-numeral--sm). */
.timeline {
  list-style: none;
  display: grid;
  gap: 0;
}

.timeline-card {
  position: relative;
  padding: var(--space-3xs) 0;
}

.timeline-card::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 1px;
  background-color: var(--color-border);
  transform: skewY(-1deg);
}

.timeline > li:last-child .timeline-card::after {
  display: none;
}

.timeline-card__summary {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-sm);
  padding-block: var(--space-sm);
  cursor: pointer;
  list-style: none;
}

.timeline-card__summary::-webkit-details-marker {
  display: none;
}

.listing-numeral--sm {
  order: 0;
  flex-shrink: 0;
}

.listing-numeral--sm .listing-numeral__index,
.listing-numeral--sm .listing-numeral__ghost {
  font-size: clamp(1.5rem, 3vw, 2.25rem);
}

/* Overflow fix: badge and year stay a fixed size and never get squeezed by
   a long company/role string; the heading text is the one allowed to wrap
   or shrink (min-width: 0 overrides flex's default min-width: auto, which
   otherwise refuses to shrink below the text's intrinsic content width). */
.timeline-card__summary .badge {
  flex-shrink: 0;
  order: 3;
}

/* `.timeline-card__heading` is now a real heading element (h2/h3, see
   TimelineCard.astro's `headingLevel` prop) so it can be <summary>'s first
   DOM child per the HTML spec (a heading is only valid as a <summary>'s
   first child). `order` restores the original visual order — numeral,
   year, then company/role, then badge — without touching the DOM order. */
.timeline-card__year {
  font-family: var(--font-display);
  /* --color-accent-ink, not raw --color-primary/--accent: real text on
     --color-surface needs the AA-safe shade (see global.css's palette
     comment). */
  color: var(--color-accent-ink);
  font-weight: 600;
  min-width: 3.5rem;
  flex-shrink: 0;
  order: 1;
}

.timeline-card__heading {
  display: flex;
  flex-direction: column;
  gap: var(--space-3xs);
  min-width: 0;
  /* Zero out the base h1/h2/h3 rule's margin-bottom so this heading doesn't
     break the flex layout/gap of .timeline-card__summary. */
  margin: 0;
  order: 2;
}

.timeline-card__role {
  color: var(--color-ink-muted);
  font-size: var(--text-sm);
  /* .timeline-card__heading is now a real heading element (base h1/h2/h3
     rule sets font-weight: 600) — without this override this plain span
     would unintentionally inherit bold. */
  font-weight: 400;
}

.early-experience__role {
  color: var(--color-ink-muted);
  font-size: var(--text-sm);
}

.timeline-card__body {
  padding-bottom: var(--space-sm);
  display: grid;
  gap: var(--space-xs);
}

.timeline-card__meta {
  color: var(--color-ink-muted);
  font-size: var(--text-sm);
}

.timeline-card__highlights {
  display: grid;
  gap: var(--space-2xs);
  padding-left: var(--space-sm);
}

.timeline-card__stack {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2xs);
}

.timeline-card__stack-label {
  color: var(--color-ink-muted);
  font-size: var(--text-sm);
  margin-right: var(--space-3xs);
}

/* Early experience accordion — compact one-line-per-role list, so it gets
   the divider language but a proportionally smaller numeral
   (.listing-numeral--xs, no ghost span — illegible at this size) instead
   of the full oversized listing numeral. The outer bordered box is
   dropped (one of the "scattered borders" the redesign explicitly
   replaces) for a single top divider instead. */
.early-experience {
  margin-top: var(--space-lg);
  border-top: 1px solid var(--color-border);
  padding-top: var(--space-xs);
}

.early-experience__summary {
  padding-block: var(--space-sm);
  cursor: pointer;
  font-weight: 600;
}

.early-experience__list {
  list-style: none;
  display: grid;
  gap: var(--space-xs);
  padding-bottom: var(--space-sm);
}

.early-experience__item {
  position: relative;
  display: grid;
  grid-template-columns: 1.75rem 4rem 1fr;
  gap: var(--space-3xs) var(--space-sm);
  padding-bottom: var(--space-xs);
  font-size: var(--text-sm);
}

.early-experience__item::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 1px;
  background-color: var(--color-border);
  transform: skewY(-1deg);
}

.early-experience__item:last-child::after {
  display: none;
}

.listing-numeral--xs {
  font-family: var(--font-display);
  font-weight: 800;
  letter-spacing: -0.02em;
}

.listing-numeral--xs .listing-numeral__index {
  font-size: 1rem;
  color: var(--color-accent-ink);
}

.early-experience__year {
  color: var(--color-accent-ink);
  font-weight: 600;
}

.early-experience__note {
  grid-column: 3;
  color: var(--color-ink-muted);
}
```

- [ ] **Step 5: Type-check, test, and build**

Run: `npx astro check`
Expected: no type errors.

Run: `npm run test`
Expected: unaffected existing tests pass (`experience-duration.test.ts`, `format-date.test.ts` etc. test pure functions, not this markup).

Run: `npm run build`
Expected: build succeeds.

Run: `npm run dev`, open `/experience`.
Expected: each role row shows a small numeral before the year, a skewed divider between rows (no bordered boxes), and the early-experience accordion shows a tiny numeral per line with its own divider, no outer border box.

- [ ] **Step 6: Commit**

```bash
git add src/components/Timeline.astro src/components/TimelineCard.astro src/components/EarlyExperience.astro src/styles/global.css
git commit -m "feat(experience): re-skin timeline and early-experience to the numeral/divider language"
```

---

### Task 6: TwoWorlds bridge + photo duotone re-skin

**Files:**
- Modify: `src/styles/global.css:616-769` (`.about-photo-frame`, `.world-*`, `.world-connector` sections)

**Interfaces:**
- Consumes: `--color-accent`, `--color-accent-ink` (Task 1); the literal clip-path value `polygon(0 0, 100% 0, 100% 78%, 0 100%)` (Task 3).
- Produces: nothing later tasks reference (leaf task). `TwoWorlds.astro` itself needs no markup changes — verified in Step 1.

- [ ] **Step 1: Verify `.world-ai`/`.world-civil`/`.world li::before` need no direct edits**

Read `src/styles/global.css` lines 715–725 (`.world-ai`, `.world-civil`, `.world-civil li::before`) and confirm they reference `var(--color-primary)`/`var(--color-secondary)` — both already repointed by Task 1 (`--primary` → `--accent`, `--secondary` → `--ink-muted`), so `.world-ai`'s top border renders in accent and `.world-civil`'s renders in neutral ink-muted automatically, with zero edits here. This matches the design spec's "the accent color instead of teal/amber" (one accent + one neutral, not two brand colors).

Run: `rg "color-primary|color-secondary" src/styles/global.css` (or `grep`) and confirm lines 716, 720, 724 are the only remaining `.world-*` hits, all unmodified by this task.

- [ ] **Step 2: Re-skin the photo duotone overlay**

Replace (originally lines 635–647 of `src/styles/global.css`):

```css
.about-photo-frame::after {
  content: '';
  position: absolute;
  inset: 0;
  mix-blend-mode: color;
  background-color: var(--secondary);
  opacity: 0.35;
}

[data-theme='dark'] .about-photo-frame::after {
  background-color: var(--primary);
  opacity: 0.45;
}
```

with:

```css
/* Retinted to the single new accent (2026-08-10 visual redesign) — same
   hex in both themes (see global.css's palette tokens), only the overlay
   opacity still differs per theme (unblended cyan reads slightly more
   intense against a near-black dark surface than against a near-white
   light one). */
.about-photo-frame::after {
  content: '';
  position: absolute;
  inset: 0;
  mix-blend-mode: color;
  background-color: var(--accent);
  opacity: 0.35;
}

[data-theme='dark'] .about-photo-frame::after {
  opacity: 0.45;
}
```

- [ ] **Step 3: Re-skin the TwoWorlds connector**

Replace (originally lines 737–769 of `src/styles/global.css`):

```css
  .world-connector {
    display: block;
    position: relative;
  }

  .world-connector::before {
    content: '';
    position: absolute;
    inset-block: 0;
    left: 50%;
    width: 2px;
    transform: translateX(-50%);
    background: linear-gradient(to bottom, var(--color-primary), var(--color-secondary));
  }

  .world-connector::after {
    content: '⇄';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.25rem;
    height: 2.25rem;
    border-radius: 50%;
    background-color: var(--color-surface);
    border: 1px solid var(--color-border);
    color: var(--color-primary);
    font-size: var(--text-sm);
  }
```

with:

```css
  .world-connector {
    display: block;
    position: relative;
  }

  /* Re-skinned (2026-08-10 visual redesign): the two-color gradient line
     becomes a solid --accent bar (one accent now, not a teal/amber duo). */
  .world-connector::before {
    content: '';
    position: absolute;
    inset-block: 0;
    left: 50%;
    width: 2px;
    transform: translateX(-50%);
    background: var(--color-accent);
  }

  /* Circular glyph badge becomes a diagonal-cut badge (same clip-path
     value as Hero's default/mobile diagonal block) — replaces
     border-radius: 50% with the site's structural motif instead of a
     third shape language. */
  .world-connector::after {
    content: '⇄';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.25rem;
    height: 2.25rem;
    clip-path: polygon(0 0, 100% 0, 100% 78%, 0 100%);
    background-color: var(--color-surface);
    border: 1px solid var(--color-border);
    color: var(--color-accent-ink);
    font-size: var(--text-sm);
  }
```

- [ ] **Step 4: Build and spot-check**

Run: `npm run build`
Expected: build succeeds.

Run: `npm run dev`, open the home page, scroll to "Dos mundos que convergen" and "Sobre mí".
Expected: the photo overlay is cyan-tinted (not amber/teal) in both themes; at ≥1024px width, the connector bar between the two skill columns is a solid cyan line with a diagonally-clipped "⇄" badge (not a circle) whose glyph is legible dark-cyan on the surface background.

- [ ] **Step 5: Commit**

```bash
git add src/styles/global.css
git commit -m "feat(two-worlds): recolor connector and photo duotone to the new accent"
```

---

### Task 7: ContactModal CTA re-skin

**Files:**
- Modify: `src/styles/global.css:1210-1214` (`.contact-form__success svg`)

**Interfaces:**
- Consumes: `--color-accent-ink` (Task 1); `.btn`, `.btn-lg`, `.btn-outline`, `.contact-form__submit` (existing, already accent-filled via Task 1's repoint).
- Produces: nothing later tasks reference (leaf task).

- [ ] **Step 1: Verify the submit/CTA buttons need no direct edits**

Read `src/components/ContactModal.astro` lines 104–111 (`.contact-form__submit`, classes `btn btn-lg contact-form__submit`) and lines 144 (WhatsApp CTA, classes `btn btn-lg btn-outline`). Confirm:
- `.contact-form__submit` inherits `.btn`'s `background-color: var(--color-primary); color: var(--color-on-accent);` from Task 1 — it will render as a solid accent-filled button identical in treatment to Hero's primary CTA, with no separate override needed.
- The WhatsApp secondary CTA keeps `.btn-outline` (transparent, bordered, ink text) unchanged — correctly staying a secondary/neutral action next to the one solid-accent primary action, per the design spec's "accent... reserved for shout elements, never a large ambient... " guidance.

Run: `rg "contact-form__submit|btn-outline" src/styles/global.css` and confirm no rule other than `.contact-form__submit { width: 100%; }` / `:disabled` exists — no color-specific override to touch.

- [ ] **Step 2: Fix the success-state checkmark icon color**

Replace (originally lines 1211–1213 of `src/styles/global.css`):

```css
.contact-form__success svg {
  color: var(--color-primary);
}
```

with:

```css
.contact-form__success svg {
  /* --color-accent-ink, not raw --color-primary/--accent: this checkmark
     icon sits directly on --color-surface and needs the same AA-safe
     accent shade as any other literal accent-colored foreground (see
     global.css's palette comment). */
  color: var(--color-accent-ink);
}
```

- [ ] **Step 3: Build and spot-check**

Run: `npm run build`
Expected: build succeeds.

Run: `npm run dev`, open the contact modal (Hero's "Contactar" button), submit a valid test message (or inspect the hidden success block via dev tools by removing the `hidden` attribute).
Expected: the submit button is solid cyan with dark text (matches Hero's "Ver experiencia" button exactly); the success checkmark renders in the darker AA-safe cyan, clearly visible on the surface background in both themes.

- [ ] **Step 4: Commit**

```bash
git add src/styles/global.css
git commit -m "fix(contact): AA-safe accent color for the success checkmark icon"
```

---

### Task 8: Diagram accent-recolor verification

**Files:**
- None modified — read-only verification task. Reads: `src/styles/global.css:94-102` (`--diagram-*` tokens), one representative file from `src/assets/blog/*.svg`.

**Interfaces:**
- Consumes: `--color-primary`, `--color-secondary` (Task 1's repointed values, flowing through the existing `--diagram-accent`/`--diagram-accent-2` indirection untouched since the original `feat` commit).
- Produces: nothing (leaf, verification-only task).

- [ ] **Step 1: Confirm the indirection chain is untouched and still resolves**

Read `src/styles/global.css` lines 94–102:

```css
  --diagram-ink: var(--color-ink);
  --diagram-line: var(--color-border);
  --diagram-fill: var(--color-surface-subtle);
  --diagram-accent: var(--color-primary);
  --diagram-accent-2: var(--color-secondary);
```

Confirm these lines are unmodified by every prior task (Task 1 only changed what `--color-primary`/`--color-secondary` resolve *to*, not this indirection itself) — `--diagram-accent` now resolves to the new cyan accent, `--diagram-accent-2` now resolves to neutral ink-muted, automatically, with zero changes to any `.svg` file.

- [ ] **Step 2: Confirm one representative SVG uses the indirection, not a hardcoded color**

Read `src/assets/blog/sismos-como-se-generan.svg` and confirm every `fill`/`stroke` attribute references `var(--diagram-ink)`, `var(--diagram-line)`, `var(--diagram-fill)`, `var(--diagram-accent)`, or `var(--diagram-accent-2)` — no hardcoded hex anywhere in the file (already true, pre-existing pattern from the blog-section-improvement change).

Run: `rg -l "fill=\"#|stroke=\"#" src/assets/blog/` (or `grep`)
Expected: no matches — every blog SVG uses the CSS-variable indirection exclusively, confirming the accent swap flows through automatically for all 20 files, not just the one spot-checked.

- [ ] **Step 3: Visual spot-check**

Run: `npm run dev`, open `/blog/sismos-como-se-generan` (or its English slug) in both themes.
Expected: the subduction-zone line and hypocenter dot render in the new cyan accent; the fault-system line/label render in neutral ink-muted gray (previously amber) — diagram is still fully legible, just monochromatic-accent instead of two-tone. No SVG markup needed changing.

- [ ] **Step 4: Commit**

No files changed — nothing to commit for this task. If the verification surfaces an unexpected hardcoded color, stop and fix it as a new, separate task before continuing (do not fold an unplanned fix silently into Task 9).

---

### Task 9: Cross-cutting responsive/contrast verification pass

**Files:**
- None modified — final verification task, reads/exercises the cumulative output of Tasks 1–8.

**Interfaces:**
- Consumes: `scripts/check-contrast.mjs` (Task 1); every component touched in Tasks 2–7.
- Produces: nothing (final task in the plan).

- [ ] **Step 1: Run the contrast-check script one more time against the final state**

Run: `node scripts/check-contrast.mjs`
Expected: every pair still `PASS`, exit code 0. (Every task after Task 1 only ever *consumed* `--color-accent-ink`/`--color-on-accent` for new text, per the "Design decisions" rule at the top of this plan — no task introduced a new raw-accent-as-text case — so no new pairs are needed; this just re-confirms nothing regressed.)

- [ ] **Step 2: Responsive spot-check at 360px**

Run: `npm run dev`, open the site in a browser, resize the viewport (or use dev tools' device toolbar) to 360px width. Visit `/` (home), `/projects`, `/blog`, `/experience`.
Expected: no horizontal scrollbar anywhere; the hero's diagonal block uses the shallow ~78% cut and doesn't collide with the headline text; listing numerals shrink via `clamp()` and stay legible; the marquee ribbon is present but visually secondary to the CTA row; alternating listing indentation is OFF (the `min-width: 48rem` media query hasn't kicked in), so rows sit flush.

- [ ] **Step 3: Responsive spot-check at 768px**

Resize to 768px width. Revisit the same four pages.
Expected: still the shallow hero cut (the `min-width: 64rem` breakpoint hasn't kicked in yet); listing rows now alternate indentation left/right; timeline rows and early-experience items show their numerals and dividers cleanly with no overlap.

- [ ] **Step 4: Responsive spot-check at 1280px**

Resize to 1280px width (or wider).
Expected: hero shows the steep ~52% diagonal cut; the TwoWorlds connector bar + diagonally-clipped "⇄" badge appear between the two skill columns; everything else holds the 768px layout.

- [ ] **Step 5: Theme spot-check**

At any one viewport width, toggle the theme (manual override button) and reload once with `localStorage.theme` cleared (to re-exercise Task 2's local-time default).
Expected: both themes render every re-skinned component (hero, listings, timeline, TwoWorlds, contact modal) with correct contrast — no invisible text, no accent-on-accent collisions — matching the states already validated in Tasks 1–8's own spot-checks.

- [ ] **Step 6: Motion check**

In the browser's dev tools, enable "prefers-reduced-motion: reduce" (Rendering tab in Chrome DevTools, or OS-level setting), reload the home page.
Expected: the hero marquee visually freezes (sitewide `animation-duration: 0.01ms !important` guard), scroll-reveal sections appear immediately visible with no fade/slide-in — matching the existing pre-redesign behavior, confirming no new motion path was left unguarded.

- [ ] **Step 7: Final full build**

Run: `npm run build`
Expected: build succeeds cleanly, no warnings introduced by this plan's changes.

Run: `npm run test`
Expected: full existing suite passes unchanged.

- [ ] **Step 8: Commit**

If Steps 1–7 surfaced no fixes (expected — this is a verification pass, not an implementation task), there's nothing new to commit; note in your task log that the redesign is verified complete as of Task 8's commit. If any step above did surface a real defect, fix it now as part of this task and commit:

```bash
git add -A
git commit -m "fix(redesign): address cross-cutting responsive/contrast issue found in final verification"
```
