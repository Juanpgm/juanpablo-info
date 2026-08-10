# Tasks: Blog Section Improvement

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~900-1100 (12 SVG redraws ~250, 12 new EN SVGs ~480, 24 md +60-70, layout/CSS/OG wiring ~150) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR1 batch-A+wiring → PR2 batch-B → PR3 OG → PR4 polish |
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-main |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

Adjustment vs proposal: design suggested 3 slices (diagrams+i18n, OG, polish) but flagged slice 1 alone as likely >400 lines on its own. Split into 4 stacked PRs: diagrams-batch-A (6 slugs) + wiring, diagrams-batch-B (6 slugs), OG images, polish — each independently mergeable to main.

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Schema + inline-SVG wiring + diagrams batch A (6 slugs) | PR 1 | `npx vitest run src/lib/hero-diagram.test.ts` | `npm run dev`, view 1 ES+EN post light/dark | content.config.ts, PostLayout/BlogCard hero markup, 6 svg+6 en.svg, 12 md |
| 2 | Diagrams batch B (6 slugs) | PR 2 | `npx vitest run src/lib/hero-diagram.test.ts` | `npm run dev`, view 1 batch-B post light/dark | 6 svg+6 en.svg, 12 md — no shared-code risk |
| 3 | OG image endpoint + prop passthrough | PR 3 | `npm run build` (asserts 60 PNGs emit) | Fetch `/og/es/{slug}.png`, verify `og:image` in page source | BaseLayout/SeoHead ogImage prop, og/[...slug].png.ts, package.json dep |
| 4 | CSS polish pass | PR 4 | N/A — visual only | `npm run dev`, compare card/hero framing light+dark | global.css selectors only |

## Phase 1: Foundation (Schema + Wiring)

- [x] 1.1 `src/content.config.ts`: add `heroImageAlt: z.string().max(200).optional()`, `heroImageCaption: z.string().max(280).optional()` to blog schema.
- [x] 1.2 Create `src/lib/hero-diagram.ts` exporting `resolveHeroDiagramKey(entryId, slug)` → `` `/src/assets/blog/${slug}${prefix==='es'?'':'.en'}.svg` ``.
- [x] 1.3 RED test `src/lib/hero-diagram.test.ts`: assert `es/x`→`x.svg`, `en/x`→`x.en.svg`, `de/x`→`x.en.svg` (fallback prefix).
- [x] 1.4 GREEN: implement until 1.3 passes.
- [x] 1.5 Add `--diagram-ink/-line/-fill/-accent/-accent-2` vars to `:root` in `src/styles/global.css` (indirected to `--color-*`).
- [x] 1.6 `src/layouts/PostLayout.astro`: replace `<Image>` hero with `import.meta.glob('/src/assets/blog/*.svg',{query:'?raw',import:'default',eager:true})` + `resolveHeroDiagramKey`, render `<figure class="post-hero"><div class="post-hero-image" role="img" aria-label={heroImageAlt} set:html={svg}/>{heroImageCaption && <figcaption>}</figure>`.
- [x] 1.7 `src/components/BlogCard.astro`: same inline-SVG + `role/aria-label` pattern, drop `<Image>`.

## Phase 2: Diagrams Batch A (6 slugs)

Slugs: sismos-como-se-generan, obras-de-drenaje, sistemas-alerta-temprana-sismos, analitica-datos-geodesia, movimientos-remocion-en-masa-tipos, telematica-modelos-predictivos-ml-dl.

- [x] 2.1 Redraw each ES `.svg`: drop bg rect (transparent), swap `#1a2027→var(--diagram-ink)`, `#dde1e6/#eef1f4→var(--diagram-line)/-fill`, `#0f766e→var(--diagram-accent)`, `#b45309→var(--diagram-accent-2)`; set var explicitly on `<marker><path fill>`.
- [x] 2.2 Author matching `.en.svg` per slug (translated labels, same vars/structure).
- [x] 2.3 ES `*.md`: add `heroImageAlt`/`heroImageCaption`.
- [x] 2.4 EN `*.md`: add `heroImageAlt`/`heroImageCaption` (English), repoint `heroImage` to `.en.svg`.

## Phase 3: Diagrams Batch B (6 slugs)

Slugs: obras-control-erosion, ingenieria-estructural-fundamentos, nsr-10-revision-novedades, como-actuar-en-caso-de-sismo, edan-evaluacion-danos-analisis-necesidades, sistema-nacional-gestion-riesgo-desastres.

- [x] 3.1 Redraw ES SVGs (same rule as 2.1).
- [x] 3.2 Author `.en.svg` variants (same rule as 2.2).
- [x] 3.3 ES `*.md`: add alt/caption.
- [x] 3.4 EN `*.md`: add alt/caption, repoint `heroImage`→`.en.svg`.

## Phase 4: OG Images

- [x] 4.1 `npm install astro-og-canvas`, add to `package.json`.
- [x] 4.2 `src/layouts/BaseLayout.astro`: add `ogImage` prop, forward to `SeoHead`.
- [x] 4.3 `ogImage=/og/{locale}/{slug}.png` computed in `src/pages/[locale]/blog/[...slug].astro` (has `locale`+`currentSlug` already) and passed through `PostLayout` → `BaseLayout`. Deviation from this task's literal "PostLayout computes it": `PostLayout` only has `entryId`, whose locale prefix is the *content* entry's locale, not the *route* locale — wrong for de/fr/ru fallback routes. See PostLayout.astro prop comment.
- [x] 4.4 `src/components/head/SeoHead.astro`: removed stale `ponytail:` defer comment; JSON-LD `image` now unconditionally uses `absoluteOgImage` (was gated on `heroImageUrl`).
- [x] 4.5 Created `src/pages/og/[...slug].ts` using `OGImageRoute`, `pages` keyed `"{locale}/{slug}"` over all locales from `getLocalizedEntries`. Deviation: filename is `[...slug].ts`, not the literal `[...slug].png.ts` suggested here — verified against `astro-og-canvas`'s `routing.js`: its default `getSlug` already appends `.png` to each `pages` key, so a `.png.ts` filename would double the extension (`.png.png`). See file header comment for full evidence.
- [x] 4.6 `npm run build`: verified — see apply-progress Work Unit Evidence.

## Phase 5: Polish

- [x] 5.1 `.post-hero-image`/`.blog-card__image`: add `background:var(--color-surface-subtle)` + `border:1px solid var(--color-border)`.
- [x] 5.2 `.post-hero{margin-bottom:var(--space-xl)}`; `.post-hero figcaption{color:var(--color-ink-muted);font-size:var(--text-sm);margin-top:var(--space-2xs);text-align:center}`.
- [x] 5.3 `.post-tags{margin-top:var(--space-md)}` (was `--space-sm`).

## Phase 6: Verification

- [ ] 6.1 Manual: toggle dark/light on one post per batch, confirm diagram legible, no light rectangle.
- [ ] 6.2 Manual: view DE/FR/RU post, confirm English diagram + English alt text via fallback.
- [ ] 6.3 Manual: confirm two different posts have different `og:image` URLs, neither is `/og/default.png`.
- [ ] 6.4 `npx vitest run` full suite green.
