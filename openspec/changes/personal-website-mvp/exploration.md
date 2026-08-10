# Exploration: Astro-based multi-language portfolio + blog (research phase, greenfield)

## Current State

Greenfield — nothing to explore in-repo (directory was empty aside from `.atl/`). This is pure research to ground `sdd-propose`.

## Key Findings

### Astro Islands / Content Collections / View Transitions
- Zero JS by default; hydrate only via `client:*` directives.
- Content Collections (Astro 5, `src/content.config.ts`) use `glob()`/`file()` loaders + `zod` schemas — good fit for blog + structured experience/skills data.
- i18n content pattern: one collection per content type, sub-directory per locale (`src/content/blog/es/*.md`), queried with `id.startsWith('es/')`.
- `<ClientRouter />` gives native View Transitions; Chromium-only real animation, safe fallback elsewhere; `transition:persist` keeps island state across nav; works transparently with i18n routes.

### Core Web Vitals
- `astro:assets` `<Image />`/`<Picture />` for all images (auto WebP/AVIF, explicit dimensions to avoid CLS).
- Preload critical font + hero image, `font-display: swap`, prefer a single self-hosted variable font.
- Targets: LCP < 2.5s, INP < 200ms, CLS < 0.1.
- Vercel auto-CDN-caches static output; no custom `vercel.json` cache config needed for `output: 'static'`.

### i18n routing — decision flagged for sdd-propose
- Astro's *default* is `prefixDefaultLocale: false` (default locale unprefixed). The requirement (`/es/`, `/en/`, `/de/` all prefixed) needs `prefixDefaultLocale: true` set explicitly — must not be left at the framework default.
- `fallback` + `fallbackType: "rewrite"` recommended for untranslated content to avoid URL/SEO churn.
- hreflang tags are NOT automatic — must be hand-built in a shared head component.

### Design conventions
- Minimalism over motion-heavy/maximalist trends fits professional/technical positioning.
- Serif/display headings + clean sans body (Inter/Manrope/IBM Plex Sans); neutral palette + one technical accent color; dark/light via `prefers-color-scheme` + persisted toggle; restrained microinteractions.

### Vercel + GitHub API
- `@astrojs/vercel` adapter supports static output cleanly; optional Vercel Image Optimization API as alternative to `astro:assets`.
- GitHub unauthenticated REST limit: 60 req/hr per IP — fine for **build-time** fetch (once per deploy), risky for client-side/runtime fetch. Recommend build-time fetch baked into static HTML, optional PAT if rebuild frequency ever needs headroom.

## Approaches (islands framework)

1. **Vanilla JS/CSS microinteractions** — smallest JS, simplest. Less ergonomic for stateful widgets. Effort: Low. **Recommended default.**
2. **Preact islands** for specific stateful widgets (e.g. project filter) — React DX at ~3KB, added dependency if not actually needed. Effort: Low-Medium.
3. **React islands** — heaviest runtime, conflicts with stated zero-JS/CWV priorities. Not recommended.

## Explicit Decisions for sdd-propose

- i18n: `prefixDefaultLocale: true` (all three locales prefixed) — do not leave at default.
- `fallbackType: "rewrite"` recommended for untranslated content.
- Markdown vs MDX for blog: plain Markdown unless a concrete need for embedded interactive components is named.
- Islands framework: decide per-island in design phase, default vanilla/no-framework.
- hreflang: needs explicit design task, not automatic.
- GitHub project data: build-time fetch only, never client-side.

## Risks

- Silently shipping Astro's un-prefixed-default i18n would violate the `/es/ /en/ /de/` requirement.
- View Transitions degrade gracefully outside Chromium but won't animate — confirm that's acceptable.
- MDX-vs-Markdown and islands-framework choice deliberately left open for propose phase with full requirements.

## Ready for Proposal

Yes.
