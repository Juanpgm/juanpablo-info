import type { Locale } from '../i18n';

/**
 * Locale-appropriate CV PDF path (design.md §9). `de`/`fr`/`ru` fall back to
 * `en` (no DE/FR/RU CV, matches the site's →en content fallback logic).
 */
export function cvHref(locale: Locale): string {
  const cvLocale = locale === 'de' || locale === 'fr' || locale === 'ru' ? 'en' : locale;
  return `/cv/juan-pablo-guzman-${cvLocale}.pdf`;
}
