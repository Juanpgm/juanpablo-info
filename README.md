# personal-website

Juan Pablo Guzmán Martínez's personal site/portfolio — an Astro static site
that bridges his two professional worlds: civil engineering (structures,
infrastructure, territory) and data/AI (data engineering, geointelligence,
RAG). Built with Astro 5, Tailwind v4, and TypeScript; deployed as a fully
static site on Vercel; content in Spanish (default), English, and German.

## Local setup

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # static output to dist/ (and .vercel/output for the adapter)
npm run preview   # serve the production build locally
npm test          # vitest run — unit tests for src/lib
npm run astro check   # type-check .astro/.ts files + content collections
```

Requires Node >= 22.12 (see `engines` in `package.json`).

`npm run astro check` and `npm run build` are the two checks that matter most
on a static content site: `astro check` catches bad frontmatter (Zod schema
errors) and missing i18n keys at the type level; `build` catches the same
things again plus anything that only breaks when Astro actually renders every
route.

## i18n routing

Locales: `es` (default), `en`, `de`. Every route is served under a locale
prefix — `/es/`, `/en/`, `/de/` — including the default locale (Astro's
`prefixDefaultLocale: true`), so there's no unprefixed root duplicating `/es/`.

- **URL segments are stable English across all locales by design** — e.g.
  `/es/about/`, `/en/about/`, `/de/about/` all use `about`, not a translated
  slug per locale. This is a deliberate simplicity tradeoff, not an oversight
  (see `design.md` §5.3 in `openspec/changes/personal-website-mvp/` for the
  full rationale). Switching locale is a pure prefix swap
  (`src/lib/locale-path.ts`), which is also why it's trivially testable.
- **`de → en` fallback**: German has no dedicated content of its own for
  blog posts or CV. Astro's `i18n.fallback: { de: 'en' }` (with
  `fallbackType: 'rewrite'`) serves the English version transparently under
  the `/de/` prefix when no German entry exists. UI strings (nav, buttons,
  labels) *are* fully translated into German (`src/i18n/de.json`) — only
  long-form content falls back.

## Adding a new blog post

1. Create `src/content/blog/{locale}/{slug}.md`, where `locale` is `es`,
   `en`, or `de` and `slug` becomes the URL slug (`/{locale}/blog/{slug}/`).
   Don't create a template/example file inside `src/content/blog/` itself —
   the content-collection loader globs every `.md` file in that directory as
   a real post, so a template file would ship as one. This section is the
   template.
2. Add frontmatter matching the schema in `src/content.config.ts`. Every
   field, explained:

   ````markdown
   ---
   title: "Post title (max 120 chars)"
   description: "Short summary shown on blog cards and used as the SEO meta description (max 200 chars)"
   pubDate: 2026-08-10
   updatedDate: 2026-09-01
   tags: ["ia", "data-engineering"]
   heroImage: "./rag-normativa-tecnica-hero.jpg"
   draft: false
   ---

   ## A heading

   Regular paragraph text. Blank lines separate paragraphs — Markdown, not
   HTML, so don't add manual `<br>`s.

   - A bullet point
   - Another bullet point

   > A blockquote — a callout or a quoted source, rendered with a left
   > border and muted italic text.

   Reference an API with inline code like `getStaticPaths()`, or drop a full
   fenced code block:

   ```ts
   export function readingTimeMinutes(body: string): number {
     return Math.max(1, Math.round(body.split(/\s+/).length / 200));
   }
   ```
   ````

   - `title`, `description`, `pubDate`, `tags` are **required**.
   - `updatedDate` is **optional** — set it only when you substantively edit
     a published post; it renders as "Actualizado el ..." next to the
     publish date.
   - `tags` is a **closed enum** — pick one or more from:
     `ia`, `data-engineering`, `bim`, `geointeligencia`, `carrera` (defined in
     `src/content.config.ts`; a typo or new tag fails `astro check`/`build`,
     not silently). To add a new tag category, extend the `TAG` enum there
     first, and add a matching `blog.tag.<value>` key to all three
     `src/i18n/*.json` files (used for the tag filter chip labels and the
     tag badges now shown on the post page itself).
   - `heroImage` is **optional** — a relative path to an image file placed
     next to the post's `.md` file (Astro's `image()` content schema helper
     resolves and optimizes it at build time via `astro:assets`, so it
     accepts local files only, not remote URLs). A roughly 16:9 image
     (e.g. 1200×630) works best — it's shown as a thumbnail on blog cards
     and as a banner at the top of the post page; a post that omits it
     renders neither, with no broken image and no placeholder.
   - `draft` — `true` keeps a post out of both the index listing and the
     TOC/sitemap while it's still being written; the page still builds (so
     you can preview it locally at its direct URL) but nothing links to it.
     Defaults to `false`.
3. Only the locale directories where you actually add the file will show
   that post in that locale — there's no requirement to write the same post
   in all three languages at once. Missing `en`/`de` versions fall back to
   `de → en → es` per the routing rules above, so an ES-only post still shows
   up (as its ES version) when a German or a missing-English reader hits the
   URL, via `src/lib/content-fallback.ts`.

## Adding a new translation

- **UI strings** (nav labels, buttons, headings, etc.): edit
  `src/i18n/{locale}.json`. `es.json` is the canonical keyset — `en.json` and
  `de.json` are typed as `Record<UIKey, string>` (`src/i18n/index.ts`), so
  adding a *new* key to `es.json` without adding the same key to `en.json`
  and `de.json` is a **type error**, not a silent gap. There is no
  "translation missing" fallback for UI strings; they're always complete by
  construction.
- **Blog posts**: add the same `{slug}.md` filename under
  `src/content/blog/{locale}/` with translated frontmatter + body (see above).
- **Experience entries**: add a JSON file with the same base name under
  `src/content/experience/{locale}/` (schema in `src/content.config.ts`).

**Known open follow-ups** (not hidden — tracked, not yet done):
- `en`/`de` experience entries (`src/content/experience/{en,de}/`) are
  currently empty; only `es/` has the full 13-role history. English/German
  readers currently see the Spanish content via the fallback chain.
- 3 of the 6 launch blog posts have English translations
  (`src/content/blog/en/`); the remaining 3 EN translations are open work.
- German blog content is intentionally not planned (relies on the `de → en`
  fallback by design, not an oversight).

## CV

CV PDFs live at `public/cv/juan-pablo-guzman-es.pdf` and
`public/cv/juan-pablo-guzman-en.pdf` (`src/lib/cv.ts` maps `de → en`, no
separate German CV). To update the CV, replace those two files directly —
same filenames, no code changes needed.

## `GITHUB_TOKEN` (optional)

At build time the Projects page/section fetches live repo metadata (stars,
primary language, last-updated) from the GitHub API for featured projects
(`src/lib/github.ts`). Without a token this uses GitHub's unauthenticated
rate limit (60 req/hr), which is enough for the 2-3 featured repos; a token
only raises that limit. Any failure (missing token, rate limit, network,
timeout) degrades gracefully to the seed project data with a "stale" badge —
it never breaks the build.

To set it locally, create a `.env` file (gitignored) based on
`.env.example` and set `GITHUB_TOKEN` to a GitHub personal access token with
no special scopes (public repo read only). On Vercel, set it as a project
Environment Variable if you want it in production builds.

## Deployment

The project uses the `@astrojs/vercel` adapter with `output: 'static'`
(`astro.config.mjs`):

```js
import vercel from '@astrojs/vercel';
// ...
output: 'static',
adapter: vercel({ webAnalytics: { enabled: false } }),
```

Note: `@astrojs/vercel` v11 no longer exports a `/static` subpath — despite
older docs/tutorials referencing `@astrojs/vercel/static`, the current
package only has the default export shown above, used together with
`output: 'static'`. This is what's actually configured in this repo.

**No custom `vercel.json` is needed** for this static output — Vercel
autodetects Astro and serves the static build directly with its CDN.

To deploy: push this repository to GitHub, then import it into Vercel
(vercel.com → New Project → import the GitHub repo). Vercel will detect the
Astro preset automatically and run `npm run build`. This repository does not
yet have a GitHub remote configured — pushing to GitHub and connecting the
Vercel project are manual steps to do once you're ready to go live; nothing
in this repo needs to change to support that flow.

### Before going live: set the real production domain

**`astro.config.mjs` currently has a placeholder `site` value:**

```js
// astro.config.mjs, line 11
site: 'https://personal-website-placeholder.vercel.app',
```

**Replace it with the real production domain as soon as one is purchased or
decided.** This single value regenerates hreflang tags, the sitemap, Open
Graph absolute URLs, and JSON-LD `url` fields correctly across all three
locales — no other code changes are needed. Forgetting this step ships
incorrect absolute URLs in SEO metadata.
