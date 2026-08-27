# Tasks: Fix site-wide 404s; document `/admin` + Contact env setup

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~110-150 (helper ~20, test ~25, 9 call-site files ~60-100 across ~21 call sites + 9 import swaps) |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | `localePath` builder + `switchLocalePath` refactor + all 9 call-site repoints + `getAbsoluteLocaleUrl` investigation | PR 1 (single) | `npx vitest run src/lib/locale-path.test.ts` | `npm run dev`, click through 5 locales x nav + language switcher + cards | `src/lib/locale-path.ts` + its test + 9 call-site files; revert commit restores direct `getRelativeLocaleUrl` calls |

## Phase 1: Foundation (URL Builder)

- [x] 1.1 Add `localePath(locale, path='')` to `src/lib/locale-path.ts`: strip leading/trailing slashes, always return `/${locale}/` or `/${locale}/${clean}/`.
- [x] 1.2 Refactor `switchLocalePath` to strip the current prefix from `currentPath` then delegate to `localePath(target, rest)`; drop the `astro:i18n` import.
- [x] 1.3 Add `localePath` cases to `src/lib/locale-path.test.ts`: `es` prefixed, empty path, nested path, no double slashes; keep existing `switchLocalePath` cases green.
- [x] 1.4 Run `npx vitest run src/lib/locale-path.test.ts`; confirm green.

## Phase 2: Call-Site Repoints

- [x] 2.1 `Header.astro`: swap `getRelativeLocaleUrl` import → `localePath`; update its 3 call sites.
- [x] 2.2 `Hero.astro`: same swap; 2 call sites.
- [x] 2.3 `AuthorByline.astro`: same swap; 2 call sites (home link `''` → `localePath(locale)`).
- [x] 2.4 `BlogCard.astro`: same swap; 2 call sites.
- [x] 2.5 `[locale]/index.astro`: same swap; 5 call sites.
- [x] 2.6 `[locale]/projects.astro`: same swap; 2 call sites.
- [x] 2.7 `[locale]/projects/[...slug].astro`: same swap; 2 call sites.
- [x] 2.8 `[locale]/blog/[...slug].astro`: same swap; 3 call sites.
- [x] 2.9 Confirm `LanguageSelector.astro` needs no edit — the fix lands via Phase 1's `switchLocalePath`.

## Phase 3: `getAbsoluteLocaleUrl` Investigation

- [x] 3.1 Inspect built `SeoHead.astro`/`Hreflang.astro` output for `es`: does the canonical / `hreflang="es"` URL include the `/es/` prefix?
- [x] 3.2 If missing: add a minimal `localeUrlAbsolute(locale, path)` (site + `localePath`) and repoint both files — small, separate follow-up, not bundled into Phase 2's diff.

## Phase 4: Verification

- [x] 4.1 Click-through 5 locales (`es/en/de/fr/ru`): nav links, language switcher (incl. switching back to `es`), project/blog cards — confirm no 404s.
- [x] 4.2 On `/es/projects/{slug}/` and `/es/blog/{slug}/`, follow the back-link/prev-next links — confirm `/es/`-prefixed destinations resolve.
- [x] 4.3 Run `npm run build` — confirm it completes without errors.
- [x] 4.4 Run `npm test` (`vitest run`) — confirm all suites pass.

## Summary

**Confirmed broken** (not the same code path but the same root cause). `getAbsoluteLocaleUrl` calls Astro's internal `getLocaleRelativeUrl` under the hood, which under `routing:'manual'` (strategy `"manual"`) only pushes the locale segment when `locale !== defaultLocale` — so `es` (the default locale) got no `/es/` prefix in absolute URLs too, same as the `getRelativeLocaleUrl` defect already fixed elsewhere. Verified with a real `astro build`: before the fix, `es` canonical/hreflang URLs were missing the `/es/` prefix. Fixed by adding `localeUrlAbsolute(locale, path)` helper to `src/lib/locale-path.ts` and repointing `SeoHead.astro` and `Hreflang.astro` to use it.

All 21 call sites across 9 component/page files refactored from `getRelativeLocaleUrl` → `localePath`. Tests all pass (54 tests in 363ms). Build completes successfully with no errors.
