# Delta for content-model

## MODIFIED Requirements

### Requirement: Blog Content Collection
The `blog` Content Collection MUST be Markdown-based, loaded per-locale via `glob()`, and validated with a zod schema: `title, description, pubDate, updatedDate?, tags[], heroImage?, heroImageAlt?, heroImageCaption?, draft`. `heroImageAlt` and `heroImageCaption` MUST be optional, per-locale, translatable strings independent of the image asset itself.
(Previously: schema had no `heroImageAlt`/`heroImageCaption` fields.)

#### Scenario: Valid post passes schema
- GIVEN a Markdown file in `src/content/blog/es/`
- WHEN it declares `title`, `description`, `pubDate`, and `tags`
- THEN it validates against the collection schema and is queryable by locale

#### Scenario: Post declares alt text and caption
- GIVEN an EN post frontmatter sets `heroImageAlt` and `heroImageCaption`
- WHEN the collection is parsed
- THEN both fields validate as optional strings and are available to the rendering layer

#### Scenario: Post omits alt/caption
- GIVEN a post frontmatter does not set `heroImageAlt` or `heroImageCaption`
- WHEN the collection is parsed
- THEN the post still validates (fields remain optional) and downstream rendering falls back to existing behavior

### Requirement: Static Typed Data
Skills (`ai[]`/`civil[]`), education, certifications, and the projects seed (name, repo?, stack[], isExample) MUST be static typed data files (e.g. `src/data/*.ts`), not Content Collections.

#### Scenario: Skills data drives the two-worlds section
- GIVEN `src/data/skills.ts` exports `ai[]` and `civil[]`
- WHEN the Home Skills section renders
- THEN both columns populate from that static data with i18n labels

## ADDED Requirements

### Requirement: Hero Diagram Locale Variant Convention
For each blog hero diagram asset, `src/assets/blog/` MUST contain a Spanish-labeled file (`{slug}.svg`) and MAY contain an English-labeled variant (`{slug}.en.svg`). ES post frontmatter `heroImage` MUST reference `{slug}.svg`; EN post frontmatter `heroImage` MUST reference `{slug}.en.svg` when it exists.

#### Scenario: EN post references the English variant
- GIVEN a post exists at `src/content/blog/en/{slug}.md`
- WHEN its frontmatter sets `heroImage`
- THEN it points at `src/assets/blog/{slug}.en.svg`, not the ES-labeled `{slug}.svg`

#### Scenario: DE/FR/RU inherit the EN variant
- GIVEN no `src/content/blog/{de,fr,ru}/{slug}.md` file exists
- WHEN the content-fallback merge resolves the post for `de`, `fr`, or `ru`
- THEN it inherits the EN entry's `heroImage`, showing the English-labeled diagram, not the Spanish one
