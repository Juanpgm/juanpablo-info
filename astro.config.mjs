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
    locales: ['es', 'en', 'de'],
    routing: { prefixDefaultLocale: true, fallbackType: 'rewrite' },
    fallback: { de: 'en' },
  },
  // Pages live under the custom `[locale]` dynamic segment (getStaticPaths),
  // not Astro's own folder-based i18n routing — so Astro's automatic
  // "/" → "/{defaultLocale}/" redirect never gets generated. Without this,
  // the bare domain root 404s. Static redirect (design output: 'static'
  // compatible) to the default locale.
  redirects: { '/': '/es/' },
  integrations: [
    sitemap({ i18n: { defaultLocale: 'es', locales: { es: 'es', en: 'en', de: 'de' } } }),
  ],
  markdown: {
    // defaultColor: false — the site's theme is manual (`data-theme` attribute,
    // see global.css), not OS `prefers-color-scheme`. Without this, Astro
    // defaults Shiki's dual-theme output to the media query and code blocks
    // never actually switch when the user toggles the theme button.
    shikiConfig: { themes: { light: 'github-light', dark: 'github-dark' }, defaultColor: false, wrap: true },
  },
  vite: { plugins: [tailwindcss()] },
});
