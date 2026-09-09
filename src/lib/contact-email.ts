/**
 * Pure email composition for the contact form pipeline (no I/O, no astro
 * imports — mirrors `lib/contact-form.ts`'s pure-function pattern so this is
 * fully unit-testable and safe to import from the serverless route).
 */
import { resolveAckCopy } from './contact-email-copy';
import { resolveEmailCtaCopy } from './email-cta-copy';
import { renderEmailLayout, COLORS, MONO_FONT_STACK, type EmailCta } from './email-layout';
import { localePath } from './locale-path';
import { normalizeLocale } from './contact-form';
import type { Locale } from '../i18n';

const SUBJECT_PREVIEW_LENGTH = 60;

// Shared literal for the mailto "Reply" link built here and the identical
// mailto link in admin.astro's leads table — one source of truth instead of
// two copies drifting apart.
export const REPLY_SUBJECT = 'Re: your message via juanpablo.info';

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Strips CR/LF (header/subject injection guard) and collapses any remaining
// whitespace run so a name containing newlines can't split an email header.
function toSingleLine(value: string): string {
  return value.replace(/[\r\n]+/g, ' ').trim();
}

function buildSubjectPreview(message: string): string {
  const codePoints = Array.from(message);
  const truncated = codePoints.length > SUBJECT_PREVIEW_LENGTH;
  const preview = codePoints.slice(0, SUBJECT_PREVIEW_LENGTH).join('').replace(/[\r\n]+/g, ' ');
  return truncated ? `${preview}…` : preview;
}

function toHtmlParagraph(escaped: string): string {
  return escaped.replace(/\r\n|\r|\n/g, '<br>');
}

// `localePath` always appends a trailing slash for its directory-style
// routes (about, projects, blog, ...) — correct for those, but `rss.xml` is
// a flat file route built as `/{locale}/rss.xml` (see
// `src/pages/[locale]/rss.xml.ts`). Treating it like a directory route would
// produce a 404ing `/{locale}/rss.xml/` link, same bug already fixed in
// `SeoHead.astro`/`Footer.astro` — detect a file extension in `hrefPath` and
// skip the trailing slash for it.
function resolveCtaHref(siteUrl: string, locale: string, hrefPath: string): string {
  const loc = locale as Locale;
  return hrefPath.includes('.') ? `${siteUrl}${localePath(loc)}${hrefPath}` : `${siteUrl}${localePath(loc, hrefPath)}`;
}

export interface OwnerNotificationParams {
  name: string;
  email: string;
  message: string;
  locale: string;
  attachments: { filename: string }[];
  adminUrl: string;
}

export interface ComposedEmail {
  subject: string;
  text: string;
  html: string;
}

// Fixed English constant — the owner's own lead notification always renders
// in English regardless of the submitter's locale (see the comment above the
// `renderEmailLayout` call below), so this letterhead is not locale-dependent.
const OWNER_LETTERHEAD = 'JUAN PABLO GUZMÁN MARTÍNEZ · LEAD NOTIFICATION';

