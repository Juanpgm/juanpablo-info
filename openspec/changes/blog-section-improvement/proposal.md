# Proposal: Blog Section Improvement

## Intent

Fix five verified defects and polish the blog so it reads "elegant and minimalist" in both themes and all locales. Today English/DE/FR/RU readers see Spanish-labeled hero diagrams, dark mode renders every diagram as a light rectangle, hero images have `alt=""` despite being informative, and all 12 posts share one generic OG image (`/og/default.png`). Architecture is mature — this is a targeted fix pass, not a redesign.

## Scope

### In Scope
- Locale-correct hero diagrams (ES + EN SVG variants; DE/FR/RU inherit EN).
- Theme-aware diagrams (correct in light and dark).
- Real per-post, per-locale hero `alt` text + translatable `<figure>/<figcaption>`.
- Per-post OG images.
- Visual polish: hero framing, card image treatment, spacing rhythm.

### Out of Scope
- New inline diagrams inside post bodies (user-confirmed out).
- Rewriting solid prose typography, TOC, cross-link graph, SEO plumbing.
- Language-agnostic icon-only diagrams; translating DE/FR/RU post bodies.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `content-model`: add optional `heroImageAlt`, `heroImageCaption` frontmatter fields.
- `blog`: theme-aware localized hero diagram + figure/caption rendering.
- `seo-accessibility-perf`: per-post OG images; informative hero alt text.

## Approach

- **Bilingual wiring (no new code):** per diagram keep `{slug}.svg` (ES) and add `{slug}.en.svg` (EN). EN post frontmatter points at `.en.svg`; ES keeps `.svg`. DE/FR/RU own no post files, so the existing `content-fallback` merge makes them inherit the EN entry's `heroImage` automatically.
- **Theme-aware diagrams:** redraw SVGs with a transparent background and a CSS-custom-property palette (`--diagram-ink/line/accent-*`), rendered **inline** (Astro SVG component import) so page theme variables cascade — collapses dark-mode + bilingual into one authoring pass (2 files/diagram, not 4). *ponytail fallback if the line budget is tight: `[data-theme='dark'] .post-hero-image { filter: invert(1) hue-rotate(180deg); }` on the external `<img>`.*
- **Alt/caption:** new optional frontmatter fields, read in `PostLayout`/`BlogCard`; drop the baked-in SVG caption in favor of real `<figcaption>`.
- **OG images:** add `astro-og-canvas`; a static endpoint (`/og/{locale}/{slug}.png`) renders a branded title/description card per post/locale. Blog post page passes that path into `SeoHead`'s existing `ogImage` prop (currently never overridden). Text cards chosen over rasterized diagrams: legible at feed scale and avoids re-introducing the language mismatch into social previews.
- **Polish:** figure wrapper with rounded corners + hairline theme border, theme-aware card image background (cards hit the same light-rectangle bug), normalized header/tag spacing.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/content.config.ts` | Modified | Optional `heroImageAlt`, `heroImageCaption` |
| `src/content/blog/{es,en}/*.md` | Modified | EN `heroImage` → `.en.svg`; alt/caption |
| `src/assets/blog/*.svg` (+`.en.svg`) | New/Modified | Redraw transparent + var palette; EN variants |
| `src/layouts/PostLayout.astro` | Modified | Inline SVG, figure/caption, real alt, ogImage passthrough |
| `src/components/BlogCard.astro` | Modified | Real alt, theme-aware image |
| `src/components/head/SeoHead.astro` | Modified | Per-post `ogImage` wired |
| `src/pages/og/[...].png.ts` | New | astro-og-canvas endpoint |
| `src/styles/global.css` | Modified | Diagram palette, figure/hero framing |
| `package.json` | Modified | Add `astro-og-canvas` |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Redrawing 24 SVGs + OG endpoint blows 400-line budget | High | Chain PRs: (1) i18n+alt+theme diagrams, (2) OG images, (3) polish |
| `astro-og-canvas` adds build dep / build time | Med | Isolate in slice 2; static endpoint, no runtime cost |
| Build/tests never run in exploration | Med | Apply phase MUST run `npm run build` + `npm test` |

## Rollback Plan

Additive and per-slice: new frontmatter fields are optional, EN SVG variants are new files, OG endpoint is isolated. Revert any slice independently; ES posts and `/og/default.png` fallback keep working.

## Dependencies

- `astro-og-canvas` (slice 2 only).

## Success Criteria

- [ ] EN/DE/FR/RU posts show English-labeled diagrams; ES shows Spanish.
- [ ] Diagrams render correctly in light and dark mode (no light rectangle).
- [ ] Every post emits a unique OG image; `SeoHead` `og:image` no longer `/og/default.png`.
- [ ] Hero images have informative, locale-correct `alt`.
- [ ] `npm run build` and `npm test` pass.
