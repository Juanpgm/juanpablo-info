# Design: Blog Section Improvement

## Technical Approach

Targeted fix pass on a mature Astro static site (`output: 'static'`; verified `astro ^7.2.0`, not 5 — native SVG + `import.meta.glob` `?raw` both available). Four independent slices: (1) theme-aware localized inline diagrams + alt/caption, (2) per-post OG images via `astro-og-canvas`, (3) polish. All additive; ES posts and `/og/default.png` keep working if any slice reverts.

## Architecture Decisions

### Decision: Inline SVG via `?raw` glob + `set:html` (not `<Image>`, not SVG-component import)

**Choice**: `import.meta.glob('/src/assets/blog/*.svg', { query: '?raw', import: 'default', eager: true })`, inject into `<div class="post-hero-image" role="img" aria-label={alt} set:html={svg}>`.
**Alternatives**: `<Image>` (external doc — cannot read page CSS vars, the root dark-mode bug); Astro SVG-component import (version-variable attribute stripping / prop→var behavior).
**Rationale**: Inline is the *only* way `var(--diagram-*)` resolves against the page cascade so diagrams flip with `data-theme`. `?raw` is unambiguous and integration-free; SVGs are first-party repo assets, so `set:html` crosses no untrusted boundary. `role="img"`+`aria-label` on the wrapper gives an accessible name without baking `<title>` into 24 files.

### Decision: Locale variant by entry-id prefix — zero change to `content-fallback.ts`

**Choice**: `es/…` entry → `{slug}.svg`; `en/…` entry → `{slug}.en.svg`. Key = ``/src/assets/blog/${slug}${prefix==='es'?'':'.en'}.svg``.
**Rationale**: The merge in `getLocalizedEntries` already delivers the `en/…` entry object to DE/FR/RU pages (fallback chain `de→[de,en,es]`). Selecting the diagram off `entry.id`'s prefix means DE/FR/RU inherit `.en.svg` automatically. `heroImage`/`heroImageAlt`/`heroImageCaption` frontmatter is per-file, so per-locale text falls out for free. No `content-fallback.ts` edit. (EN `heroImage` frontmatter is repointed to `.en.svg` for JSON-LD/consistency, but selection is prefix-driven, so a missed repoint still renders correctly.)

### Decision: Theme palette as indirected CSS vars

Add to `:root` in global.css — auto-flip because `--color-*` already flip per theme:
```css
:root{ --diagram-ink:var(--color-ink); --diagram-line:var(--color-border);
  --diagram-fill:var(--color-surface-subtle); --diagram-accent:var(--color-primary);
  --diagram-accent-2:var(--color-secondary); }
```
SVG redraw: drop `<rect fill="#f7f8fa">` (transparent); `#1a2027→var(--diagram-ink)`, `#dde1e6/#eef1f4→var(--diagram-line)/--diagram-fill`, `#0f766e→var(--diagram-accent)`, `#b45309→var(--diagram-accent-2)`. *Gotcha: `<marker>` `<path fill>` inside `<defs>` — set the var explicitly on it; currentColor in markers is unreliable.*

### Decision: OG via `astro-og-canvas` static endpoint

`src/pages/og/[...slug].png.ts` using `OGImageRoute` (param `slug`, `pages` keyed `"{locale}/{slug}"` from `getLocalizedEntries` over all 5 locales) → emits `/og/{locale}/{slug}.png`. Branded text card (title+description+logo), not rasterized diagram — legible at feed scale, avoids re-introducing the language mismatch socially.

