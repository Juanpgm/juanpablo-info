# Delta for i18n-routing

## ADDED Requirements

### Requirement: Locale Prefixing
The system MUST configure Astro i18n with `defaultLocale: 'es'`, `locales: ['es','en','de']`, and `routing.prefixDefaultLocale: true`, so every locale — including the default — is URL-prefixed.

#### Scenario: Default locale is prefixed
- GIVEN a visitor requests the site root
- WHEN Astro resolves the route
- THEN the canonical Home URL is `/es/`, not `/`
- AND `/en/` and `/de/` serve the equivalent page tree

### Requirement: DE Fallback to EN
Untranslated German content, especially blog posts, MUST silently rewrite to the English version instead of Spanish, using `fallback: { de: 'en' }` with `fallbackType: 'rewrite'`.

#### Scenario: DE visitor requests untranslated blog post
- GIVEN a blog post exists in `es` and `en` but not `de`
- WHEN a visitor navigates to `/de/blog/{slug}/`
- THEN the English content renders at the `/de/` URL
- AND no "coming soon" banner or redirect is shown

### Requirement: Hand-Built Hreflang
Every page MUST emit `<link rel="alternate" hreflang="...">` tags for `es`, `en`, `de`, and `x-default` from a shared `<head>` component, since Astro does not generate these automatically.

#### Scenario: Any page renders the hreflang set
- GIVEN a page exists in all three locales
- WHEN the page HTML is rendered
- THEN the `<head>` contains 4 alternate links (es, en, de, x-default) pointing to the locale-equivalent URLs

### Requirement: Language Selector Preserves Path
The header/footer language selector MUST map the current page to its counterpart URL in the target locale, preserving the path rather than resetting to Home.

#### Scenario: Switching locale from a deep page
- GIVEN a visitor is on `/es/experience/`
- WHEN they select "EN" from the language selector
- THEN they land on `/en/experience/`, not `/en/`

### Requirement: Stable English URL Segments
Path segments (`about`, `experience`, `projects`, `blog`) MUST remain in English across all locales, permanently — this is a final decision, not a v1 placeholder.

#### Scenario: DE route uses the English segment
- GIVEN the About page
- WHEN viewed in German
- THEN the URL is `/de/about/`, never `/de/ueber-mich/`
