# Design: Fix site-wide 404s; document `/admin` + Contact env setup

## Technical Approach

Userland URL-building fix on a static Astro site running `i18n.routing: 'manual'`
(`defaultLocale: 'es'`, locales `es/en/de/fr/ru`, all pages under an explicit
`[locale]` segment). Root cause: `getRelativeLocaleUrl('es', path)` emits an
**unprefixed** path (`/about` instead of `/es/about`) under manual routing
(withastro/astro#11355), so every `es` link 404s. Fix is a single-point one:
replace the direct `getRelativeLocaleUrl` calls with a pure, always-prefixing
string builder in the existing `src/lib/locale-path.ts` house helper, then
repoint the 9 call-site files. No config, routing-strategy, or dependency
change. `/admin` and Contact are env-config only — no apply-phase code — and
are handled by a runbook (separate deliverable), not this design.

`routing: 'manual'` stays exactly as-is: it was added deliberately (commit
`94dcc89`) to stop Astro's auto i18n middleware from 404ing on-demand routes
like `/admin`. The bug is in how we *build* URLs, not how we route them.

## Architecture Decisions

### Decision: A pure string builder `localePath(locale, path?)` — NOT a wrapper over `getRelativeLocaleUrl`

**Choice**: Add to `src/lib/locale-path.ts`:
```ts
export function localePath(locale: Locale, path = ''): string {
  const clean = path.replace(/^\/+|\/+$/g, '');
  return clean ? `/${locale}/${clean}/` : `/${locale}/`;
}
```
Signature is call-compatible with `getRelativeLocaleUrl(locale, path)` (locale
first, logical path second), so the migration is a near-mechanical swap.

**Alternatives**:
- *Wrap `getRelativeLocaleUrl` and force-prefix `es`* — still couples us to the
  exact quirk we're routing around; would need a special-case branch for `es`
  and continue depending on Astro's manual-routing prefixing behavior.
- *`vercel.json` rewrite `/about → /es/about`* — treats the symptom (bad URL
  reaching the server) not the cause (bad URL being generated); adds a new
  config surface; and does **not** fix the language switcher's own broken `es`
  self-link, which is generated client-visible markup, not a server hit.

**Rationale**: A pure builder guarantees a correct prefix for *every* locale by
construction, independent of Astro's ambiguous manual-routing output. It also
severs `locale-path.ts`'s dependency on `astro:i18n` entirely, which means the
unit test (run under `getViteConfig`) now asserts the **real** production string
rather than whatever the virtual `astro:i18n` module returns in the test env —
today's test passes while production 404s precisely because those two
environments disagree. Output is byte-compatible with the current
`getRelativeLocaleUrl` result for non-`es` locales: trailing slash preserved
(`/en/about/`, `/en/`), matching the existing `switchLocalePath` test
expectations and the site's generated directory-style URLs.

### Decision: Refactor `switchLocalePath` to delegate to `localePath`

**Choice**: Drop `switchLocalePath`'s own `getRelativeLocaleUrl(target, rest)`
call; route it through the new builder:
```ts
export function switchLocalePath(currentPath: string, target: Locale): string {
  const rest = currentPath.replace(/^\/(es|en|de|fr|ru)(?=\/|$)/, '');
  return localePath(target, rest);
}
```
`localePath` strips the leading/trailing slashes of `rest`, so `/es/` → `''` →
`/en/` and `/es/about/` → `about` → `/en/about/`. The existing test file is
unchanged and still green — but now faithful.

**Rationale**: This is the language switcher's own path (`LanguageSelector.astro`
in Header + Footer). Under the bug its "ES" link was itself unprefixed from
every locale. Fixing it via the shared builder is the root-cause, one-diff fix —
the same guard covers the switcher and every sibling caller. The `astro:i18n`
import is removed from the file after this.

### Decision: Keep the helper trailing-slash-emitting; no `aria-current` change needed

`localePath` emits a trailing slash. `Header.astro`'s active-link test
(`currentPath.startsWith(item.href)`) then compares `/es/about/` against
`Astro.url.pathname` (`/es/about/`) and matches — whereas under the bug the `es`
href was `/about`, which never prefix-matched `/es/about/`, so `aria-current`
silently never fired on the default locale. Fixed as a free side-effect; no
Header logic edit required.

### Decision: `getAbsoluteLocaleUrl` call sites are OUT of scope — verify, don't pre-fix

`SeoHead.astro` and `Hreflang.astro` use `getAbsoluteLocaleUrl` (absolute
canonical/hreflang), not `getRelativeLocaleUrl`. These may share the same
`es`-unprefixed defect, but that produces a wrong-canonical **SEO** issue, not a
reported 404, and the proposal scoped them out. **Do not** build an absolute
sibling helper speculatively (YAGNI). Instead, apply-phase verification inspects
the built `<link rel="alternate" hreflang="es">` / canonical for a `/es/`
prefix; only if confirmed broken does a follow-up add `localeUrlAbsolute` using
`site` + `localePath`. Documented as an open item, not built now.