## Data Flow

    getLocalizedEntries(locale) ──→ [...slug].astro (entry, slug, prefix)
        │                                │
        │                        ogImage=/og/{locale}/{slug}.png
        ├─ ?raw glob ─→ set:html inline SVG (theme vars)   │
        └─ frontmatter alt/caption ─→ <figure>       PostLayout→BaseLayout→SeoHead(ogImage,heroImageUrl=ogImage)

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/content.config.ts` | Modify | `heroImageAlt: z.string().max(200).optional()`, `heroImageCaption: z.string().max(280).optional()` |
| `src/content/blog/{es,en}/*.md` (24) | Modify | Add `heroImageAlt`/`heroImageCaption`; EN `heroImage`→`.en.svg` |
| `src/assets/blog/*.svg` (12) | Modify | Transparent bg + var palette |
| `src/assets/blog/*.en.svg` (12) | Create | EN-labeled variants |
| `src/layouts/PostLayout.astro` | Modify | Inline SVG `<figure>`/`<figcaption>`, real alt, `ogImage` prop passthrough |
| `src/components/BlogCard.astro` | Modify | Same inline SVG + `role/aria-label`, drop `<Image>` |
| `src/layouts/BaseLayout.astro` | Modify | Add+forward `ogImage` prop (currently absent) |
| `src/components/head/SeoHead.astro` | Modify | Remove `ponytail:` defer note; JSON-LD `image`→OG png |
| `src/pages/og/[...slug].png.ts` | Create | `astro-og-canvas` route |
| `src/styles/global.css` | Modify | `--diagram-*`; figure/caption + theme-aware card bg |
| `package.json` | Modify | Add `astro-og-canvas` |

## Interfaces / Worked Examples

Selection + render (PostLayout/BlogCard share):
```astro
const svgs = import.meta.glob('/src/assets/blog/*.svg',{query:'?raw',import:'default',eager:true});
const prefix = entry.id.slice(0, entry.id.indexOf('/'));
const svg = svgs[`/src/assets/blog/${slug}${prefix==='es'?'':'.en'}.svg`];
// <figure class="post-hero"><div class="post-hero-image" role="img" aria-label={data.heroImageAlt} set:html={svg}/>
//   {data.heroImageCaption && <figcaption>{data.heroImageCaption}</figcaption>}</figure>
```
Frontmatter (`en/sismos-como-se-generan.md`): `heroImage: ../../../assets/blog/sismos-como-se-generan.en.svg`, `heroImageAlt: "Schematic cross-section: Nazca–South American plate subduction and the Cauca-Romeral fault near Cali"`, `heroImageCaption: "Cali sits near the Cauca-Romeral trace in a high seismic-hazard zone (NSR-10)."`

## Polish (concrete, vs current global.css)

- `.post-hero-image`/`.blog-card__image`: add `background-color: var(--color-surface-subtle)` + `border:1px solid var(--color-border)` (fixes card light-rectangle; frames transparent SVG). Keep `border-radius:0.75rem`.
- New `.post-hero` figure `margin-bottom:var(--space-xl)` (moves the `--space-xl` off `.post-hero-image`); `.post-hero figcaption{ color:var(--color-ink-muted); font-size:var(--text-sm); margin-top:var(--space-2xs); text-align:center }`.
- `.post-tags` `margin-top:var(--space-sm)→var(--space-md)` for header rhythm.

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| Unit (vitest) | prefix→variant key derivation | Assert `es`→`.svg`, `en`→`.en.svg` |
| Build | 5×12 OG PNGs + all pages emit | `npm run build` (mandatory — never run in exploration) |
| Manual | dark/light diagram, DE/FR/RU=EN diagram, `og:image`≠default | preview |

## Threat Matrix

N/A — no routing auth, shell, subprocess, VCS/PR automation, or executable-file classification. `set:html` is first-party build-time assets only (no runtime/user input).

## Migration / Rollout

Large content-authoring task (defer sizing to sdd-tasks): 24 SVGs (redraw 12 ES + author 12 EN) + alt/caption on 24 md files. Pattern proven above with 1 worked example; do NOT redraw all 24 here. Chain per proposal risk table: slice 1 (i18n+alt+theme) likely > 400-line budget alone → recommend stacked PRs (diagrams-batch-A, diagrams-batch-B, wiring), slice 2 OG, slice 3 polish.

## Open Questions

- [ ] Confirm `astro-og-canvas` peer (`canvaskit-wasm`) build-time cost acceptable on Vercel static build.
