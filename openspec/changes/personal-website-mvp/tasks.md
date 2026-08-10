# Tasks: personal-website-mvp

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 3000-5000+ (greenfield scaffold, ~9 phases, ~30 new files) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (scaffold) → PR 2 (layouts) → PR 3 (content/i18n/pages) → PR 4 (SEO/a11y) → PR 5 (GitHub) → PR 6 (CV/assets) → PR 7 (tests) → PR 8 (docs) → PR 9 (polish) |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending — ask user: stacked-to-main vs feature-branch-chain |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Scaffold: Astro+Tailwind v4+TS, config, git init | PR 1 | `npm run build` | `npm run dev` manual load | Revert scaffold commit, no dependents yet |
| 2 | Layouts + global chrome components | PR 2 | `astro check` | `npm run dev` — Header/Footer render | Delete `layouts/`, `components/Header|Footer|LanguageSelector|ThemeToggle` |
| 3 | Content collections, i18n dicts, seed content, page routes | PR 3 | `astro check` + `npm run build` | `npm run dev` — visit all routes/locales | Delete `content.config.ts`, `src/content/`, `src/pages/[locale]/`, `src/i18n/`, `src/data/` |
| 4 | SEO/a11y/perf wiring | PR 4 | `npm run build` (sitemap/OG output) | Lighthouse run | Revert head/SEO component diffs only |
| 5 | GitHub build-time integration | PR 5 | `vitest run lib/github.test.ts` | `npm run build` w/ network off (fallback path) | Delete `lib/github.ts` + its call sites |
| 6 | CV + assets wiring | PR 6 | `astro check` | `npm run dev` — CV links | Delete `lib/cv.ts`, `public/cv/*` |
| 7 | Testing setup (Vitest + lib tests) | PR 7 | `vitest run` | N/A — unit tests are the harness | Remove `vitest`, `*.test.ts` files |
| 8 | Deployment docs | PR 8 | N/A — docs only | N/A — no runtime change | Revert README/.env.example |
| 9 | Final polish / Lighthouse | PR 9 | `npm run build` | Lighthouse ≥95 all locales | Revert polish-only diffs |

## Phase 1: Scaffold & Project Init

- [ ] 1.1 `npm create astro@latest` (TS strict, no starter); `git init`; commit.
- [ ] 1.2 Install/configure Tailwind v4 (`@tailwindcss/vite`), `@astrojs/vercel`, `@astrojs/sitemap` in `astro.config.mjs` (i18n block: `defaultLocale:'es'`, `locales:['es','en','de']`, `prefixDefaultLocale:true`, `fallback:{de:'en'}`, `fallbackType:'rewrite'`; shiki dual-theme).
- [ ] 1.3 Set temporary `site: 'https://<project>.vercel.app'` in `astro.config.mjs`, `// TODO: swap real domain` (R1).
- [ ] 1.4 `tsconfig.json` extends `astro/tsconfigs/strict`.
- [ ] 1.5 `src/styles/global.css` — Tailwind v4 `@theme` tokens + `prefers-reduced-motion` base guard.
- [ ] 1.6 Commit scaffold.

## Phase 2: Layouts & Shared Components

- [ ] 2.1 `layouts/BaseLayout.astro` (html lang, head slot, skip-link, Header/Footer, `<slot>`).
- [ ] 2.2 `components/head/SeoHead.astro` + `Hreflang.astro` (title/OG/canonical/JSON-LD; es/en/de/x-default via `getAbsoluteLocaleUrl`).
- [ ] 2.3 `components/Header.astro` + `Footer.astro` (nav, CV link, LanguageSelector, ThemeToggle, contact/social).
- [ ] 2.4 `lib/locale-path.ts` (`switchLocalePath`) + `components/LanguageSelector.astro` (3 `<a>`, `aria-current`).
- [ ] 2.5 `components/ThemeToggle.astro` (no-flash head script, `localStorage`, `data-theme`).
- [ ] 2.6 `layouts/PostLayout.astro` (BaseLayout + TOC + reading time + prev/next).

## Phase 3: Content Model, i18n & Pages

