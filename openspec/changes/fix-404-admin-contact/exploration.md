# Exploration: 404s site-wide, `/admin` "vercel_token" message, and "Contactar" functionality

## Current State

### 1. Site-wide 404s — one root cause, ~10 call sites

`astro.config.mjs` uses `i18n.routing: 'manual'` (added in `94dcc89` to stop Astro's automatic i18n middleware from 404ing on-demand routes like `/admin`). That mode cannot be combined with `prefixDefaultLocale` (hard Astro constraint), and a known Astro bug (withastro/astro#11355) means `getRelativeLocaleUrl(defaultLocale, path)` returns an **unprefixed** path even though every real page in this repo lives under an explicit `/es/`, `/en/`, `/de/`, `/fr/`, `/ru/` prefix (`src/pages/[locale]/*.astro`, `getStaticPaths` always emits all 5 locale params — no unprefixed route exists).

`defaultLocale: 'es'` is the site's default/majority locale (`src/pages/index.astro` redirects unrecognized visitors to `/es/`). Net effect: **every link generated via `getRelativeLocaleUrl('es', ...)` renders as an unprefixed path like `/about`, which has no matching route → 404**, while the same links on `/en/*`, `/de/*`, etc. resolve correctly.

Confirmed call sites (all via `astro:i18n`'s `getRelativeLocaleUrl`, directly or through `src/i18n/index.ts:45`):

- `src/components/Header.astro:2,13,20` — every primary nav link + logo/home link, every page.
- `src/lib/locale-path.ts:1,14` (used by `LanguageSelector.astro:6,23`, in Header and Footer) — **the language switcher itself** 404s its own "ES" link from every locale, every page.
- `src/components/Hero.astro:13,44` — home "Experience" CTA.
- `src/pages/[locale]/index.astro:8,64,72,78,88` — home page's experience/projects/blog links.
- `src/pages/[locale]/projects.astro:12,49` — project listing → detail.
- `src/pages/[locale]/projects/[...slug].astro:8,55` — project detail → back link.
- `src/pages/[locale]/blog/[...slug].astro:12,83-85` — blog prev/next/back.
- `src/components/BlogCard.astro:2,26` — blog card links.
- `src/components/AuthorByline.astro:8,14` — home link.

Not affected: `cvHref()` (`src/lib/cv.ts:9`, static path) and `mailto:`/external links in `Footer.astro`.

### 2. `/admin` "vercel_token" message

`src/pages/admin.astro` (`prerender = false`, no `[locale]` segment, not linked from nav/footer) has two independent env-var gates:

- **Gate 1 — browser-native HTTP Basic Auth** (`admin.astro:20-36`): gated on `ADMIN_USER`/`ADMIN_PASSWORD`. Missing either → `isAuthorized()` returns `false`, page always responds `401` + `WWW-Authenticate: Basic` — the browser's own login dialog, not page content.
- **Gate 2 — in-page Spanish error, only reached after Gate 1 passes** (`admin.astro:78-81`): if `VERCEL_API_TOKEN` is falsy, the page body literally renders `"Falta VERCEL_API_TOKEN en las variables de entorno."` — this matches the user's description ("me pide un vercel_token") far better than a Basic Auth prompt, which asks for username/password, never a token.

No `.env`/`.env.local`/`.env.example` exists in the repo (gitignored), so presence/absence on Vercel can't be confirmed from the repo. Checked live via the Vercel MCP `get_project` tool (project `prj_4NkCROVegmGYERGATxsRW4Ut6Ujp`, team `team_SzZM9UUotBq10Z80gIsZpAzv`) — that endpoint returns project metadata (domains, latest deployment) but **not env var contents/names**; there is no MCP tool in this session that lists or writes Vercel env vars, and the Vercel CLI is not installed locally. So env var state can only be confirmed/set via the Vercel dashboard or `vercel env` CLI (not runnable here).

`VERCEL_API_TOKEN` is a personal Vercel account access token — no AI agent can legitimately mint one on the user's behalf; it has to come from the user's own Vercel account (Account Settings → Tokens).

### 3. "Contactar" — fully implemented, not dead markup

Real, working feature, gated on missing config, not missing code:

- `Hero.astro` → `ContactModal.astro` (native `<dialog>`, full form, client validation) → `fetch('/api/contact', {method:'POST', body: FormData})` (`ContactModal.astro:358-418`).
- `src/pages/api/contact.ts` (`prerender = false`) re-validates via `src/lib/contact-form.ts` (unit-tested), uploads attachments to Vercel Blob, inserts into Postgres via `@neondatabase/serverless`, sends notification email via Resend.
- `scripts/_setup-contact-table.mjs` is a one-off script that creates the `contact_submissions` table — must be run once against the real `DATABASE_URL` before the table exists.

Env vars, all unconfirmed from the repo (same blind spot as above):
- `DATABASE_URL` (Neon) — **hard-required**; missing → immediate `500` (`api/contact.ts:105-110`), form fails outright.
- `RESEND_API_KEY` — soft-required; missing just skips the email silently, submission still succeeds.
- Vercel Blob token (`BLOB_READ_WRITE_TOKEN`, auto-injected if a Blob store is linked) — failure here only drops the attachment, doesn't fail the submission.

Most likely explanation for "Contactar no funciona": `DATABASE_URL` not set and/or `contact_submissions` table never created (setup script never run against prod).

## Affected Areas

- `astro.config.mjs:17-28` — i18n root cause.
- `src/lib/locale-path.ts`, `LanguageSelector.astro`, `Header.astro`, `Hero.astro`, `AuthorByline.astro`, `BlogCard.astro`, `[locale]/index.astro`, `[locale]/projects.astro`, `[locale]/projects/[...slug].astro`, `[locale]/blog/[...slug].astro` — every `getRelativeLocaleUrl` call site.
- `src/pages/admin.astro:47-103` — env-gated Basic Auth + Analytics API call.
- `src/pages/api/contact.ts`, `scripts/_setup-contact-table.mjs` — contact backend + one-off DB setup.
- No `vercel.json`, no `.env.example`, no MCP/CLI tool available this session to read or write Vercel project env vars.

## Approaches (404 fix)

1. **Extend `src/lib/locale-path.ts` with a local URL builder that always prefixes every locale including `es`**, and repoint all ~10 call sites to it instead of calling `getRelativeLocaleUrl` directly.
   - Pros: fixes the root cause once; matches the existing pattern (`locale-path.ts` already wraps Astro's i18n helpers); small mechanical diff.
   - Cons: touches ~10 files (import + call swap).
   - Effort: Low.
2. **Add a `vercel.json` rewrite from unprefixed paths to `/es/...`.**
   - Pros: zero app-code changes.
   - Cons: treats the symptom (bad URL reaching the server) not the cause (bad URL being generated); adds a new config surface; doesn't fix the language switcher's own bad self-links.
   - Effort: Low-Medium, wrong layer.

**Recommendation:** Approach 1.

For `/admin` and "Contactar": no code defect beyond what's already correctly implemented. The deliverable is a minimal, explicit checklist of Vercel env vars to verify/set (`ADMIN_USER`, `ADMIN_PASSWORD`, `VERCEL_API_TOKEN`, `DATABASE_URL`, `RESEND_API_KEY`, Blob store token) plus running `scripts/_setup-contact-table.mjs` once against production — all of which require the user's own Vercel dashboard/CLI access, since no available tool in this session can read or write those values.

## Risks

- The 404 fix touches every page's navigation — needs a full click-through (5 locales × nav + language switcher + card links) before merging.
- `VERCEL_API_TOKEN` cannot be generated by an agent — resolving area 2 fully needs the user to supply/set it themselves.
- `DATABASE_URL`/`RESEND_API_KEY`/Blob token are equally out of reach without the user's input; no MCP tool this session can list or set Vercel env vars, and the Vercel CLI isn't installed locally.
- Free-tier cap of 100 deploys/day was hit previously — batch the 404 fix into as few deploys as possible.
- Could not confirm which env vars are already set on Vercel — propose/apply should treat "confirm current env var state" as an explicit prerequisite step, not an assumption.

## Ready for Proposal

Yes — the 404 root cause is confirmed with code + Astro issue-tracker evidence; `/admin` and "Contactar" are both fully mapped to missing environment configuration rather than missing code.
