// Shared blog view-model: slug + reading time + hero SVG, resolved once per
// entry from an already-loaded CollectionEntry<'blog'>. Centralizes what
// BlogCard/PostLayout used to derive independently (design.md "Inline SVG
// via ?raw glob + set:html") — pages call this once per post and hand the
// result down instead of each component re-globbing/re-deriving it.
import type { CollectionEntry } from 'astro:content';
import { readingTimeMinutes } from './reading-time';
import { resolveHeroDiagramKey } from './hero-diagram';

// ponytail: one module-level glob for all hero SVGs, not one per component
// instantiation — Astro frontmatter re-runs per component render, so this
// used to mean 24+ globs on the blog index alone.
const heroDiagrams = import.meta.glob('/src/assets/blog/*.svg', { query: '?raw', import: 'default', eager: true }) as Record<
  string,
  string
>;

export interface BlogPostView {
  slug: string;
  minutes: number;
  heroSvg: string | undefined;
}

export function toBlogPostView(entry: CollectionEntry<'blog'>): BlogPostView {
  const slug = entry.id.slice(entry.id.indexOf('/') + 1);
  return {
    slug,
    minutes: readingTimeMinutes(entry.body ?? ''),
    heroSvg: entry.data.heroImage ? heroDiagrams[resolveHeroDiagramKey(entry.id, slug)] : undefined,
  };
}
