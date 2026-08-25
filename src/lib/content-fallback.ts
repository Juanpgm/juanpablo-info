import { getCollection, type CollectionEntry, type CollectionKey } from 'astro:content';
import type { Locale } from '../i18n';

/**
 * astro.config.mjs uses `routing: 'manual'` — Astro's own automatic i18n
 * fallback/redirect middleware is disabled project-wide (it 404s on-demand
 * routes like /admin that aren't locale-prefixed), so there's no built-in
 * fallback to lean on here either way. This helper is the only fallback
 * mechanism for `getCollection()` queries against content collections
 * (`blog`, `experience`), which are plain data lookups, not routed pages.
 *
 * Translation coverage is intentionally incomplete at launch: `experience` is
 * ES-only for every locale; `blog` EN covers half the posts; `blog` DE is
 * empty by design. Without this helper, EN/DE pages that query these
 * collections directly would silently render empty or partial.
 *
 * This is a *content completeness* gap (more EN/DE translation work needed),
 * not a code bug — tracked in apply-progress, not fixed by writing more code
 * here.
 *
 * Fallback chain: `es` -> [es]; `en` -> [en, es]; `de` -> [de, en, es];
 * `fr` -> [fr, en, es]; `ru` -> [ru, en, es]. Entries are merged
 * by slug (the filename, e.g. "dagma", "rag-normativa-tecnica" — see
 * design.md §4/§5.4): once a slug is found in a more-preferred locale, the
 * same slug from a less-preferred fallback locale is skipped, so a
 * partially-translated set (e.g. EN has 3 of 6 posts) never duplicates
 * entries — it fills in only what's missing.
 */
function fallbackChain(locale: Locale): Locale[] {
  if (locale === 'es') return ['es'];
  if (locale === 'en') return ['en', 'es'];
  if (locale === 'de') return ['de', 'en', 'es'];
  if (locale === 'fr') return ['fr', 'en', 'es'];
  return ['ru', 'en', 'es'];
}

/** Entry `id` is `"{locale}/{slug}"` (design.md §4) — strip the locale prefix. */
function slugOf(id: string): string {
  return id.slice(id.indexOf('/') + 1);
}

export async function getLocalizedEntries<C extends CollectionKey>(
  collection: C,
  locale: Locale,
): Promise<CollectionEntry<C>[]> {
  const chain = fallbackChain(locale);
  const seenSlugs = new Set<string>();
  const merged: CollectionEntry<C>[] = [];

  for (const loc of chain) {
    const entries = await getCollection(collection, ({ id }) => id.startsWith(`${loc}/`));
    for (const entry of entries) {
      const slug = slugOf(entry.id);
      if (seenSlugs.has(slug)) continue;
      seenSlugs.add(slug);
      merged.push(entry);
    }
  }

  return merged;
}
