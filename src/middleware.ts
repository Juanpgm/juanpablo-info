import type { MiddlewareHandler } from 'astro';

// `i18n.routing: 'manual'` (astro.config.mjs) requires this file to exist —
// Astro refuses to build otherwise. Locale routing here is entirely manual
// via the `[locale]` dynamic segment (getStaticPaths), so there's nothing
// for Astro's own i18n middleware to do; this is a deliberate no-op.
export const onRequest: MiddlewareHandler = (_context, next) => next();
