# Proposal: personal-website-mvp

Portfolio + technical blog for Juan Pablo Guzmán Martínez — a trilingual
(ES/EN/DE) Astro site whose central narrative is "building bridges between the
physical world (infrastructure, territory, cities) and the world of data and AI."

This document covers **intent, scope, information architecture, conceptual
wireframes, i18n routing, and content model**. It does NOT scaffold or write
code — scaffolding is a later phase. Confirm/refine the IA here first.

---

## 1. Intent

### Problem / why now
Juan Pablo has an uncommon hybrid profile (civil engineering + AI/data science
deployed at government scale) but no owned web presence that tells that story
coherently. LinkedIn flattens the duality into a generic feed. He needs a site
that (a) makes the "two worlds converge" narrative the first thing a visitor
feels, (b) proves technical depth with real code, verifiable achievements, and a
blog, and (c) works for a trilingual audience (Colombia/LatAm in ES, international
tech recruiters in EN, German-speaking opportunities in DE).

### What success looks like
- A visitor lands and within one screen understands the dual civil-engineering /
  AI-data positioning.
- Recruiters/collaborators can scan concrete, verifiable experience (public-sector
  AI at Alcaldía de Cali, DAGMA, What Works Cities certification, BIM at scale) and
  reach out via email + LinkedIn.
- A technical blog reflects the genuine duality and demonstrates writing + depth.
- Site is fast (Lighthouse ≥95 all four, ~100 Performance), accessible (AA), and
  fully localized in three languages with correct SEO/hreflang.

### Non-goals (this change)
- No CMS, no auth, no comments, no analytics dashboard, no contact-form backend
  (email + LinkedIn only — brief specifies no phone, no form is mentioned →
  `mailto:` only, zero server).
- No runtime GitHub calls (build-time only), no e-commerce, no newsletter.
- German blog content is allowed to ship empty at launch (fallback strategy below).

---

## 2. Scope

### In scope
- Astro + Tailwind static site, `output: 'static'`, `@astrojs/vercel` adapter.
- Three fully-prefixed locales `/es/ /en/ /de/` (`prefixDefaultLocale: true`).
- Pages: Home, About, Experience (interactive timeline), Projects, Blog index +
  posts, per-locale. Skills and Contact live as sections (details below).
- Blog: Markdown, syntax highlighting, auto TOC, reading time, tags, image support.
- Projects: cards with stack badges + **build-time** GitHub API enrichment
  (stars / primary language / last update / link); 2–3 example placeholders.
- Skills "two worlds / two converging columns" visual section.
- Downloadable CV PDF (ES/EN minimum) linked from header/hero.
- Technical SEO: OG metadata, sitemap.xml, robots.txt, JSON-LD Person, clean
  per-locale URLs, hand-built hreflang.
- Accessibility AA, keyboard nav, ARIA, `prefers-reduced-motion`.
- Dark/light with system detection + manual toggle.
- README (run locally, add a post, add a translation).

### Out of scope (later or never)
- Localized URL path segments (see Open Question O1 — first slice uses stable
  English segments).
- Blog tag landing pages beyond a simple filter (O5).
- MDX / interactive embedded components (Markdown only unless a concrete need
  appears — per exploration decision).
- Any island framework beyond vanilla unless a widget proves it needs one (O3).

---

## 3. Information Architecture

### 3.1 Page structure decision
Hybrid, not pure single-page and not fully fragmented: a **rich anchored Home**
for scanning + narrative, plus **dedicated deep pages** for the content that
benefits from depth and its own SEO surface (Experience, Projects, Blog).
Skills and Contact are sections, not standalone pages.

Rationale: the two-worlds Skills block and Contact CTA are conversion/narrative
moments best kept on Home; Experience (10+ roles), Projects (grid + GitHub data),
and Blog each carry enough content and SEO value to deserve their own indexable
URL.

### 3.2 Site map (repeated per locale; `es` is default but still prefixed)

```
/es/                     Home  (Hero → About-summary → Skills two-worlds →
                               Featured experience → Featured projects →
                               Latest posts → Contact CTA)
/es/about/               Full About: narrative, education, certifications, languages
/es/experience/          Full interactive timeline (all roles + accordions)
/es/projects/            Full project grid (GitHub-enriched cards)
/es/blog/                Blog index (list + tag filter)
/es/blog/[slug]/         Blog post
/en/ … same tree …
/de/ … same tree …  (blog may be empty at launch → fallback)

Assets (not localized routes):
/cv/juan-pablo-guzman-es.pdf
/cv/juan-pablo-guzman-en.pdf
/sitemap.xml   /robots.txt   /og/*.png
```