- [ ] 3.1 `src/content.config.ts` — `blog` (glob loader, zod schema, closed `tags` enum) + `experience` (JSON glob loader, schema has **no `image` field anywhere**).
- [ ] 3.2 `i18n/{es,en,de}.json` + `i18n/index.ts` (typed `t()`, `UIKey = keyof typeof es`, de→en→es fallback).
- [ ] 3.3 `data/{site,skills,education,projects,nav}.ts` (typed statics, `isExample`).
- [ ] 3.4 `content/experience/{es,en,de}/*.json` seed roles incl. Teatrino entry, text-only, **no image field/slot**.
- [ ] 3.5 `content/blog/{es,en,de}/*.md` — 6 launch seed posts (ES minimum, titles per spec).
- [ ] 3.6 `pages/[locale]/index.astro` — Home: Hero → About summary → Skills two-worlds → Featured experience → Featured projects → Latest posts → Contact.
- [ ] 3.7 `pages/[locale]/about.astro`, `experience.astro`, `projects.astro`.
- [ ] 3.8 `pages/[locale]/blog/index.astro` + `blog/[...slug].astro`.
- [ ] 3.9 `Hero`, `TwoWorlds`, `Timeline`, `TimelineCard` (`<details>`, **no image slot**), `EarlyExperience` (collapsed accordion default), `ProjectCard`, `BlogCard`, `TableOfContents`, `CodeSnippet` components.
- [ ] 3.10 `components/TagFilter.astro` — vanilla `<script type="module">` chip filter, blog index only, no `/blog/tags/[tag]/` routes.
- [ ] 3.11 Commit content/i18n/pages.

## Phase 4: SEO / Accessibility / Performance

- [ ] 4.1 Wire `SeoHead`/`Hreflang` into `BaseLayout`; JSON-LD `Person` on Home/About, minimal `WebSite`/`WebPage` elsewhere.
- [ ] 4.2 Verify `@astrojs/sitemap` i18n output; add `public/robots.txt`.
- [ ] 4.3 Pre-render OG PNGs into `public/og/`, wire into `SeoHead`.
- [ ] 4.4 A11y pass: landmarks, one `<h1>`/page, focus rings, `aria-current`; verify AA contrast both themes (R4).
- [ ] 4.5 `prefers-reduced-motion` CSS guard + `<ClientRouter />` (Chromium-only, R5); convert raster images to `astro:assets`.

## Phase 5: GitHub Build-Time Integration

- [ ] 5.1 `lib/github.ts` — `fetchRepo`/`mergeProjects`, `AbortSignal.timeout(5000)`, never throws, null on failure.
- [ ] 5.2 Wire into `projects.astro` + Home featured-projects section (top-level `await`); stale/example badge on fallback.
- [ ] 5.3 Document optional `GITHUB_TOKEN` in `.env.example`.

## Phase 6: CV & Assets Wiring

- [ ] 6.1 `lib/cv.ts` — `cvHref(locale)` mapping `de→en`.
- [ ] 6.2 Place user-supplied real PDFs at `public/cv/juan-pablo-guzman-{es,en}.pdf`. If not yet supplied: add a clearly-labeled, non-executable placeholder note in README (`<!-- PLACEHOLDER: real CV PDF pending, not for production -->`) and `// TODO: replace with real CV, user-supplied` — never fabricate a fake binary.
- [ ] 6.3 Wire CV link (Header + Hero CTA, `download`, `aria-label`); real or clearly-labeled placeholder `CodeSnippet` content if user hasn't supplied real snippet (R2).

## Phase 7: Testing Setup

- [ ] 7.1 Confirm `astro check` + `npm run build` catch schema/type errors (baseline gate).
- [ ] 7.2 Install Vitest devDependency; `test` script = `vitest run`; update `openspec/config.yaml` `verify.test_command` to `vitest run`.
- [ ] 7.3 `lib/locale-path.test.ts` (prefix swap incl. root/blog paths).
- [ ] 7.4 `lib/github.test.ts` (fallback-on-failure contract: null/non-2xx/timeout → seed+stale, never throws).
- [ ] 7.5 `lib/reading-time.test.ts` (words→minutes boundary).
- [ ] 7.6 Commit tests.

## Phase 8: Deployment Docs

- [ ] 8.1 `README.md` — setup, scripts, i18n routing note, CV note, `GITHUB_TOKEN` note; `.env.example`.
- [ ] 8.2 Document Vercel adapter (`@astrojs/vercel/static`), confirm no custom `vercel.json` needed.
- [ ] 8.3 Add explicit follow-up task/reminder: swap `site` in `astro.config.mjs` for the real domain once purchased (R1) — regenerates hreflang/sitemap/OG/JSON-LD from one config value.

## Phase 9: Final Polish

- [ ] 9.1 Lighthouse pass (Performance/A11y/Best Practices/SEO ≥95) across all locales; fix regressions.
- [ ] 9.2 Manual QA: non-Chromium plain-nav path + `prefers-reduced-motion` path (R5).
- [ ] 9.3 Final commit.
