# Proposal: Fix site-wide 404s; document `/admin` + Contact env setup

## Intent

Every internal link generated via `getRelativeLocaleUrl('es', …)` renders unprefixed (`/about` instead of `/es/about`) and 404s, because `i18n.routing: 'manual'` cannot prefix the default locale (Astro bug #11355). This breaks all nav, the language switcher's own ES link, and every card/CTA on `/es/*` — the majority locale. Two other reported issues (`/admin` "vercel_token", "Contactar no funciona") are **not code defects**: both features are implemented and tested; they fail only because production environment variables are unset. This change fixes the 404 root cause in code and documents the env setup the user must perform themselves.

## Scope

### In Scope
- **404 fix (code):** a local URL builder in `src/lib/locale-path.ts` that always prefixes every locale including `es`; repoint all ~10 `getRelativeLocaleUrl` call sites to it.
- **Runbook (docs, not apply-phase code):** explicit Vercel-dashboard env checklist for `/admin` (`ADMIN_USER`, `ADMIN_PASSWORD`, `VERCEL_API_TOKEN`) and Contact (`DATABASE_URL`, `RESEND_API_KEY`, Blob token) + running `scripts/_setup-contact-table.mjs` once against prod, then redeploy.

### Out of Scope
- Changing the i18n routing strategy (keep `routing: 'manual'`).
- Switching CI/analytics providers or adding an env-management tool.
- Any `/admin` or Contact code change beyond a cheap error-message clarification if one is identified during design.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `i18n-routing`: internal links MUST resolve for every locale including the default `es`, which under `routing: 'manual'` requires explicit prefixing rather than `getRelativeLocaleUrl`.

## Approach

Extend the existing `locale-path.ts` wrapper (already the house pattern for i18n URL helpers) with a builder that prefixes all locales, then swap ~10 call sites from direct `getRelativeLocaleUrl` to the helper. Root-cause, single-point fix; sibling callers stop breaking with one guard. `/admin` and Contact need no apply-phase tasks — only the user-action runbook, since no tool this session can read or write Vercel env vars.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/lib/locale-path.ts` | Modified | Add always-prefix URL builder |
| `Header.astro`, `Hero.astro`, `AuthorByline.astro`, `BlogCard.astro`, `LanguageSelector.astro` | Modified | Use helper |
| `[locale]/index.astro`, `[locale]/projects.astro`, `[locale]/projects/[...slug].astro`, `[locale]/blog/[...slug].astro` | Modified | Use helper |
| `admin.astro`, `api/contact.ts` | Unchanged | Env-config only; runbook, not code |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Fix touches every page's nav | High | Full click-through: 5 locales × nav + switcher + cards before merge |
| Env state on Vercel unconfirmed | High | Runbook lists exact vars; user verifies/sets + redeploys |
| Free-tier 100-deploys/day cap (hit before) | Med | Batch the 404 fix into a single deploy |

## Rollback Plan

Isolated to `locale-path.ts` + call-site imports. Revert the commit; direct `getRelativeLocaleUrl` behavior returns. No data or schema changes.

## Dependencies

- User must set Vercel env vars and run the DB setup script (out-of-band; blocks `/admin` + Contact only, not the 404 fix).

## Success Criteria

- [ ] All internal links on `/es/*` resolve (no 404), including the language switcher's ES link.
- [ ] `en/de/fr/ru` links still resolve.
- [ ] `npm run build` and `npm test` pass.
- [ ] Runbook documents the exact env vars + setup-script step for `/admin` and Contact.
