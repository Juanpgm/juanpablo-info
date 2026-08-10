# Design: personal-website-mvp

Technical architecture for the trilingual (ES/EN/DE) Astro portfolio + blog.
This is the **HOW** at architecture level — the WHAT-to-do steps live in
`tasks.md`. Greenfield: no code, no git repo yet. Nothing here is scaffolded;
`sdd-apply` builds it.

Source of truth: `proposal.md` (this repo) — all its confirmed decisions are
treated as locked. Where the proposal left items open (O3, O6, O9), this design
resolves them.

---

## 1. Architecture approach

**Pattern**: static-first, content-driven, zero-JS-by-default islands.

- Astro renders 100% static HTML at build time (`output: 'static'`). No SSR, no
  server runtime, no API routes. Every dynamic-looking value (GitHub stars,
  reading time, TOC, hreflang) is computed **at build**.
- Islands only where a real interaction exists, and — per §7 decision — those
  islands are **vanilla JS**, not a UI framework. Net client JS target: a few
  small inline/module scripts, no framework runtime.
- Content vs. code separation: authored prose and structured role data live in
  **Content Collections** (typed via zod); small stable lists live in **typed TS
  modules** under `src/data`; UI strings live in **JSON dictionaries** under
  `src/i18n`. This is the "screaming architecture" line — the folder layout tells
  you the site is a localized content portfolio.

**Layering (dependency direction, top depends on bottom):**

```
pages/ (routing, per-locale)        ← composition only, no logic
  └─ layouts/ (page shells + <head>)
       └─ components/ (presentational .astro; a few with vanilla island scripts)
            └─ i18n/ (t() lookup) · data/ (typed statics) · content/ (collections)
                 └─ lib/ (pure helpers: locale-path, github-merge, reading-time)
```

`lib/` is pure and framework-free → it is the only part worth unit-testing (§11).

**Rationale**: the proposal's success criteria are Lighthouse ~100 / AA / correct
hreflang. The cheapest way to hit all three is to ship almost no JS and bake
everything at build. An island framework (even Preact at ~3KB) is a dependency we
have no stateful need for at this content scale (§7). YAGNI.

---

## 2. Project setup

Astro latest stable (5.x) + Tailwind + TypeScript (`strict`).

`astro.config.mjs` (shape, not final code):

```js
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel/static';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite'; // Tailwind v4 Vite plugin

export default defineConfig({
  site: 'https://<final-domain>',            // required for sitemap + hreflang absolute URLs
  output: 'static',
  adapter: vercel({ webAnalytics: { enabled: false } }),
  i18n: {
    defaultLocale: 'es',
    locales: ['es', 'en', 'de'],
    routing: { prefixDefaultLocale: true, fallbackType: 'rewrite' },
    fallback: { de: 'en' },
  },
  integrations: [sitemap({ i18n: { defaultLocale: 'es', locales: { es:'es', en:'en', de:'de' } } })],
  markdown: {
    shikiConfig: { themes: { light: 'github-light', dark: 'github-dark' }, wrap: true },
  },
  vite: { plugins: [tailwindcss()] },
});
```

Notes / decisions:
- **Tailwind v4** via `@tailwindcss/vite` (not the legacy `@astrojs/tailwind`
  integration, which is deprecated for v4). CSS-first config in a single
  `src/styles/global.css` with `@theme` tokens for the neutral palette + one
  accent. Rationale: fewer moving parts, official current path.
- **`site` is mandatory** — sitemap and hand-built hreflang both need the absolute
  origin. Flag: real domain must be decided before first deploy (risk R1).
- Adapter import is `@astrojs/vercel/static` (static entrypoint), matching
  `output: 'static'`.
- Shiki dual-theme (light/dark) so code blocks follow the theme toggle via CSS
  vars — no JS re-highlighting (§9).

---

## 3. Directory structure