Contact is NOT a page: it is the Home closing section + persistent footer
(email + LinkedIn). No `/contact` route needed.

### 3.3 Global chrome (all pages)
- **Header**: name/logo · nav (About, Experience, Projects, Blog) · language
  selector (ES/EN/DE, accessible, preserves current page) · theme toggle · CV
  download link.
- **Footer**: email, LinkedIn, location (Cali, VdC, Colombia), copyright, repeat
  language selector.

---

## 4. Conceptual Wireframes (text)

### 4.1 Home (`/es/`)

```
┌──────────────────────────────────────────────────────────────┐
│ JPGM        About  Experience  Projects  Blog   [ES▾] [☾] [CV]│  header (sticky)
├──────────────────────────────────────────────────────────────┤
│                                                                │
│   Juan Pablo Guzmán Martínez                                   │
│   Ingeniero Civil · Especialista en IA y Ciencia de Datos      │  HERO
│                                                                │
│   "Construyo puentes entre el mundo físico —infraestructura,   │
│    territorio, ciudades— y el mundo de los datos y la IA."     │  ← mandatory hook
│                                                                │
│   [ Ver experiencia ]   [ Descargar CV ]   Cali, Colombia      │
├──────────────────────────────────────────────────────────────┤
│  SOBRE MÍ (resumen)                                            │
│  2–3 short paragraphs, professional first person.  [Leer más →]│
├──────────────────────────────────────────────────────────────┤
│  DOS MUNDOS QUE CONVERGEN                (two-columns Skills)   │
│  ┌───────────────────────┐   ┌───────────────────────┐         │
│  │ IA · Datos · Software │ ⇄ │ Ingeniería Civil       │         │
│  │ RAG industrial        │   │ BIM 3D/4D (EU std)     │         │
│  │ Modelos espaciotemp.  │   │ Diseño hidráulico      │         │
│  │ Data Eng (GCP/ETL/DW) │   │ Estructural NSR-10      │         │
│  │ Geointeligencia/GIS   │   │ Planificación urbana    │         │
│  │ React / arquitectura  │   │ Construcción 4.0        │         │
│  └───────────────────────┘   └───────────────────────┘         │
├──────────────────────────────────────────────────────────────┤
│  EXPERIENCIA DESTACADA (3–4 most recent, condensed timeline)   │
│  DAGMA · Sec. Seguridad y Justicia · Sec. Gobierno · Naska      │
│                                              [ Ver toda → ]      │
├──────────────────────────────────────────────────────────────┤
│  PROYECTOS                                                     │
│  [card: stack badges · ★ · lang · updated] [card] [card]        │
│                                              [ Ver todos → ]     │
├──────────────────────────────────────────────────────────────┤
│  DEL BLOG                                                      │
│  [post] [post] [post]                        [ Ver blog → ]     │
├──────────────────────────────────────────────────────────────┤
│  CONTACTO                                                      │
│  juanp.gzmz@gmail.com   ·   LinkedIn /in/jp-guzman              │
├──────────────────────────────────────────────────────────────┤
│  footer: email · LinkedIn · Cali, VdC · [ES/EN/DE]             │
└──────────────────────────────────────────────────────────────┘
```

### 4.2 Experience (`/es/experience/`) — interactive timeline