export function buildOwnerNotification(params: OwnerNotificationParams): ComposedEmail {
  const { name, email, message, locale, attachments, adminUrl } = params;

  const safeName = toSingleLine(name);
  const preview = buildSubjectPreview(message);
  // Belt-and-braces: `locale` should already be whitelisted by
  // `validateContactSubmission`, but this composer is a pure function called
  // from elsewhere too — never trust an upstream guarantee for something that
  // lands directly in an email subject (header/subject injection guard).
  const safeLocale = toSingleLine(locale).slice(0, 5);
  const subject = `[Lead · ${safeLocale.toUpperCase()}] ${safeName} — "${preview}"`;

  const attachmentNames = attachments.map((a) => a.filename);
  const text = [
    `Name: ${name}`,
    `Email: ${email}`,
    `Locale: ${locale}`,
    '',
    message,
    '',
    attachmentNames.length > 0 ? `Attachments: ${attachmentNames.join(', ')}` : 'No attachments',
    '',
    `Admin: ${adminUrl}`,
  ].join('\n');

  const attachmentsHtml =
    attachmentNames.length > 0
      ? `<ul>${attachmentNames.map((filename) => `<li>${escapeHtml(filename)}</li>`).join('')}</ul>`
      : '<p>No attachments</p>';

  // Reply mailto link: URI-encode the subject first, THEN HTML-escape the
  // whole href — reversing this order would let a raw `&` from encoding slip
  // past the escaper and break the attribute.
  const replySubject = encodeURIComponent(REPLY_SUBJECT);
  const mailtoHref = escapeHtml(`mailto:${email}?subject=${replySubject}`);
  const adminHref = escapeHtml(adminUrl);

  const bodyHtml = [
    `<p><strong>Name:</strong> ${escapeHtml(name)}</p>`,
    `<p><strong>Email:</strong> ${escapeHtml(email)}</p>`,
    `<p><strong>Locale:</strong> ${escapeHtml(locale)}</p>`,
    `<p>${toHtmlParagraph(escapeHtml(message))}</p>`,
    '<p><strong>Attachments:</strong></p>',
    attachmentsHtml,
    `<p><a href="${mailtoHref}">Reply</a></p>`,
    `<p><a href="${adminHref}">Open admin</a></p>`,
  ].join('\n');

  // This notification is always English content for the site owner
  // regardless of the submitter's locale (see the static "Name:"/"Email:"
  // labels above), so the layout itself (footer note, `lang` attribute) is
  // rendered in English too, not `locale` — `ctas: []`: Reply/Open-admin
  // stay as plain links inside bodyHtml, no marketing buttons on the
  // owner's own lead notification (that would be noise). `includeFooterNote:
  // false` because that note reads "You are receiving this because you
  // contacted juanpablo.info..." — true for the submitter's ack, false here:
  // the owner didn't contact themselves.
  const html = renderEmailLayout({
    locale: 'en',
    preheader: `New contact form message from ${safeName || 'a visitor'}`,
    bodyHtml,
    ctas: [],
    includeFooterNote: false,
    letterhead: OWNER_LETTERHEAD,
  });

  return { subject, text, html };
}

export interface SenderAcknowledgementParams {
  name: string;
  locale: string;
  siteUrl: string;
  /** The lead's actual `contact_submissions.id` row, used to derive a real
   * reference number (`REF-000042`) rather than a synthetic one. */
  leadId: number;
  /** When the submission was received, used for the memo header's date
   * field — anchored to `America/Bogota` (see `formatReceivedDate`). */
  receivedAt: Date;
}

// Zero-padded to 6 digits; deliberately not localized — it's a neutral
// technical code, same format in every locale.
function buildRefCode(leadId: number): string {
  return `REF-${String(leadId).padStart(6, '0')}`;
}

// Cali, Colombia is the site's real base (see `src/data/site.ts`'s
// `address`), so the memo-header timestamp is anchored to a real, meaningful
// timezone rather than naive UTC or the recipient's unknown one.
function formatReceivedDate(receivedAt: Date, locale: string): string {
  const options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'America/Bogota',
  };
  try {
    return new Intl.DateTimeFormat(locale, options).format(receivedAt);
  } catch {
    // Defense in depth: `locale` is normalized upstream in this same
    // function via `normalizeLocale`, so this shouldn't happen in practice —
    // but this is a pure function callable directly with an arbitrary string.
    return new Intl.DateTimeFormat('en', options).format(receivedAt);
  }
}