```
personal-website/
├─ astro.config.mjs
├─ tsconfig.json                 # extends astro/tsconfigs/strict
├─ package.json
├─ src/
│  ├─ content.config.ts          # Astro 5 collections (blog, experience)
│  ├─ pages/
│  │  └─ [locale]/               # NOT a dynamic param — see routing note below
│  │     ├─ index.astro          # Home
│  │     ├─ about.astro
│  │     ├─ experience.astro
│  │     ├─ projects.astro
│  │     └─ blog/
│  │        ├─ index.astro
│  │        └─ [...slug].astro   # blog post, getStaticPaths over collection
│  ├─ layouts/
│  │  ├─ BaseLayout.astro         # <html lang> · <head> · Header/Footer · <slot>
│  │  └─ PostLayout.astro         # BaseLayout + article chrome (TOC, reading time, prev/next)
│  ├─ components/
│  │  ├─ head/
│  │  │  ├─ SeoHead.astro         # title/desc/OG/canonical/JSON-LD
│  │  │  └─ Hreflang.astro        # hand-built alternate links (§4)
│  │  ├─ Header.astro
│  │  ├─ Footer.astro
│  │  ├─ Hero.astro
│  │  ├─ TwoWorlds.astro          # Skills two-columns section
│  │  ├─ Timeline.astro           # experience list; renders TimelineCard[]
│  │  ├─ TimelineCard.astro       # one role; <details> for expand
│  │  ├─ EarlyExperience.astro    # collapsed <details> accordion
│  │  ├─ ProjectCard.astro
│  │  ├─ BlogCard.astro
│  │  ├─ TagFilter.astro          # vanilla chips (§7)
│  │  ├─ LanguageSelector.astro
│  │  ├─ ThemeToggle.astro
│  │  ├─ TableOfContents.astro
│  │  └─ CodeSnippet.astro        # static Shiki-highlighted showcase block (§9)
│  ├─ data/
│  │  ├─ site.ts                  # origin, author, social, JSON-LD Person source
│  │  ├─ skills.ts                # { ai: Skill[], civil: Skill[] } with i18n label keys
│  │  ├─ education.ts
│  │  ├─ projects.ts              # seed: name, repoUrl?, stack[], isExample
│  │  └─ nav.ts                   # nav item ids → route + i18n key
│  ├─ i18n/
│  │  ├─ es.json  en.json  de.json
│  │  └─ index.ts                 # typed t(locale, key) + locale helpers
│  ├─ lib/
│  │  ├─ locale-path.ts           # switchLocalePath() over getRelativeLocaleUrl
│  │  ├─ github.ts                # build-time merge of projects seed + REST data
│  │  └─ reading-time.ts          # words/200 → minutes
│  ├─ content/
│  │  ├─ blog/{es,en,de}/*.md
│  │  └─ experience/{es,en,de}/*.{json,md}
│  ├─ styles/global.css           # Tailwind v4 @theme tokens, base, prefers-reduced-motion
│  └─ assets/                     # astro:assets-optimized images (hero, OG source)
├─ public/
│  ├─ cv/juan-pablo-guzman-es.pdf
│  ├─ cv/juan-pablo-guzman-en.pdf
│  ├─ og/*.png                    # pre-rendered OG images (§7)
│  └─ robots.txt                  # or generated; see §7
└─ README.md
```

**Routing note (important):** with Astro native i18n + `prefixDefaultLocale:
true`, the recommended layout is a **physical `src/pages/[locale]/` directory**
where `[locale]` is a real dynamic segment whose values come from
`getStaticPaths()` returning `es|en|de`. Each page file calls `getStaticPaths`
(or a shared `paths()` helper) to emit the three locale variants. Blog posts
compose two params (`locale` + `slug`) in `blog/[...slug].astro`. This keeps one
file per page type instead of triplicating page files per locale.
Rationale: single source per page, zero duplicated markup, matches Astro's
documented i18n content pattern (`id.startsWith('es/')`).

---

## 4. Content Collections schemas (final)

`src/content.config.ts` (Astro 5 loader API):

```ts
import { defineCollection, z } from 'astro:content';
import { glob, file } from 'astro/loaders';

const LOCALE = z.enum(['es', 'en', 'de']);
const TAG = z.enum(['ia', 'data-engineering', 'bim', 'geointeligencia', 'carrera']);

const blog = defineCollection({
  // one dir per locale; entry id is like "es/mi-post"
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: ({ image }) => z.object({
    title: z.string().max(120),
    description: z.string().max(200),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(TAG).min(1),
    heroImage: image().optional(),          // astro:assets, optimized; optional
    draft: z.boolean().default(false),
    // readingTime + TOC are COMPUTED at render, never stored
  }),
});

const experience = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/experience' }),
  schema: z.object({
    company: z.string(),
    role: z.string(),
    location: z.string(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date().optional(),     // absent ⇒ ongoing
    current: z.boolean().default(false),
    group: z.enum(['recent', 'early']),      // 'early' ⇒ rendered in collapsed accordion
    highlights: z.array(z.string()),
    stack: z.array(z.string()).default([]),
    featured: z.boolean().default(false),    // shown in Home "Experiencia destacada"
    order: z.number().optional(),            // manual tiebreak; else sort by startDate desc
    // NO `image` field — Teatrino & all entries are text-only (proposal O7, §10)
  }),
});

export const collections = { blog, experience };
```

