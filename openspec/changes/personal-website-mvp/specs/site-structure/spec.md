# Delta for site-structure

## ADDED Requirements

### Requirement: Route List
The system MUST provide these routes per locale: Home (`/{locale}/`), About (`/{locale}/about/`), Experience (`/{locale}/experience/`), Projects (`/{locale}/projects/`), Blog index (`/{locale}/blog/`), Blog post (`/{locale}/blog/{slug}/`).

#### Scenario: Full route tree exists per locale
- GIVEN the site is built
- WHEN routes are enumerated for `es`, `en`, `de`
- THEN each locale has Home, About, Experience, Projects, Blog index, and Blog post routes
- AND no locale is missing a route (DE blog posts may resolve via the i18n-routing fallback)

### Requirement: Home Section Order
Home MUST render sections in this order: Hero, About summary, Skills two-worlds, Featured experience, Featured projects, Latest posts, Contact.

#### Scenario: Home page structure
- GIVEN a visitor loads `/es/`
- WHEN the page renders
- THEN sections appear top-to-bottom: Hero → About summary → Skills → Featured experience → Featured projects → Latest posts → Contact

### Requirement: Contact Has No Dedicated Route
Contact information MUST appear only as the Home closing section and the persistent footer. The system MUST NOT expose a `/contact` route.

#### Scenario: No contact route exists
- GIVEN the full route list
- WHEN checked for a contact page
- THEN no `/{locale}/contact/` route exists
- AND email + LinkedIn remain reachable from Home's Contact section and the footer

### Requirement: Global Chrome
Every page MUST render a shared header (name/logo, nav to About/Experience/Projects/Blog, language selector, theme toggle, CV download link) and footer (email, LinkedIn, location, copyright, language selector).

#### Scenario: Chrome present on a non-Home page
- GIVEN a visitor is on `/en/projects/`
- WHEN the page loads
- THEN the header nav and footer contact links are present and functional