```
┌──────────────────────────────────────────────────────────────┐
│ header (same)                                                  │
├──────────────────────────────────────────────────────────────┤
│  EXPERIENCIA                                                   │
│                                                                │
│  2026 ●── DAGMA (Alcaldía de Cali) — IT/AI Solutions Consultant│  ← expanded card
│       │   ene–jun 2026 · Cali                                  │
│       │   • Arquitectura DAGMA-360 (datos ambientales, alertas)│
│       │   • Inteligencia geoespacial SIMAP (coberturas, biodiv)│
│       │   • Infra de IA local para soberanía de datos          │
│       │   [stack: GCP · GIS · Python · RAG]                    │
│       │                                                        │
│  2024 ●── Sec. Seguridad y Justicia — Senior Data Scientist    │
│       │   oct 2024–jun 2026 · Observatorio de Seguridad        │
│       │   • Data Warehouse 100% GCP (SILOS) · modelos riesgo   │
│       │   • Scraper + NLP percepción · dashboards React        │
│       │                                                        │
│  2024 ●── Sec. Gobierno — Asesor Técnico de Datos              │
│       │   • Certificación What Works Cities (4ª ciudad de Col.)│
│       │                                                        │
│  2024 ●── Naska Digital — BIM Specialist / Instructor          │
│  2024 ●── Gestión del Riesgo Cali — Ing. Civil / Asesor        │
│  2022 ●── Consorcio Licorera del Valle — Coordinador BIM       │
│  2021 ●── Juegos Nacionales Eje Cafetero 2023 — Coord. BIM     │
│  2018 ●── INFIBAGUE (~3.5 años) — Alumbrado / Urbanismo / PEP  │
│  2018 ●── Diseñador Estructural "Teatrino" [🖼 placeholder img] │
│                                                                │
│  ▸ Experiencia temprana (acordeón compacto — colapsado)        │
│      Megatech LTDA · I.Z SAS · Ing. Proyectos y Servicios · … │
└──────────────────────────────────────────────────────────────┘
```
Interactivity: cards expand/collapse; early-experience + pre-2021 in a compact
accordion (collapsed by default). Default implementation vanilla `<details>` /
minimal JS unless design proves otherwise.

### 4.3 Blog index (`/es/blog/`)

```
┌──────────────────────────────────────────────────────────────┐
│  BLOG                                                          │
│  Filtros: [Todos] [IA] [Data Engineering] [BIM]                │
│           [Geointeligencia] [Carrera]                          │
├──────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────┐   │
│  │ Del concreto reforzado al gradiente descendente…        │   │
│  │ 2026-08 · 7 min · [Carrera] [IA]                         │   │
│  │ Un párrafo de resumen…                        [Leer →]   │   │
│  └────────────────────────────────────────────────────────┘   │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ Modelos espaciotemporales de riesgo…                    │   │
│  │ 2026-07 · 9 min · [Data Engineering] [Geointeligencia]  │   │
│  └────────────────────────────────────────────────────────┘   │
│  … (post cards, newest first) …                                │
└──────────────────────────────────────────────────────────────┘
```
Post page adds: auto TOC (sticky sidebar on wide screens), reading time,
syntax-highlighted code, tags, prev/next.

### 4.4 Placeholder blog titles (4–6, reflecting the duality)
1. "Del concreto reforzado al gradiente descendente: mi salto de la ingeniería civil a la IA" — tags: Carrera, IA
2. "De planos a pipelines: cómo un modelo BIM alimenta un Data Warehouse territorial" — tags: BIM, Data Engineering
3. "Modelos espaciotemporales de riesgo: predecir el dónde antes que el cuándo" — tags: Data Engineering, Geointeligencia
4. "RAG para normativa técnica: consultar la NSR-10 en lenguaje natural" — tags: IA, BIM
5. "Geointeligencia con GCP: de coberturas vegetales a decisiones de política pública" — tags: Geointeligencia, Data Engineering
6. "Soberanía de datos: por qué exploré infraestructura de IA local en el sector público" — tags: IA, Carrera

---

## 5. i18n Routing (confirmed)

- `defaultLocale: 'es'`, `locales: ['es','en','de']`.
- `routing: { prefixDefaultLocale: true }` — **all three locales prefixed**,
  including default (`/es/`). This is the exploration-flagged decision; must NOT
  be left at Astro's un-prefixed default.