Decisions:
- **`tags` is a closed enum**, not free strings. Rationale: the filter chips and
  the 6 placeholder posts use a fixed vocabulary; an enum makes zod reject typos
  at build (a bad tag = broken filter). Adding a tag is a one-line enum edit.
- **Locale derives from the entry id prefix** (`es/…`), not a frontmatter field —
  the directory *is* the locale. A page queries
  `getCollection('blog', ({ id }) => id.startsWith(`${locale}/`))`.
- **`experience` uses JSON (`file()`/`glob(json)`) not Markdown** — highlights are
  short bullet strings, no long prose; JSON keeps them structured and trivially
  translatable. (If a role ever needs rich prose, switch that one to `.md` body;
  not needed now.)
- **No `image` on experience** — hard-locks proposal O7. Layout reserves no image
  slot (§10).

---

## 5. i18n implementation

### 5.1 Dictionary + `t()` helper (`src/i18n/index.ts`)

- Import the three JSON files, type them against `es.json` as the canonical
  keyset: `type UIKey = keyof typeof es`. `en`/`de` are `Record<UIKey, string>`
  so a missing key is a **type error at build** (Learned: catches untranslated UI
  strings without a runtime check).
- `t(locale, key)`: returns `dict[locale][key]`, falling back `de → en → es` for a
  missing value (mirrors the content `fallback: { de: 'en' }`).
- Thin wrappers re-export Astro's `getRelativeLocaleUrl`, `getAbsoluteLocaleUrl`,
  and a `useLocale(Astro)` that reads `Astro.currentLocale`.

Rationale: no i18n plugin (`astro-i18next` etc.). Astro native i18n + a ~30-line
typed helper covers everything. A plugin is a dependency for a problem the
platform already solves (ladder rung 4).

### 5.2 hreflang (hand-built, `Hreflang.astro`)

Astro does not emit hreflang. The component receives the **current logical page
key** (e.g. `about`, or `blog/[slug]`) and emits, into `<head>`:

```html
<link rel="alternate" hreflang="es" href="{site}/es/about/" />
<link rel="alternate" hreflang="en" href="{site}/en/about/" />
<link rel="alternate" hreflang="de" href="{site}/de/about/" />
<link rel="alternate" hreflang="x-default" href="{site}/en/about/" />
```

- Built from `getAbsoluteLocaleUrl(locale, path)` for each locale, so it always
  matches real routes. `x-default → en` (the international bridge locale, aligned
  with the DE-fallback rationale).
- For blog posts that exist only in some locales, hreflang still lists all three
  because `fallbackType: 'rewrite'` guarantees the DE URL resolves (to EN content)
  — no 404, so advertising the alternate is correct.

### 5.3 Language selector (`switchLocalePath`)

`lib/locale-path.ts`:

```ts
// Given the current URL and a target locale, return the equivalent path,
// preserving the page. Because URL segments are stable English across locales,
// this is a pure prefix swap validated against Astro's helper.
export function switchLocalePath(currentPath: string, target: Locale): string {
  const rest = currentPath.replace(/^\/(es|en|de)(?=\/|$)/, ''); // strip locale prefix
  return getRelativeLocaleUrl(target, rest || '/');
}
```

- Selector renders three links (not a JS dropdown) → works with zero JS, keyboard
  accessible, crawlable. Current locale marked `aria-current="true"`.
- Because slugs are **stable English across locales** (proposal decision, final),
  path preservation is a pure prefix swap — no slug-translation map needed. This
  is the single biggest simplification the stable-slug decision buys us.

### 5.4 Stable URL segments

All routes use English segments in every locale (`/de/about/`, `/de/projects/`,
`/de/blog/<english-or-source-slug>/`). Enforced structurally: there is one
`about.astro` emitting all three locales, so a localized segment is impossible by
construction. Blog slugs come from the **filename**, kept identical across locale
dirs for the same logical post (`blog/es/rag-nsr-10.md`, `blog/en/rag-nsr-10.md`).

