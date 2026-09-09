// Per-locale RSS feed (`/[locale]/rss.xml`) — mirrors `[locale]/blog/index.astro`'s
// getStaticPaths over all 5 locales (design.md §4 locale-from-id-prefix
// pattern) so each locale gets its own statically generated feed file.
// `prerender` is left at the static default (NOT `prerender = false`) — this
// route needs no request-time data, unlike `api/contact.ts`/`admin.astro`.
import type { APIRoute } from 'astro';
import rss from '@astrojs/rss';
import { LOCALES, localeUrlAbsolute, type Locale } from '../../lib/locale-path';
import { getLocalizedEntries } from '../../lib/content-fallback';
import { buildFeedItems, feedMeta } from '../../lib/rss-feed';

export function getStaticPaths() {
  return LOCALES.map((locale) => ({ params: { locale } }));
}

export const GET: APIRoute = async ({ params, site }) => {
  const locale = params.locale as Locale;
  const entries = await getLocalizedEntries('blog', locale);
  const items = buildFeedItems(entries, locale, site, localeUrlAbsolute);
  const meta = feedMeta(locale);

  return rss({
    title: meta.title,
    description: meta.description,
    site: site!,
    items,
  });
};
