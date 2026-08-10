# Delta for seo-accessibility-perf

## ADDED Requirements

### Requirement: Search Engine Metadata
Every page MUST emit OG metadata, the site MUST publish `sitemap.xml` covering all locale routes and `robots.txt`, and Home/About MUST include JSON-LD `Person` schema.

#### Scenario: Sitemap covers all locales
- GIVEN the site builds
- WHEN `sitemap.xml` is generated
- THEN it lists routes for `es`, `en`, and `de`

#### Scenario: Person schema present
- GIVEN a crawler requests `/es/about/`
- WHEN the page HTML is parsed
- THEN a `<script type="application/ld+json">` block with `@type: Person` is present

### Requirement: Accessibility Compliance
The site MUST meet WCAG AA contrast, support full keyboard navigation, use correct ARIA roles/labels on interactive components, and respect `prefers-reduced-motion` by disabling non-essential animation, including View Transitions.

#### Scenario: Reduced motion disables transitions
- GIVEN a visitor's OS has `prefers-reduced-motion: reduce`
- WHEN they navigate between pages
- THEN View Transitions and other decorative animations are skipped

#### Scenario: Timeline accordion is keyboard-operable
- GIVEN the Experience early-accordion is collapsed
- WHEN a keyboard-only user tabs to it and presses Enter/Space
- THEN it expands and focus remains logically placed

### Requirement: Theme Mode
The site MUST default to the visitor's OS color scheme and MUST offer a manual dark/light toggle whose choice persists across page loads.

#### Scenario: Manual override persists
- GIVEN a visitor toggles to dark mode
- WHEN they navigate to another page or reload
- THEN dark mode remains active

### Requirement: Performance Budget and Image Optimization
The site MUST target Lighthouse ≥95 across Performance, Accessibility, Best Practices, and SEO, and all raster images MUST be processed through `astro:assets` for responsive/optimized output.

#### Scenario: Lighthouse run meets target
- GIVEN a production build of Home
- WHEN audited with Lighthouse
- THEN all four category scores are ≥95

#### Scenario: Images are optimized
- GIVEN a blog post includes a `heroImage`
- WHEN the page builds
- THEN the image is served via `astro:assets` with responsive sizing, not a raw unoptimized `<img>`
