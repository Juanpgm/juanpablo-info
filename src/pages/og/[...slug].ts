// Per-post, per-locale OG image endpoint (design.md "OG" decision; spec
// "Blog post emits a unique OG image" — `og:image` MUST be
// `/og/{locale}/{slug}.png`, never the shared `/og/default.png`).
//
// File name is `[...slug].ts`, NOT `[...slug].png.ts` (design.md's literal
// suggestion) — verified against astro-og-canvas's own `routing.js`: its
// default `getSlug` already appends the image extension to each `pages` key
// itself (`slug.replace(/\.[^.]*$/, '') + '.' + format.toLowerCase()`), and
// that value becomes the rest-param's content. A `.png.ts` filename would
// make Astro append its OWN static `.png` suffix on top, producing
// `/og/es/foo.png.png`. Letting the rest param carry the extension (this
// file's approach) yields the correct single-extension URL.
//
// `pages` is keyed `"{locale}/{slug}"` over all 5 locales via
// `getLocalizedEntries` (mirrors `[...slug].astro`'s `getStaticPaths`) so a
// de/fr/ru route — which renders a fallback EN/ES entry — still gets its
// own OG image file at its own route locale's URL.
import { OGImageRoute } from 'astro-og-canvas';
import { getLocalizedEntries } from '../../lib/content-fallback';
import type { Locale } from '../../i18n';

const locales: Locale[] = ['es', 'en', 'de', 'fr', 'ru'];
const pages: Record<string, { title: string; description: string }> = {};

for (const locale of locales) {
  const entries = await getLocalizedEntries('blog', locale);
  for (const entry of entries.filter((e) => !e.data.draft)) {
    const slug = entry.id.slice(entry.id.indexOf('/') + 1);
    pages[`${locale}/${slug}`] = { title: entry.data.title, description: entry.data.description };
  }
}

export const { getStaticPaths, GET } = await OGImageRoute({
  pages,
  getImageOptions: (_path, page) => ({
    title: page.title,
    description: page.description,
    // Local font file, not astro-og-canvas's network-fetched default
    // (`https://api.fontsource.org/...`) — a resilience review flagged that
    // default as an unguarded build-time network dependency with no
    // retry/timeout: a single CDN hiccup during the Vercel build aborts the
    // ENTIRE static build (astro's generatePathWithPrerenderer rethrows any
    // page-render error), not just the OG route. This already-self-hosted
    // Manrope file (design system body font, see global.css) removes that
    // dependency entirely.
    fonts: ['./node_modules/@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2'],
    // Brand gradient: ink (#1a2027) -> primary teal (#0f766e), amber
    // (#b45309) accent border — the site's light-theme palette
    // (global.css `:root`), since the OG card renders once at build time
    // with no access to `data-theme`.
    bgGradient: [
      [26, 32, 39],
      [15, 118, 110],
    ],
    border: { color: [180, 83, 9], width: 6, side: 'block-end' },
  }),
});
