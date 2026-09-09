/**
 * Localized CTA labels for the marketing buttons rendered in the sender
 * acknowledgement email (design: contact form leads, "Fase 2" §2.1
 * follow-up). Kept out of `src/i18n/*.json` for the same reason as
 * `contact-email-copy.ts`: `t()` is typed as `Record<UIKey, string>`, and
 * this module must stay import-safe from a pure lib (no astro:i18n).
 *
 * Stays pure: `hrefPath` is a route path segment, not a full URL — the
 * caller resolves it through `localeUrlAbsolute(site, locale, hrefPath)`.
 */
import type { Locale } from '../i18n';

export interface EmailCtaCopyEntry {
  label: string;
  hrefPath: string;
}

export interface EmailCtaCopy {
  projects: EmailCtaCopyEntry;
  blog: EmailCtaCopyEntry;
  rss: EmailCtaCopyEntry;
}

export const emailCtaCopy: Partial<Record<Locale, EmailCtaCopy>> = {
  es: {
    projects: { label: 'Ver mis proyectos', hrefPath: 'projects' },
    blog: { label: 'Leer el blog', hrefPath: 'blog' },
    rss: { label: 'Suscribirme por RSS', hrefPath: 'rss.xml' },
  },
  en: {
    projects: { label: 'See my projects', hrefPath: 'projects' },
    blog: { label: 'Read the blog', hrefPath: 'blog' },
    rss: { label: 'Subscribe via RSS', hrefPath: 'rss.xml' },
  },
  de: {
    projects: { label: 'Meine Projekte ansehen', hrefPath: 'projects' },
    blog: { label: 'Blog lesen', hrefPath: 'blog' },
    rss: { label: 'Per RSS abonnieren', hrefPath: 'rss.xml' },
  },
  fr: {
    projects: { label: 'Voir mes projets', hrefPath: 'projects' },
    blog: { label: 'Lire le blog', hrefPath: 'blog' },
    rss: { label: "S'abonner via RSS", hrefPath: 'rss.xml' },
  },
  ru: {
    projects: { label: 'Смотреть проекты', hrefPath: 'projects' },
    blog: { label: 'Читать блог', hrefPath: 'blog' },
    rss: { label: 'Подписаться через RSS', hrefPath: 'rss.xml' },
  },
};

/**
 * Fallback chain: locale → en (mirrors `resolveAckCopy` in
 * `contact-email-copy.ts`). `en` is a literal entry above so it is always
 * present.
 */
export function resolveEmailCtaCopy(locale: string): EmailCtaCopy {
  return emailCtaCopy[locale as Locale] ?? emailCtaCopy.en!;
}
