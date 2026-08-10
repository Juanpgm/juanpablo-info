import type { Locale } from '../i18n';

/**
 * Locale-appropriate CV PDF path (design.md §9). `de` falls back to `en`
 * (no DE CV, matches the site's de→en content fallback logic).
 */
export function cvHref(locale: Locale): string {
  const cvLocale = locale === 'de' ? 'en' : locale;
  return `/cv/juan-pablo-guzman-${cvLocale}.pdf`;
}