## Data Flow

    logical route ("about", "blog/{slug}", "")
        │
        ├─ nav/CTA/card call site ─→ localePath(locale, route) ─→ "/es/about/"  ✓ (was "/about" ✗)
        │
        └─ LanguageSelector ─→ switchLocalePath(currentPath, target)
                                    │  strip current prefix
                                    └─→ localePath(target, rest) ─→ "/en/about/"

## File Changes

| File | Action | Change |
|------|--------|--------|
| `src/lib/locale-path.ts` | Modify | Add `localePath`; refactor `switchLocalePath` to use it; drop `astro:i18n` import |
| `src/lib/locale-path.test.ts` | Modify | Add direct `localePath` cases (`es` prefixed, empty path, nested, no double slash); existing `switchLocalePath` cases unchanged |
| `src/components/Header.astro` | Modify | `getRelativeLocaleUrl` → `localePath` (lines 2, 13, 20) |
| `src/components/Hero.astro` | Modify | idem (2, 44) |
| `src/components/AuthorByline.astro` | Modify | idem (8, 14; `''` arg → `localePath(locale)`) |
| `src/components/BlogCard.astro` | Modify | idem (2, 26) |
| `src/pages/[locale]/index.astro` | Modify | idem (8, 64, 72, 78, 88) |
| `src/pages/[locale]/projects.astro` | Modify | idem (12, 49) |
| `src/pages/[locale]/projects/[...slug].astro` | Modify | idem (8, 55) |
| `src/pages/[locale]/blog/[...slug].astro` | Modify | idem (12, 83–85) |
| `astro.config.mjs` | **Unchanged** | `routing: 'manual'` stays |
| `src/i18n/index.ts` | **Unchanged** | still re-exports `getRelative/AbsoluteLocaleUrl` for any residual/absolute use |
| `admin.astro`, `api/contact.ts` | **Unchanged** | env-config only → runbook |

`LanguageSelector.astro` needs **no** call-site edit — it already imports from
`locale-path.ts`; the fix lands inside `switchLocalePath`.

## Interfaces / Worked Examples

Mechanical migration per call-site file (identical arg order → find/replace):
```diff
- import { getRelativeLocaleUrl } from 'astro:i18n';
+ import { localePath } from '<rel>/lib/locale-path';
  ...
- href={getRelativeLocaleUrl(locale, 'projects')}
+ href={localePath(locale, 'projects')}
- getRelativeLocaleUrl(locale, '')          // Header brand, AuthorByline home
+ localePath(locale)                        // or localePath(locale, '')
```
Relative import depth: `src/components/*` → `../lib/locale-path`;
`src/pages/[locale]/*` → `../../lib/locale-path`;
`src/pages/[locale]/**/[...slug]` → `../../../lib/locale-path`.

Byte-for-byte expected outputs (all locales, prefix guaranteed):
`localePath('es','about') → /es/about/` · `localePath('en','') → /en/` ·
`localePath('de','blog/rag-nsr-10') → /de/blog/rag-nsr-10/` · leading/trailing
slashes in the arg collapse (no `//`).

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| Unit (vitest) | `localePath` prefixes every locale incl. `es`; empty/nested/slash-normalization | New assertions in `locale-path.test.ts`; now runs without needing `astro:i18n` |
| Unit (vitest) | `switchLocalePath` unchanged behavior | Existing cases stay green |
| Build | Every page + all internal hrefs emit | `npm run build` (mandatory in apply, never in design/exploration) |
| Manual | 5 locales × primary nav + language switcher (incl. its own ES link) + project/blog cards resolve (no 404) | Preview click-through per proposal risk table |

## Threat Matrix

N/A for the code change — pure string construction, no auth, shell, subprocess,
VCS automation, or user input. `localePath`'s only argument is a typed `Locale`
plus first-party logical routes. The security-relevant surface (`/admin` Basic
Auth, Contact DB/Resend/Blob) is untouched code; its exposure is entirely the
env-var configuration state covered by the runbook, out of this design's code
scope.

## Migration / Rollout

Small, single-batch diff (~9 call-site files + helper + test), well under the
400-line review threshold → one PR, one deploy (respects the free-tier
100-deploys/day cap hit previously). Rollback = revert the commit; direct
`getRelativeLocaleUrl` behavior returns, no data/schema impact. The `/admin` +
Contact env runbook ships as docs alongside, requiring the user's own Vercel
dashboard/CLI access (no session tool can read or write those env vars).

## Open Questions

- [ ] Apply-phase: inspect built `hreflang`/canonical output for a missing
  `/es/` prefix from `getAbsoluteLocaleUrl`. If broken, follow-up adds an
  absolute sibling helper; if correct, close with no change (YAGNI).
