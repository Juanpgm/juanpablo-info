// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // Real production domain (design R1, resolved) — this single value
  // regenerates hreflang/sitemap/OG/JSON-LD absolute URLs everywhere.
  site: 'https://juanpablo.info',
  output: 'static',
  // Web Analytics is on so /admin has real visit data to show (see
  // src/pages/admin.astro) — the tracking script is injected automatically,
  // no @vercel/analytics package needed.
  adapter: vercel({ webAnalytics: { enabled: true } }),
  i18n: {
    defaultLocale: 'es',
    locales: ['es', 'en', 'de', 'fr', 'ru'],
    // 'manual' — locale routing is handled entirely by our own `[locale]`
    // dynamic segment (see below), not Astro's folder convention. This
    // config block exists only so helpers like getRelativeLocaleUrl work;
    // the automatic strategy (prefixDefaultLocale: true) also auto-injects
    // Astro's own i18n middleware, which 404s any on-demand-rendered route
    // that isn't locale-prefixed — broke /admin (prerender = false) even
    // though it's a real registered route. 'manual' drops that middleware.
    routing: 'manual',
  },
  // Pages live under the custom `[locale]` dynamic segment (getStaticPaths),
  // not Astro's own folder-based i18n routing — so Astro's automatic
  // "/" → "/{defaultLocale}/" redirect never gets generated. `src/pages/index.astro`
  // is a real page that fills this gap AND auto-detects the visitor's
  // browser-language preference (a plain static `redirects` entry here
  // can't read navigator.language client-side).
  integrations: [
    sitemap({ i18n: { defaultLocale: 'es', locales: { es: 'es', en: 'en', de: 'de', fr: 'fr', ru: 'ru' } } }),
  ],
  // Viewport-triggered prefetch pairs naturally with <ClientRouter /> (view
  // transitions) already in use — cheap win, no config previously set.
  prefetch: { defaultStrategy: 'viewport' },
  markdown: {
    // defaultColor: false — the site's theme is manual (`data-theme` attribute,
    // see global.css), not OS `prefers-color-scheme`. Without this, Astro
    // defaults Shiki's dual-theme output to the media query and code blocks
    // never actually switch when the user toggles the theme button.
    shikiConfig: { themes: { light: 'github-light', dark: 'github-dark' }, defaultColor: false, wrap: true },
  },
  vite: { plugins: [tailwindcss()] },
});
