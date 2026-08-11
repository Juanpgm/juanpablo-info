# Design: Visual Redesign — Personal Website

## Context

Current site (Astro v7, Tailwind v4 CSS-first, `src/styles/global.css`) has a deliberate but timid look: teal (`#0f766e`) + amber (`#b45309`) "engineering blueprint" duo, Fraunces (serif) + Manrope (sans) pairing, and a card-heavy layout (bordered box, `border-radius: var(--radius-lg)`, lift-on-hover shadow) repeated across projects, blog, timeline, and the contact modal. The two genuinely distinctive elements already in place — the TwoWorlds "⇄" bridge connector and the grayscale+`mix-blend-mode` duotone photo — are worth keeping and re-skinning, not discarding.

Goal: an aggressive, modern, minimalist redesign with a cool high-contrast palette, fully responsive across devices, that reads as a confident professional profile rather than a generic tech-portfolio template.

## Visual identity

**Typography.** Display typography (hero headline, section titles, project/blog index numerals) switches from Fraunces (serif) to a geometric sans stack (`system-ui, -apple-system, "Inter", sans-serif`), set with negative letter-spacing (`-0.02em` to `-0.04em` depending on size) and heavy weight (700–800) at large sizes contrasted against a light-weight, wide-tracked eyebrow label (9–10px, `letter-spacing: 0.15–0.22em`). This weight/tracking extreme is what reads as "minimalist" despite the large scale. Body copy (paragraphs, blog prose, nav, form labels) keeps Manrope — no change there, long-form readability isn't part of this pass. Fraunces is dropped from all primary headings; if no page references `--font-display` after the pass, drop the `@fontsource-variable/fraunces` import too rather than keeping an unused font weight loaded.

**Color.** Cool-only palette, replacing the teal/amber duo:

| Token | Light (default) | Dark (auto at night / manual) |
|---|---|---|
| `--surface` | `#fafafa` | `#0a0a0a` |
| `--ink` | `#0a0a0a` | `#fafafa` |
| `--accent` | `#22d3ee` (cian eléctrico) | `#22d3ee` |

The accent is reserved for elements that need to "shout": the diagonal block fill, CTA button fill, active/current project numeral, divider rules, hover states. It is never a large ambient background — base ink/surface carries ~90% of any view. Existing `--ink-muted`, `--border`, `--error` tokens carry over unchanged (they're theme-neutral utility tokens, not part of the identity palette being replaced). The photo duotone overlay (`.about-photo-frame`, `mix-blend-mode: color`) retints from the old teal/amber to `--accent`.

**Structural motif — the diagonal cut.** A steep `clip-path: polygon(0 0, 100% 0, 100% 52%, 0 100%)` accent block is the site's recurring signature shape, used in the hero and major section dividers. It replaces the old bordered-box-per-section rhythm with one confident graphic gesture repeated at a few key seams rather than scattered borders everywhere.

**Layout — hero.** No more centered text + two buttons. Full-bleed base (ink or surface depending on theme) with the diagonal accent block bleeding from a top corner; oversized geometric-sans headline with the eyebrow-label/headline scale contrast described above; CTA becomes a solid accent-filled button (not an outline); an optional auto-scrolling marquee ribbon (skills/keywords) sits below the fold line as a secondary kinetic element, CSS-only (`@keyframes translateX` loop, no JS animation library).

**Layout — project/blog listings.** Bordered-card grid is replaced by a staggered, asymmetric list: each entry anchored by an oversized index numeral (accent-colored for the active/current entry, low-opacity ink-colored "ghost" numeral for the entry behind it, overlapping for depth); thin divider rules between entries with a slight `skewY` instead of card borders; alternating small left/right indentation per row for rhythm instead of a uniform grid. This pattern replaces the current `ProjectCard`/`BlogCard`/Timeline card treatment.

**TwoWorlds bridge & photo duotone.** Both stay conceptually as-is — they're the two elements the design audit flagged as already distinctive — but get re-skinned with the new geometric sans, the accent color instead of teal/amber, and (where it fits, e.g. the connector line) the diagonal-cut language instead of the current gradient-line + circular glyph.

## Theme behavior

Today (`src/layouts/BaseLayout.astro`, no-flash inline script): reads `localStorage.theme`; falls back to `window.matchMedia('(prefers-color-scheme: dark)')`.

New behavior: the `matchMedia` fallback is replaced by a local-time check. `localStorage.theme` (set by the existing `ThemeToggle` button) still wins whenever present — manual choice always overrides and persists exactly as it does today. Only the *unset* default changes:

```
hour = new Date().getHours()
theme = (hour >= 7 && hour < 19) ? 'light' : 'dark'
```

7:00–19:00 local device time → light; otherwise → dark. This runs once per page load / `astro:after-swap` (same hook points as today) — no running interval to flip the theme live while a tab stays open across the day/night boundary; that's an edge case not worth the added complexity for a portfolio site.

## Responsive / UX requirements

The bold structural elements need explicit small-viewport rules, not just "it'll wrap":

- **Diagonal block**: the clip-path percentage is per-breakpoint, not one fixed shape — mobile keeps a shallower cut (e.g. closer to the old ~78%) so headline text doesn't collide with the block edge on narrow columns; the steep ~52% cut is a desktop-width flourish.
- **Oversized/ghost numerals**: font-size via `clamp()` (same technique already used for `--text-display-lg`), so they scale down and never force horizontal scroll on mobile.
- **Marquee ribbon**: reduced height/font-size on mobile, and never the dominant above-the-fold element on small screens — the primary CTA must stay visually first.
- **Contrast**: any text set directly in `--accent` (`#22d3ee`) on `--surface`/`--ink` needs an explicit AA contrast check in both themes before shipping — the codebase already has precedent for this (`badge-example`/`badge-current` manual contrast fixes in the current palette); same discipline applies to the new accent.
- **Motion**: marquee and the existing scroll-reveal system both respect `prefers-reduced-motion`, matching the current pattern (`src/lib/scroll-reveal.ts`).
- **Breakpoints to verify**: 360px, 768px, 1280px+ — matches the Tailwind default breakpoints already used in the codebase.

## Scope

**In scope**: Hero, TwoWorlds, ProjectCard/BlogCard listings, Timeline/EarlyExperience, ContactModal button styling, photo duotone, theme-default logic in `BaseLayout.astro`.

**Out of scope for this pass**: blog post inline prose/typography (Manrope body stays as-is), OG image generation (`src/pages/og/[...slug].ts`), i18n copy/translation content, the 20 hand-authored blog hero SVGs (recolor via existing `--diagram-*` indirection only if the accent swap doesn't already flow through automatically — verify, don't redesign the illustrations themselves).

## Open follow-ups for the implementation plan

- Confirm the 7:00–19:00 light/dark boundary in code review — it's one constant, trivial to adjust if it doesn't feel right in practice.
- Decide whether to fully remove the `@fontsource-variable/fraunces` dependency or leave it imported-but-unused for a possible future editorial use (blog pull-quotes, etc.) — default to removing it if nothing references `--font-display` after the pass.
