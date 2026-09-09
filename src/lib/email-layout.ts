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
  /** The footer note ("You are receiving this because you contacted...")
   * only makes sense for mail sent TO the person who submitted the form —
   * the owner's own lead notification is not that, so this defaults to
   * `true` but can be turned off entirely (row omitted, not just blanked). */
  includeFooterNote?: boolean;
  /** Short identity line rendered above the card, on the page background
   * (not inside the white card) — a real content param, not optional: both
   * call sites (owner notification, sender acknowledgement) always supply
   * one. Plain text, gets escaped. */
  letterhead: string;
}

export const COLORS = {
  background: '#fafafa',
  card: '#ffffff',
  border: '#dde1e6',
  ink: '#0a0a0a',
  inkMuted: '#4b5563',
  accent: '#22d3ee',
  accentDeep: '#0891b2',
  onAccent: '#0a0a0a',
} as const;

export const FONT_STACK = "'Manrope', Arial, sans-serif";

/** Second, utility-face typeface role for technical labels (memo header,
 * stamp, eyebrow). Email clients can't reliably load webfonts, so this is a
 * real second typeface distinct in cadence/texture from `FONT_STACK`, not a
 * webfont import. */
export const MONO_FONT_STACK = "ui-monospace, 'SF Mono', 'Roboto Mono', 'Courier New', monospace";

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
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="display:inline-block; margin:0 8px 8px 0;"><tr><td style="border:1px solid ${COLORS.ink}; border-radius:4px; background-color:${COLORS.accent};"><a href="${href}" style="display:inline-block; padding:10px 20px; font-family:${FONT_STACK}; font-size:14px; font-weight:700; color:${COLORS.onAccent}; text-decoration:none; border-radius:4px;">${label}</a></td></tr></table>`;
}

function renderCtaRow(ctas: EmailCta[]): string {
  if (ctas.length === 0) return '';
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:24px 0 0;">${ctas.map(renderCta).join('')}</td></tr></table>`;
}

function renderFooterNoteRow(locale: string, includeFooterNote: boolean): string {
  if (!includeFooterNote) return '';
  return `<tr>
              <td style="padding:16px 32px; border-top:1px solid ${COLORS.border}; font-family:${FONT_STACK}; font-size:12px; line-height:1.5; color:${COLORS.inkMuted};">
                ${escapeHtml(footerNote(locale))}
              </td>
            </tr>`;
}

export function renderEmailLayout(params: EmailLayoutParams): string {
  const { locale, preheader, bodyHtml, ctas, includeFooterNote = true, letterhead } = params;
  const safePreheader = escapeHtml(preheader);
  const safeLetterhead = escapeHtml(letterhead);

  return `<!doctype html>
<html lang="${escapeHtml(locale)}">
  <body style="margin:0; padding:0; background-color:${COLORS.background};">
    <div style="display:none; max-height:0; max-width:0; overflow:hidden; opacity:0; mso-hide:all; font-size:1px; line-height:1px; color:${COLORS.background};">${safePreheader}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${COLORS.background};">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <p style="margin:0 0 12px; text-align:center; font-family:${MONO_FONT_STACK}; font-size:11px; letter-spacing:.08em; text-transform:uppercase; color:${COLORS.inkMuted};">${safeLetterhead}</p>
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background-color:${COLORS.card}; border:1px solid ${COLORS.border}; border-top:3px solid ${COLORS.accent}; border-radius:12px;">
            <tr>
              <td style="padding:32px; font-family:${FONT_STACK}; font-size:15px; line-height:1.6; color:${COLORS.ink};">
                ${bodyHtml}
                ${renderCtaRow(ctas)}
              </td>
            </tr>
            ${renderFooterNoteRow(locale, includeFooterNote)}
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
