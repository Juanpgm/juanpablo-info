# Delta for seo-accessibility-perf

## MODIFIED Requirements

### Requirement: Search Engine Metadata
Every page MUST emit OG metadata, the site MUST publish `sitemap.xml` covering all locale routes and `robots.txt`, and Home/About MUST include JSON-LD `Person` schema. Every blog post page MUST emit a unique, per-post and per-locale `og:image`; the shared `/og/default.png` MUST NOT be used for blog post routes.
(Previously: `og:image` was never overridden per-post and every blog post rendered `/og/default.png`.)

#### Scenario: Sitemap covers all locales
- GIVEN the site builds
- WHEN `sitemap.xml` is generated
- THEN it lists routes for `es`, `en`, and `de`

#### Scenario: Person schema present
- GIVEN a crawler requests `/es/about/`
- WHEN the page HTML is parsed
- THEN a `<script type="application/ld+json">` block with `@type: Person` is present

#### Scenario: Blog post emits a unique OG image
- GIVEN a visitor requests a blog post page in any locale
- WHEN the page HTML is parsed
- THEN `og:image` points at `/og/{locale}/{slug}.png`, not `/og/default.png`

#### Scenario: Two different posts have different OG images
- GIVEN two distinct blog posts in the same locale
- WHEN their `og:image` values are compared
- THEN the URLs differ

## ADDED Requirements

### Requirement: Blog Hero Image Alt Text
Every blog post hero image MUST render with non-empty, locale-correct, informative `alt` text describing the diagram's content, sourced from `heroImageAlt` when declared.

#### Scenario: Hero image has informative alt
- GIVEN a post declares `heroImageAlt`
- WHEN the post page or a blog index card renders that hero image
- THEN the rendered `<img>` or inline SVG's accessible name equals that alt text, not an empty string

#### Scenario: Alt text matches the visitor's locale
- GIVEN an EN visitor views a post whose hero diagram was inherited via content-fallback
- WHEN the hero image alt text is read
- THEN it is in English, matching the diagram's rendered language, not the ES source locale
