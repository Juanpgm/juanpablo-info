# Delta for i18n-routing

## MODIFIED Requirements

### Requirement: Locale Prefixing
Under `i18n.routing: 'manual'`, the system MUST NOT rely on Astro's built-in `getRelativeLocaleUrl` for generating internal links, because it cannot prefix the default locale in manual mode (Astro issue #11355). Instead, every internal link generated anywhere in the site MUST be built through a locale-aware URL builder that always prefixes the locale segment, including the default locale (`es`), so the resulting URL matches an existing route.

#### Scenario: Default-locale link is prefixed
- GIVEN a page renders an internal link for the `es` locale
- WHEN the link URL is generated
- THEN the URL includes the `/es/` prefix (e.g. `/es/about/`), not an unprefixed path (e.g. `/about/`)

#### Scenario: Non-default locale links are unchanged
- GIVEN a page renders an internal link for `en`, `de`, `fr`, or `ru`
- WHEN the link URL is generated
- THEN the URL includes that locale's prefix exactly as before this change

#### Scenario: Routing configuration is untouched
- GIVEN this change is applied
- WHEN `astro.config.mjs` is inspected
- THEN `i18n.routing` still reads `'manual'`

## ADDED Requirements

### Requirement: Site-Wide Link Resolvability
Every internal link produced by any component or page (navigation, hero CTAs, cards, byline, prev/next, back-links) MUST resolve to an existing route (no 404) for every supported locale, including the default locale.

#### Scenario: Home page links resolve on the default locale
- GIVEN a visitor is on `/es/`
- WHEN they follow any nav link, hero CTA, or card link rendered on that page
- THEN the destination URL responds successfully, not with a 404

#### Scenario: Nested dynamic routes resolve on the default locale
- GIVEN a visitor is on an `/es/projects/{slug}/` or `/es/blog/{slug}/` detail page
- WHEN they follow the back-link or a prev/next link
- THEN the destination URL is prefixed with `/es/` and resolves successfully

#### Scenario: Root path link resolves on the default locale
- GIVEN a link targets the site root for the `es` locale
- WHEN the link is generated
- THEN it points to `/es/`, not `/`

### Requirement: Language Switcher Resolvability
The language switcher MUST link to a resolvable URL for every locale option it offers, including when switching back to the default locale (`es`) from any other locale.

#### Scenario: Switching to the default locale from a non-default locale
- GIVEN a visitor is on `/en/experience/`
- WHEN they select "ES" from the language switcher
- THEN they land on `/es/experience/`, not a 404

#### Scenario: Switching between two non-default locales
- GIVEN a visitor is on `/en/projects/{slug}/`
- WHEN they select "DE" from the language switcher
- THEN they land on `/de/projects/{slug}/` exactly as before this change