---

## 6. GitHub API build-time integration

`lib/github.ts`, invoked from `projects.astro` (and the Home projects section) at
build via top-level `await` in the component frontmatter (Astro runs it once per
build, output baked into static HTML).

```ts
// mergeProjects(seed): for each seed with a repoUrl, fetch public REST metadata,
// merge { stars, primaryLanguage, lastUpdated }. Never throws — degrades to seed.
async function fetchRepo(owner, repo, token?) {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) return null;              // 403 rate-limit, 404, etc. → null
  const j = await res.json();
  return { stars: j.stargazers_count, primaryLanguage: j.language, lastUpdated: j.pushed_at };
}
```

Merge / error contract:
- **Must never break the build.** Any failure (network, non-2xx, timeout, missing
  repo) → that project falls back to its seed with `stale: true`, and the card
  hides live-metric UI (no "★ undefined"). A seed with `isExample: true` or no
  `repoUrl` skips the fetch entirely and renders a clearly-labeled example badge.
- **Sequential with a small delay** (or `Promise.allSettled` over ≤ a handful of
  repos) — at 2–3 projects, unauthenticated 60 req/hr is never a concern.
- **Optional `GITHUB_TOKEN`** env var (read via `import.meta.env.GITHUB_TOKEN`)
  only raises the rate limit; absence is the normal launch state, not an error.
- `lastUpdated` rendered via `<time>` with locale-formatted date.

Rationale: build-time only (proposal + exploration lock this). `allSettled` +
per-repo null-fallback is the whole resilience story — no cache layer, no retry
queue. `ponytail:` if rebuild frequency ever explodes, add the PAT; not now.

---

## 7. Island framework decision (resolves O3)

**Decision: vanilla JS / CSS / `<details>` for every interactive element. No
Preact, no React, no framework island.**

| Widget | Implementation | Why |
|---|---|---|
| Theme toggle | inline no-flash `<script>` in `<head>` + a `<button>` toggling `data-theme` on `<html>`, persisted to `localStorage` | ~15 lines; a framework here is absurd |
| Language selector | 3 `<a>` links, no JS | crawlable, a11y, zero JS |
| Timeline card expand | native `<details>/<summary>` | zero JS, keyboard + SR accessible for free |
| Early-experience accordion | native `<details>` (collapsed default) | same |
| Blog tag filter | vanilla `<script type="module">`: toggle `.hidden` on cards by `data-tags` | see below |

**Tag filter — the one widget that could justify Preact — stays vanilla.**
Reasoning: at 4–6 launch posts, filtering is `querySelectorAll` + toggle a class
by comparing a clicked chip's tag against each card's `data-tags`. That is ~20
lines of DOM code with no state machine, no re-render, no diffing. Preact would
add a dependency + hydration cost to save nothing. **If** the blog grows past
~30 posts *and* gains multi-select/AND-OR filter logic, revisit — that is a
concrete future trigger, not a present need. Decision stated plainly: **vanilla,
now and at launch.**

Progressive enhancement: chips are real links/buttons; with JS off, all posts
show (no filtering) — nothing is hidden behind JS.

---

## 8. SEO / a11y implementation plan

### JSON-LD Person (`SeoHead.astro`, sourced from `site.ts`)

```jsonc
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Juan Pablo Guzmán Martínez",
  "jobTitle": "Civil Engineer · AI & Data Science Specialist",
  "email": "mailto:juanp.gzmz@gmail.com",
  "url": "https://<domain>/",
  "sameAs": ["https://www.linkedin.com/in/jp-guzman", "https://github.com/<user>"],
  "address": { "@type": "PostalAddress", "addressLocality": "Cali",
               "addressRegion": "Valle del Cauca", "addressCountry": "CO" },
  "knowsLanguage": ["es", "en", "de"],
  "knowsAbout": ["Artificial Intelligence", "Data Science", "Civil Engineering",
                 "BIM", "Geospatial Intelligence"]
}
```
Emitted once on Home; other pages emit `WebSite`/`WebPage` minimal schema.

### Sitemap / robots
- `@astrojs/sitemap` with i18n config → emits `sitemap-index.xml` + per-locale
  `alternate` refs automatically. No hand-rolled sitemap.