// Anti-backscatter: the submitter's `email` is unverified (a spammer could
// put a victim's address there), so this intentionally does NOT accept the
// submitted message or attachments — only a fixed, localized courtesy note
// plus three fixed marketing CTAs (projects/blog/RSS), never anything
// derived from the submission itself.
export function buildSenderAcknowledgement(params: SenderAcknowledgementParams): ComposedEmail {
  const { name, siteUrl, leadId, receivedAt } = params;
  // Normalize once, up front: this is a public pure function that another
  // caller could invoke directly with an arbitrary string (not just the
  // route, which already whitelists `locale` via `validateContactSubmission`
  // before it ever reaches here). Without this, an unknown locale would fall
  // back to English *copy* via `resolveAckCopy`/`resolveEmailCtaCopy`
  // individually while still building 404ing `/{locale}/...` CTA links and a
  // mismatched `<html lang>` — normalizing once keeps copy, links, and the
  // layout's `lang` attribute consistent with each other.
  const locale = normalizeLocale(params.locale);
  const copy = resolveAckCopy(locale);
  const safeName = toSingleLine(name);
  const escapedName = escapeHtml(safeName);

  // Memo header: a "PARA/REF/FECHA"-style identity block with a REAL
  // reference number derived from the lead's actual database row id —
  // evokes engineering documentation without a literal blueprint/grid
  // texture, just typographic discipline (mono labels over serif-free values).
  const memoHeaderHtml = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
  <tr>
    <td style="font-family:${MONO_FONT_STACK}; font-size:10px; letter-spacing:.08em; text-transform:uppercase; color:${COLORS.inkMuted};">${escapeHtml(copy.memoToLabel)}<br><span style="font-size:13px; color:${COLORS.ink}; font-weight:600; text-transform:none; letter-spacing:normal;">${escapedName}</span></td>
    <td style="font-family:${MONO_FONT_STACK}; font-size:10px; letter-spacing:.08em; text-transform:uppercase; color:${COLORS.inkMuted};">${escapeHtml(copy.memoRefLabel)}<br><span style="font-size:13px; color:${COLORS.ink}; font-weight:600; text-transform:none; letter-spacing:normal;">${escapeHtml(buildRefCode(leadId))}</span></td>
    <td style="font-family:${MONO_FONT_STACK}; font-size:10px; letter-spacing:.08em; text-transform:uppercase; color:${COLORS.inkMuted};">${escapeHtml(copy.memoDateLabel)}<br><span style="font-size:13px; color:${COLORS.ink}; font-weight:600; text-transform:none; letter-spacing:normal;">${escapeHtml(formatReceivedDate(receivedAt, locale))}</span></td>
  </tr>
  <tr>
    <td colspan="3" style="padding-top:12px; border-top:1px dashed ${COLORS.border};"></td>
  </tr>
</table>`;

  // Stamp tag: a small bordered "received" badge.
  const stampHtml = `<table role="presentation" cellpadding="0" cellspacing="0" style="display:inline-block; margin:0 0 20px;"><tr><td style="border:1.5px solid ${COLORS.accentDeep}; border-radius:4px; padding:6px 12px; font-family:${MONO_FONT_STACK}; font-size:11px; letter-spacing:.06em; font-weight:700; color:${COLORS.ink};">✓ ${escapeHtml(copy.receivedBadge)}</td></tr></table>`;

  const eyebrowHtml = `<p style="margin:24px 0 4px; font-family:${MONO_FONT_STACK}; font-size:11px; letter-spacing:.08em; text-transform:uppercase; color:${COLORS.inkMuted};">${escapeHtml(copy.ctaEyebrow)}</p>`;

  const bodyHtml = [
    memoHeaderHtml,
    stampHtml,
    `<p>${copy.greeting(escapedName)}</p>`,
    `<p>${toHtmlParagraph(copy.body)}</p>`,
    `<p>${toHtmlParagraph(copy.signoff)}</p>`,
    eyebrowHtml,
  ].join('\n');

  const ctaCopy = resolveEmailCtaCopy(locale);
  const ctas: EmailCta[] = [ctaCopy.projects, ctaCopy.blog, ctaCopy.rss].map((entry) => ({
    label: `→ ${entry.label}`,
    href: resolveCtaHref(siteUrl, locale, entry.hrefPath),
  }));

  const html = renderEmailLayout({
    locale,
    preheader: copy.body,
    bodyHtml,
    ctas,
    letterhead: copy.letterhead,
  });

  // Plaintext readers never see the HTML memo header, but the REF code is
  // the whole point of a *real* reference number (something the submitter
  // or owner could cite in a reply) — it must survive in a plaintext-only
  // client too, not just the styled email.
  const text = [
    `${copy.memoRefLabel}: ${buildRefCode(leadId)}`,
    '',
    copy.greeting(safeName),
    '',
    copy.body,
    '',
    copy.signoff,
    '',
    ...ctas.map((cta) => `${cta.label}: ${cta.href}`),
  ].join('\n');

  return { subject: copy.subject, text, html };
}

// Resend's sandbox sender (`onboarding@resend.dev`) can only deliver to the
// Resend account owner — sending an acknowledgement to a third party from it
// would silently fail, so treat it as "not a real verified sender".
export function isVerifiedSender(from: string | undefined): boolean {
  if (!from || from.trim().length === 0) return false;
  return !from.includes('@resend.dev');
}