- `fallback: { de: 'en' }` with `fallbackType: 'rewrite'` for untranslated DE
  content (esp. blog at launch) — falls back to EN, not ES, since German-speaking
  visitors are assumed to bridge via English, not Spanish. Silent rewrite, no
  "coming soon" state. Confirmed by user, overrides exploration's initial `de:
  'es'` default.
- **hreflang is hand-built** in a shared `<head>` component (not automatic in
  Astro): emit `alternate` links for es/en/de + `x-default`. Design-phase task.
- Language selector maps the current page to its counterpart locale URL and
  preserves the path (a helper over `getRelativeLocaleUrl`).
- URL path segments: **stable English segments** across locales for the first
  slice (`/es/about/`, `/en/about/`, `/de/about/`). Localized slugs deferred (O1).

---

## 6. Content Model Outline

| Data | Storage | Why |
|---|---|---|
| Blog posts | **Content Collection** `blog`, Markdown, per-locale subdir (`src/content/blog/{es,en,de}/*.md`), `glob()` loader + zod | authored prose, needs typing/validation, per-locale |
| Experience/roles | **Content Collection** `experience` via `file()`/data loader, per-locale entries | structured + translatable, drives timeline; typed schema |
| Skills (two worlds) | **Static typed data** (`src/data/skills.ts`) two arrays `ai[]` / `civil[]` + i18n labels | small, rarely changes, tightly coupled to one section |
| Education, Certifications, Languages | **Static typed data** | small, stable lists |
| Projects | **Static seed** (`src/data/projects.ts`: name, repo?, stack[], isExample) **merged at build with GitHub API** (stars/lang/updated) | 2–3 curated placeholders; live metrics baked at build |
| UI strings / nav labels | **i18n dictionaries** (`src/i18n/{es,en,de}.json`) | Astro i18n utility lookups |
| Site meta / Person JSON-LD | **Static config** (`src/data/site.ts`) | single source for SEO/schema |

Proposed schemas (indicative, finalized in design):
- `blog`: `title, description, pubDate, updatedDate?, tags[], heroImage?, draft` (readingTime + TOC computed, not stored).
- `experience`: `company, role, location, startDate, endDate?, current, group: 'recent'|'early', highlights[], stack[], featured` (no `image` field — Teatrino ships as a plain text entry, no image placeholder per user decision).
- `project`: `name, description, repoUrl?, stack[], isExample` → build augments `{stars, primaryLanguage, lastUpdated}`.

GitHub enrichment: **build-time only** (unauthenticated 60 req/hr is fine per
deploy; optional PAT if rebuild frequency grows). Never client-side. Example
projects render clearly marked as examples when no public repo exists.

---

## 7. Decisions Confirmed by User (resolves former O1, O2, O4, O5)

- **Page granularity**: hybrid confirmed — rich anchored Home + separate
  Experience/Projects/Blog pages. Rationale (user): Home carries the "civil
  engineer → AI" narrative in ~30s; dedicated pages give Experience (10+ roles),
  Projects, and Blog their own indexable/SEO-valuable URLs without overloading Home.
- **URL slugs**: stable English path segments across all three locales
  (`/de/about/`, not `/de/ueber-mich/`) — permanent decision, not just v1.
  Rationale (user): standard practice for multilingual technical portfolios,
  avoids duplicated routing logic, simplifies hreflang. Only content is
  translated, not routes.
- **DE blog fallback**: silent rewrite fallback to **EN** (not ES) — see
  §5 i18n routing. Rationale (user): English is the natural bridge language for
  the professional market a German-speaking visitor represents; a "próximamente"
  banner would add friction with no benefit.
- **Tags**: simple client-side filter (chips) on the blog index only, no
  dedicated `/blog/tags/[tag]/` pages. Rationale (user): 4–6 posts at launch
  makes per-tag routes over-engineering; can add later if the blog grows.

## Remaining Open Items for the DESIGN phase

- **O3 — Island framework per widget**: theme toggle, language selector, timeline
  accordion, project/tag filter. Default vanilla/`<details>`; design decides if
  any widget justifies Preact (~3KB). Keep zero-JS bias.
- **O6 — CV PDFs**: user has a real, ready CV (ES confirmed; EN per original
  requirement minimum) — treat as real content to be supplied at apply time, NOT
  a placeholder. DE CV remains optional/omitted.
- **O7 — Teatrino & project imagery — RESOLVED, no placeholder**: user reviewed
  and decided AGAINST an image placeholder for the Teatrino project. It stays in
  the Experience timeline as a normal text entry (design, ~450-person concrete
  amphitheater, NSR-10 compliance) with no `image` field and no placeholder
  graphic slot. Layout must not reserve visual space for an image that isn't
  coming. If renders surface later, adding an image is a small follow-up change,
  not part of this content model.
- **O8 — View Transitions**: animate only in Chromium, graceful elsewhere
  (exploration). Confirmed acceptable; plain navigation elsewhere.
- **O9 — Real code snippet**: still needs actual sample content (static,
  non-executable ETL/model snippet) — user to provide or design proposes a
  faithful placeholder at apply time. Not dropped from scope.
