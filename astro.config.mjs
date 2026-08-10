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
  adapter: vercel({ webAnalytics: { enabled: false } }),
  i18n: {
    defaultLocale: 'es',
    locales: ['es', 'en', 'de', 'fr', 'ru'],
    routing: { prefixDefaultLocale: true, fallbackType: 'rewrite' },
    fallback: { de: 'en', fr: 'en', ru: 'en' },
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
