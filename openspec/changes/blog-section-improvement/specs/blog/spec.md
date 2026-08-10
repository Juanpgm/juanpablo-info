# Delta for blog

## ADDED Requirements

### Requirement: Locale-Correct Hero Diagram Rendering
Each blog post's rendered hero diagram MUST display labels/text in the visitor's resolved content locale. English, German, French, and Russian readers MUST see the English-labeled diagram; Spanish readers MUST see the Spanish-labeled diagram.

#### Scenario: EN reader sees English diagram
- GIVEN a visitor views an EN blog post
- WHEN the hero diagram renders
- THEN all diagram text/labels are in English

#### Scenario: DE reader sees English diagram via fallback
- GIVEN a visitor views a DE blog post with no DE-authored content file
- WHEN the hero diagram renders
- THEN it shows the English-labeled diagram inherited via content-fallback, not the Spanish one

### Requirement: Theme-Aware Hero Diagram Rendering
Hero diagrams MUST render correctly in both light and dark theme, adapting ink/line/accent colors to the active theme without becoming an unreadable light rectangle on dark backgrounds.

#### Scenario: Dark mode diagram remains legible
- GIVEN a visitor has dark mode active
- WHEN a post page with a hero diagram renders
- THEN the diagram background is transparent and its strokes/text use theme-appropriate colors, not a light rectangle

#### Scenario: Toggling theme updates the diagram
- GIVEN a post page is open in light mode
- WHEN the visitor switches to dark mode
- THEN the hero diagram's colors update to match without a page reload

### Requirement: Hero Figure and Caption
Each post's hero diagram MUST render inside a `<figure>` element. When the post declares `heroImageCaption`, the figure MUST include a `<figcaption>` with that text.

#### Scenario: Caption renders when declared
- GIVEN a post frontmatter sets `heroImageCaption`
- WHEN the post page renders
- THEN the hero `<figure>` includes a `<figcaption>` with that caption text

#### Scenario: No caption when undeclared
- GIVEN a post frontmatter does not set `heroImageCaption`
- WHEN the post page renders
- THEN the hero `<figure>` renders without a `<figcaption>` element

## MODIFIED Requirements

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
