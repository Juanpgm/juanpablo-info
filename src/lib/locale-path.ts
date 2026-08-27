export type Locale = 'es' | 'en' | 'de' | 'fr' | 'ru';

export const LOCALES: readonly Locale[] = ['es', 'en', 'de', 'fr', 'ru'];

/**
 * Build an always-locale-prefixed, directory-style internal URL.
 * Call-compatible with astro:i18n's getRelativeLocaleUrl(locale, path) but
 * guarantees the `/{locale}/` prefix for EVERY locale including the default
 * `es` — which getRelativeLocaleUrl omits under i18n.routing:'manual'
 * (Astro #11355), the root cause of the site-wide `es` 404s. Leading/trailing
 * slashes in `path` are collapsed so no `//` can appear.
 */
export function localePath(locale: Locale, path = ''): string {
  const clean = path.replace(/^\/+|\/+$/g, '');
  return clean ? `/${locale}/${clean}/` : `/${locale}/`;
}

/**
 * Given the current pathname and a target locale, return the equivalent path
 * for that locale, preserving the page. Route segments are stable English
 * strings across locales (proposal §5), so this is a pure prefix swap.
 */
export function switchLocalePath(currentPath: string, target: Locale): string {
  const rest = currentPath.replace(/^\/(es|en|de|fr|ru)(?=\/|$)/, '');
  return localePath(target, rest);
}

/**
 * Absolute-URL sibling of localePath, for canonical/hreflang tags. Astro's
 * astro:i18n `getAbsoluteLocaleUrl` shares the same defect as
 * `getRelativeLocaleUrl` (it builds on it internally): the `es` prefix is
 * silently dropped under i18n.routing:'manual' (Astro #11355). Join `site`
 * with the always-prefixed `localePath` instead.
 */
export function localeUrlAbsolute(site: string | URL | undefined, locale: Locale, path = ''): string {
  return new URL(localePath(locale, path), site).toString();
}
