// Astro 5 Content Layer collections (design.md §4 — schemas are final, not
// indicative). `blog` = Markdown per-locale; `experience` = JSON per-locale.
// Locale is derived from the entry id prefix (`es/…`), never a frontmatter
// field — see design.md §4 rationale.
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const TAG = z.enum([
  'ia',
  'data-engineering',
  'bim',
  'geointeligencia',
  'carrera',
  'sismica',
  'geotecnia',
  'hidraulica',
  'estructural',
  'normativa',
  'gestion-riesgo',
]);

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: ({ image }) =>
    z.object({
      title: z.string().max(120),
      description: z.string().max(200),
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      tags: z.array(TAG).min(1),
      heroImage: image().optional(),
      // Per-locale, translatable — independent of the image asset itself
      // (design.md "Theme palette as indirected CSS vars" / content-model spec
      // "Hero Diagram Locale Variant Convention"). Both optional so posts
      // without a hero diagram keep validating.
      heroImageAlt: z.string().max(200).optional(),
      heroImageCaption: z.string().max(280).optional(),
      draft: z.boolean().default(false),
      // readingTime + TOC are COMPUTED at render, never stored.
    }),
});

// DeepWiki-style project detail docs (`/projects/{slug}/`) — one markdown
// entry per `data/projects.ts` seed via `projectId`. Same per-locale-folder
// id scheme as `blog`; unpublished locales fall back through
// `getLocalizedEntries` like everything else.
const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string().max(120),
    description: z.string().max(200),
    projectId: z.string(), // matches ProjectSeed.id in data/projects.ts
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    draft: z.boolean().default(false),
  }),
});

// Raw repo READMEs, shown collapsed on `/projects/{slug}/` under the DeepWiki
// doc. One entry per project (`id` === ProjectSeed.id === projectId). No
// frontmatter — entries are the verbatim README markdown, synced via
// `scripts/sync-readmes.sh`. Empty/missing READMEs simply have no entry, so the
// detail page omits the disclosure.
const readmes = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/readmes' }),
  schema: z.object({}),
});

const experience = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/experience' }),
  schema: z.object({
    company: z.string(),
    role: z.string(),
    location: z.string(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date().optional(), // absent ⇒ ongoing
    current: z.boolean().default(false),
    group: z.enum(['recent', 'early']), // 'early' ⇒ collapsed accordion
    highlights: z.array(z.string()),
    stack: z.array(z.string()).default([]),
    featured: z.boolean().default(false), // shown in Home "Experiencia destacada"
    order: z.number().optional(), // manual tiebreak; else sort by startDate desc
    // NO `image` field — every entry (incl. Teatrino) is text-only (proposal O7, design §10).
  }),
});

export const collections = { blog, experience, projects, readmes };
