# Delta for blog

## ADDED Requirements

### Requirement: Markdown Authoring with Syntax Highlighting
Blog posts MUST be authored in Markdown and fenced code blocks MUST render with syntax highlighting.

#### Scenario: Fenced code block renders highlighted
- GIVEN a post contains a ` ```python ` fenced block
- WHEN the post page renders
- THEN the code block displays with language-appropriate syntax highlighting

### Requirement: Auto TOC and Reading Time
Each post page MUST generate a table of contents from its headings and display a computed reading time; neither is stored in frontmatter.

#### Scenario: Long post shows sticky TOC and reading time
- GIVEN a post with multiple `##`/`###` headings
- WHEN viewed on a wide screen
- THEN a sticky TOC sidebar lists the headings
- AND a reading-time estimate (e.g. "7 min") appears near the title

### Requirement: Client-Side Tag Filter
The blog index MUST offer tag filter chips that filter posts client-side. The system MUST NOT create dedicated `/blog/tags/[tag]/` routes.

#### Scenario: Filtering by a tag
- GIVEN the blog index lists posts tagged IA, Data Engineering, BIM, etc.
- WHEN a visitor clicks the "IA" chip
- THEN only posts tagged IA remain visible without a page navigation
- AND no `/blog/tags/ia/` route exists

### Requirement: Launch Seed Posts
At launch, the blog MUST include these 6 seed posts (ES at minimum) with their tags:
1. "Del concreto reforzado al gradiente descendente…" — Carrera, IA
2. "De planos a pipelines…" — BIM, Data Engineering
3. "Modelos espaciotemporales de riesgo…" — Data Engineering, Geointeligencia
4. "RAG para normativa técnica…" — IA, BIM
5. "Geointeligencia con GCP…" — Geointeligencia, Data Engineering
6. "Soberanía de datos…" — IA, Carrera

#### Scenario: Blog index is not empty at launch
- GIVEN the ES blog index at launch
- WHEN it renders
- THEN all 6 seed posts are listed, newest first, each with its declared tags