- `robots.txt`: static file in `public/` — `User-agent: * / Allow: /` +
  `Sitemap: {site}/sitemap-index.xml`. (Static file over a plugin; ladder rung 4.)

### OG images
- **Pre-rendered static PNGs** in `public/og/` (one per page type / locale where
  it matters), referenced by `SeoHead`. Rationale: a dynamic `@vercel/og` /
  satori route contradicts `output: 'static'` and adds a runtime; a fixed set of
  images is enough for a ~6-page portfolio. `ponytail:` if per-post OG images
  become desirable, add build-time satori generation in `getStaticPaths`; deferred.

### Accessibility AA
- Palette tokens chosen to meet **≥4.5:1** body / **≥3:1** large text in *both*
  themes — verified during apply (task, not asserted here). Accent color used for
  emphasis, never as the sole state indicator.
- Landmarks (`header/nav/main/footer`), one `<h1>` per page, skip-to-content link,
  visible focus rings (never `outline:none` without replacement), `aria-current`
  on active nav/locale, `<details>` for disclosures (native SR support).

### Motion / `prefers-reduced-motion`
- `<ClientRouter />` View Transitions enabled; animation is Chromium-only, plain
  nav elsewhere (proposal O8, accepted).
- Global CSS guard: `@media (prefers-reduced-motion: reduce)` zeroes transition/
  animation durations **and** sets `astro:` view-transition animations to none.
  All bespoke CSS transitions wrapped by the same query.

### Dark / light mode
- `data-theme` on `<html>`, driven by: (1) an **inline head script** that reads
  `localStorage.theme ?? matchMedia('(prefers-color-scheme: dark)')` and sets the
  attribute *before first paint* (no flash); (2) `ThemeToggle` button flips it +
  persists. Tailwind v4 dark variant bound to `[data-theme="dark"]`. Shiki dual
  theme (§2) follows via CSS vars. `transition:persist` keeps the toggle's state
  across View-Transition navigations.

---

## 9. CV delivery

- Static PDFs in `public/cv/`: `juan-pablo-guzman-es.pdf`, `…-en.pdf`. Served
  as-is by Vercel CDN, no processing. (Not `src/assets` — `astro:assets` is for
  images/optimization; PDFs are opaque static files that belong in `public/`.)
- Linked from Header (persistent "CV" link) and Hero CTA. The link points to the
  **locale-appropriate CV**: a `cvHref(locale)` helper maps `de → en` (no DE CV,
  matches fallback logic), `es → es`, `en → en`. `download` attribute + descriptive
  `aria-label`.
- User supplies the real ES + EN PDFs at apply time (proposal O6) — treated as
  real content, not placeholders. DE CV omitted (falls back to EN).

## 10. Teatrino entry (confirms O7)

Teatrino renders as a **normal `TimelineCard`** in the `experience` collection
(`group: 'recent'` or wherever its date sorts), text-only: role "Structural
Designer", the ~450-person concrete amphitheater + NSR-10 compliance highlights.
The schema has **no `image` field** and the card template reserves **no image
slot / no aspect-ratio box / no placeholder graphic** — so there is zero dead
space. Adding an image later is a schema + template follow-up, explicitly out of
this change.

## 11. Testing approach

State for `sdd-init` to record: **no test runner installed yet.**

