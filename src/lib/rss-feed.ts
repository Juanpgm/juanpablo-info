/**
 * Pure feed composition for the per-locale RSS routes (`/[locale]/rss.xml`).
 * No astro imports, no I/O — mirrors `lib/contact-email.ts`'s pure-function
 * pattern so this is fully unit-testable and reusable from any route without
 * pulling in astro:content or astro:i18n at import time. `import type` below
 * is erased at compile time (same pattern as `contact-email-copy.ts`), so no
 * runtime import happens.
 */
import type { Locale } from '../i18n';

/** Minimal shape this module needs from a blog `CollectionEntry` — kept
 * local (not `CollectionEntry<'blog'>` from `astro:content`) so this stays
 * a plain, dependency-free pure module. */
export interface FeedSourceEntry {
  id: string;
  data: {
    title: string;
    description: string;
    pubDate: Date;
    tags: readonly string[];
    draft: boolean;
  };
}

export interface FeedItem {
  title: string;
  description: string;
  link: string;
  pubDate: Date;
  categories: string[];
}

export interface FeedMetaInfo {
  title: string;
  description: string;
}

/** Same call shape as `lib/locale-path.ts#localeUrlAbsolute` — accepted as a
 * param (rather than imported) so this module never drags astro:i18n in
 * transitively. `locale: Locale` (not `string`) so the real
 * `localeUrlAbsolute` is directly assignable here under strict function
 * types. */
export type LocaleUrlBuilder = (site: string | URL | undefined, locale: Locale, path?: string) => string;

/** Entry `id` is `"{locale}/{slug}"` (design.md §4) — strip the locale prefix. */
function slugOf(id: string): string {
  return id.slice(id.indexOf('/') + 1);
}

export function buildFeedItems(
  entries: FeedSourceEntry[],
  locale: Locale,
  site: string | URL | undefined,
  buildUrl: LocaleUrlBuilder,
): FeedItem[] {
  return entries
    .filter((entry) => !entry.data.draft)
    .sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime())
    .map((entry) => ({
      title: entry.data.title,
      description: entry.data.description,
      link: buildUrl(site, locale, `blog/${slugOf(entry.id)}`),
      pubDate: entry.data.pubDate,
      categories: [...entry.data.tags],
    }));
}

const SIGNOFF_NAME = 'Juan Pablo Guzmán Martínez';

const feedMetaByLocale: Record<string, FeedMetaInfo> = {
  es: { title: `Blog de ${SIGNOFF_NAME}`, description: 'Artículos sobre IA, ingeniería de datos, BIM y la transición entre ingeniería civil y ciencia de datos.' },
  en: { title: `${SIGNOFF_NAME}'s Blog`, description: 'Articles on AI, data engineering, BIM, and the transition from civil engineering to data science.' },
  de: { title: `Blog von ${SIGNOFF_NAME}`, description: 'Artikel über KI, Data Engineering, BIM und den Übergang vom Bauingenieurwesen zur Datenwissenschaft.' },
  fr: { title: `Blog de ${SIGNOFF_NAME}`, description: "Articles sur l'IA, l'ingénierie des données, le BIM et la transition du génie civil vers la science des données." },
  ru: { title: `Блог ${SIGNOFF_NAME}`, description: 'Статьи об ИИ, инженерии данных, BIM и переходе от гражданского строительства к науке о данных.' },
};

/**
 * Fallback chain: locale → en → es (mirrors `resolveAckCopy`'s pattern in
 * `contact-email-copy.ts`). `en` is a literal entry above so it is always
 * present; the `es` link exists only as a final safety net.
 */
export function feedMeta(locale: string): FeedMetaInfo {
  return feedMetaByLocale[locale] ?? feedMetaByLocale.en ?? feedMetaByLocale.es;
}
