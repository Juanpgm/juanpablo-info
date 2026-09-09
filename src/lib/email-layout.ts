/**
 * Branded, email-safe HTML layout for contact-form transactional emails
 * (owner notification + sender acknowledgement). No astro imports, no I/O —
 * mirrors `lib/contact-email.ts`'s pure-function pattern.
 *
 * Email-HTML constraints (most clients strip <style> and don't support
 * flex/grid): table-based layout only, every visual rule inline. Design
 * tokens are hand-copied from `src/styles/global.css` `:root` (light theme —
 * email clients don't render `prefers-color-scheme`/`[data-theme]`
 * consistently, so this intentionally does not attempt dark mode).
 */
import { escapeHtml } from './contact-email';

export interface EmailCta {
  label: string;
  href: string;
}

export interface EmailLayoutParams {
  locale: string;
  /** Visually-hidden preview text shown by inbox clients (Gmail/Outlook
   * preview line) — must be plain text, gets escaped. */
  preheader: string;
  /** Trusted, pre-built HTML from the caller — rendered as-is, NOT escaped
   * (callers already run their own dynamic values through `escapeHtml`). */
  bodyHtml: string;
  ctas: EmailCta[];
}

const COLORS = {
  background: '#fafafa',
  card: '#ffffff',
  border: '#dde1e6',
  ink: '#0a0a0a',
  inkMuted: '#4b5563',
  accent: '#22d3ee',
  onAccent: '#0a0a0a',
} as const;

const FONT_STACK = "'Manrope', Arial, sans-serif";

const footerNoteByLocale: Record<string, string> = {
  es: 'Recibiste este mensaje porque contactaste a juanpablo.info a través de su formulario de contacto.',
  en: 'You are receiving this because you contacted juanpablo.info through its contact form.',
  de: 'Sie erhalten diese Nachricht, weil Sie juanpablo.info über das Kontaktformular kontaktiert haben.',
  fr: 'Vous recevez ce message car vous avez contacté juanpablo.info via son formulaire de contact.',
  ru: 'Вы получили это письмо, так как обратились на juanpablo.info через контактную форму.',
};

/** Fallback chain: locale -> en -> es (mirrors `resolveAckCopy`/`feedMeta`). */
function footerNote(locale: string): string {
  return footerNoteByLocale[locale] ?? footerNoteByLocale.en ?? footerNoteByLocale.es;
}

function renderCta(cta: EmailCta): string {
  const label = escapeHtml(cta.label);
  const href = escapeHtml(cta.href);
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="display:inline-block; margin:0 8px 8px 0;"><tr><td style="border-radius:6px; background-color:${COLORS.accent};"><a href="${href}" style="display:inline-block; padding:10px 20px; font-family:${FONT_STACK}; font-size:14px; font-weight:700; color:${COLORS.onAccent}; text-decoration:none; border-radius:6px;">${label}</a></td></tr></table>`;
}

function renderCtaRow(ctas: EmailCta[]): string {
  if (ctas.length === 0) return '';
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:24px 0 0;">${ctas.map(renderCta).join('')}</td></tr></table>`;
}

export function renderEmailLayout(params: EmailLayoutParams): string {
  const { locale, preheader, bodyHtml, ctas } = params;
  const safePreheader = escapeHtml(preheader);

  return `<!doctype html>
<html lang="${escapeHtml(locale)}">
  <body style="margin:0; padding:0; background-color:${COLORS.background};">
    <div style="display:none; max-height:0; max-width:0; overflow:hidden; opacity:0; mso-hide:all; font-size:1px; line-height:1px; color:${COLORS.background};">${safePreheader}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${COLORS.background};">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background-color:${COLORS.card}; border:1px solid ${COLORS.border}; border-radius:12px;">
            <tr>
              <td style="padding:32px; font-family:${FONT_STACK}; font-size:15px; line-height:1.6; color:${COLORS.ink};">
                ${bodyHtml}
                ${renderCtaRow(ctas)}
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px; border-top:1px solid ${COLORS.border}; font-family:${FONT_STACK}; font-size:12px; line-height:1.5; color:${COLORS.inkMuted};">
                ${escapeHtml(footerNote(locale))}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