- **Baseline gate: `astro check`** (already the config's spirit) — TS + template
  type-checking across all `.astro`/`.ts`. This catches the high-value classes of
  bug for a static site: bad content frontmatter (zod), missing i18n keys (typed
  dict), broken imports. `verify.build_command` is `npm run build`, which also
  fails on collection/type errors.
- **Targeted unit tests: Vitest**, only for the three pure `lib/` functions with
  real branching:
  1. `switchLocalePath` — prefix swap across locales incl. root and blog paths.
  2. `github.mergeProjects` / `fetchRepo` — the **fallback-on-failure** contract
     (null/non-2xx/timeout → seed with `stale`, never throw). This is the one
     place a silent bug breaks the build or ships "★ undefined".
  3. `reading-time` — words → minutes boundary.
- No component/E2E/DOM tests at launch — over-engineering for a static portfolio.
  `ponytail:` add Playwright smoke only if navigation/i18n regressions recur.

Recommendation to record once chosen: `vitest` as devDependency, `test` script =
`vitest run`, `verify.test_command` updated from `""` to `vitest run` **after**
sdd-init records it. Design does not install it — that is an apply/init action.

## 12. Deployment

- `@astrojs/vercel/static` adapter, `output: 'static'`. Vercel auto-CDN-caches
  static output; **no custom `vercel.json`** needed (exploration finding).
- Build: `npm run build` → `dist/` (Vercel detects Astro preset).
- **Env vars**: `GITHUB_TOKEN` — **optional**, only to raise GitHub API rate
  limit during build. Absent = normal. Documented in README + `.env.example`.
  No secret is required for launch.
- `site` must be set to the production origin before deploy (blocks correct
  hreflang/sitemap/OG absolute URLs) — risk R1.

---

## ADR summary (decision · rationale · rejected)

| # | Decision | Rationale | Rejected alternative |
|---|---|---|---|
| A1 | Vanilla JS for all islands (resolves O3) | No stateful widget at this scale justifies a framework runtime; protects Lighthouse ~100 | Preact islands (adds dep + hydration for ~20 lines of DOM code) |
| A2 | Tailwind v4 via `@tailwindcss/vite` | Current official path; CSS-first tokens; fewer integrations | `@astrojs/tailwind` (deprecated for v4) |
| A3 | Native Astro i18n + ~30-line typed `t()` | Platform already solves routing/fallback/URLs; typed dict catches missing keys at build | `astro-i18next`/plugin (dependency for a solved problem) |
| A4 | Physical `src/pages/[locale]/` + `getStaticPaths` | One file per page emits all 3 locales; no triplicated markup | Triplicated `pages/es`, `pages/en`, `pages/de` dirs |
| A5 | `experience` as JSON collection, no `image` | Short structured bullets, easy to translate; locks O7 no-placeholder | Markdown bodies / an optional image field |
| A6 | Closed enum for blog `tags` | Filter + posts share a fixed vocabulary; zod rejects typos | Free-string tags (typo → silently broken filter) |
| A7 | GitHub fetch at build, `allSettled` + null fallback | Never breaks build; 60 req/hr fine for 2–3 repos; token optional | Runtime/client fetch (rate-limit + CWV cost); cache layer (YAGNI) |
| A8 | Pre-rendered static OG PNGs | Fits `output: 'static'`, no runtime; enough for ~6 pages | `@vercel/og`/satori route (adds runtime, contradicts static) |
| A9 | Static PDFs in `public/cv/`, `cvHref(de→en)` | PDFs are opaque static assets; DE reuses EN per fallback logic | `astro:assets` (image pipeline, wrong tool for PDF) |
| A10 | `astro check` + Vitest on `lib/` only | Type-check catches most static-site bugs; unit-test only pure branching logic | Component/E2E suite (over-engineering at launch) |

---

## Risks / assumptions for sdd-tasks & sdd-apply

- **R1 — RESOLVED:** no production domain yet (user confirmed). Use the Vercel
  preview/production `*.vercel.app` URL as the temporary `site` value at apply
  time (real value only known after first deploy). `sdd-tasks` should include an
  explicit task to swap `site` in `astro.config.mjs` for the real domain the
  moment one is purchased/decided — hreflang, sitemap, OG, and JSON-LD `url` all
  regenerate correctly from that single config value, no other code changes
  needed.
- **R2 (content):** real ES + EN CV PDFs (O6) and the real code-snippet content
  (O9) are user-supplied at apply. Design ships a clearly-labeled faithful
  placeholder snippet if not provided — must be visibly marked non-executable.
- **R3 (Tailwind v4 flux):** v4 + Astro integration idioms move fast; if the
  `@tailwindcss/vite` path hits friction at apply, fall back to v3 +
  `@astrojs/tailwind` (known-stable) — tokens/utility usage barely change.
- **R4 (a11y AA contrast):** the neutral+accent palette must be contrast-verified
  in *both* themes during apply; this design fixes the approach, not the exact hex
  values.
- **R5 (View Transitions):** Chromium-only animation accepted (O8); ensure the
  `prefers-reduced-motion` + non-Chromium plain-nav paths are both tested manually.
- **Assumption:** GitHub repos for the 2–3 featured projects are public; private/
  missing repos degrade to example cards (A7 handles it, no failure).
- **Assumption:** `sdd-init` will record the Vitest choice + update
  `verify.test_command`; this design only specifies it (§11).
```
