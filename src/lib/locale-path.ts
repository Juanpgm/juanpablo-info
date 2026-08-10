import { getRelativeLocaleUrl } from 'astro:i18n';

export type Locale = 'es' | 'en' | 'de';

export const LOCALES: readonly Locale[] = ['es', 'en', 'de'];

/**
 * Given the current pathname and a target locale, return the equivalent path
 * for that locale, preserving the page. Route segments are stable English
 * strings across locales (proposal §5), so this is a pure prefix swap.
 */
export function switchLocalePath(currentPath: string, target: Locale): string {
  const rest = currentPath.replace(/^\/(es|en|de)(?=\/|$)/, '');
  return getRelativeLocaleUrl(target, rest || '/');
}
