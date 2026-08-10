# Delta for content-model

## ADDED Requirements

### Requirement: Blog Content Collection
The `blog` Content Collection MUST be Markdown-based, loaded per-locale via `glob()`, and validated with a zod schema: `title, description, pubDate, updatedDate?, tags[], heroImage?, draft`.

#### Scenario: Valid post passes schema
- GIVEN a Markdown file in `src/content/blog/es/`
- WHEN it declares `title`, `description`, `pubDate`, and `tags`
- THEN it validates against the collection schema and is queryable by locale

### Requirement: Experience Content Collection
The `experience` Content Collection MUST use schema `company, role, location, startDate, endDate?, current, group ('recent'|'early'), highlights[], stack[], featured`, with NO `image` field.

#### Scenario: Teatrino entry has no image field
- GIVEN the Teatrino experience entry
- WHEN validated against the `experience` schema
- THEN it has no `image` property and renders as a plain text entry
- AND the timeline layout reserves no visual space for an image

### Requirement: Static Typed Data
Skills (`ai[]`/`civil[]`), education, certifications, and the projects seed (name, repo?, stack[], isExample) MUST be static typed data files (e.g. `src/data/*.ts`), not Content Collections.

#### Scenario: Skills data drives the two-worlds section
- GIVEN `src/data/skills.ts` exports `ai[]` and `civil[]`
- WHEN the Home Skills section renders
- THEN both columns populate from that static data with i18n labels

### Requirement: Build-Time GitHub Enrichment
Project cards MUST be enriched with `{stars, primaryLanguage, lastUpdated}` fetched from the GitHub API at build time only. Client-side GitHub calls are prohibited.

#### Scenario: Build enriches a real repo
- GIVEN a project seed entry has a `repoUrl`
- WHEN the site builds
- THEN the rendered card includes stars/language/last-updated fetched during that build

#### Scenario: Rate limit or missing repo degrades gracefully
- GIVEN the unauthenticated GitHub API rate limit is exhausted, or a project has `isExample: true` with no repo
- WHEN the build runs
- THEN the card renders from seed data alone, clearly marked as an example, without failing the build

### Requirement: Experience Timeline Interaction
Timeline entries MUST support expand/collapse, and entries with `group: 'early'` MUST render inside a compact accordion collapsed by default.

#### Scenario: Early experience is collapsed on load
- GIVEN the Experience page loads
- WHEN no user interaction has occurred
- THEN pre-2021/early entries are hidden inside a collapsed accordion
- AND expanding it reveals the compact entries
