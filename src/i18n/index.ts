// Typed UI-string dictionary + t() lookup (design.md §5.1).
// `es.json` is the canonical keyset: `UIKey = keyof typeof es`. `en`/`de` are
// typed as `Record<UIKey, string>` so a missing translation is a TYPE ERROR
// at build, not a silent runtime gap.
import de from './de.json';
import en from './en.json';
import es from './es.json';
import fr from './fr.json';
import ru from './ru.json';

export type UIKey = keyof typeof es;
export type Locale = 'es' | 'en' | 'de' | 'fr' | 'ru';

type Dict = Record<UIKey, string>;

const dictionaries: Record<Locale, Dict> = {
  es,
  en: en satisfies Dict,
  de: de satisfies Dict,
  fr: fr satisfies Dict,
  ru: ru satisfies Dict,
};

const LOCALES: readonly Locale[] = ['es', 'en', 'de', 'fr', 'ru'];

export function isLocale(value: string | undefined): value is Locale {
  return !!value && (LOCALES as readonly string[]).includes(value);
}

/** Reads `Astro.currentLocale`, defaulting to `es` for any unrecognized value. */
export function useLocale(currentLocale: string | undefined): Locale {
  return isLocale(currentLocale) ? currentLocale : 'es';
}

/**
 * Dictionary lookup with de → en → es fallback (mirrors the content
 * `fallback: { de: 'en' }` routing config). In practice `en`/`de` are fully
 * typed so this only matters for a locale string arriving untyped at runtime.
 */
export function t(locale: string | undefined, key: UIKey): string {
  const loc = useLocale(locale);
  return dictionaries[loc]?.[key] ?? dictionaries.en[key] ?? dictionaries.es[key];
}

export { getAbsoluteLocaleUrl, getRelativeLocaleUrl } from 'astro:i18n';
