/**
 * Pure email composition for the contact form pipeline (no I/O, no astro
 * imports — mirrors `lib/contact-form.ts`'s pure-function pattern so this is
 * fully unit-testable and safe to import from the serverless route).
 */
import { resolveAckCopy } from './contact-email-copy';

const SUBJECT_PREVIEW_LENGTH = 60;

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
  const replySubject = encodeURIComponent('Re: your message via juanpablo.info');
  const mailtoHref = escapeHtml(`mailto:${email}?subject=${replySubject}`);
  const adminHref = escapeHtml(adminUrl);

  const html = [
    `<p><strong>Name:</strong> ${escapeHtml(name)}</p>`,
    `<p><strong>Email:</strong> ${escapeHtml(email)}</p>`,
    `<p><strong>Locale:</strong> ${escapeHtml(locale)}</p>`,
    `<p>${toHtmlParagraph(escapeHtml(message))}</p>`,
    '<p><strong>Attachments:</strong></p>',
    attachmentsHtml,
    `<p><a href="${mailtoHref}">Reply</a></p>`,
    `<p><a href="${adminHref}">Open admin</a></p>`,
  ].join('\n');

  return { subject, text, html };
}

export interface SenderAcknowledgementParams {
  name: string;
  locale: string;
}

// Anti-backscatter: the submitter's `email` is unverified (a spammer could
// put a victim's address there), so this intentionally does NOT accept the
// submitted message or attachments — only a fixed, localized courtesy note.
export function buildSenderAcknowledgement(params: SenderAcknowledgementParams): ComposedEmail {
  const { name, locale } = params;
  const copy = resolveAckCopy(locale);
  const safeName = toSingleLine(name);
  const escapedName = escapeHtml(safeName);

  const text = [copy.greeting(safeName), '', copy.body, '', copy.signoff].join('\n');
  const html = [
    `<p>${copy.greeting(escapedName)}</p>`,
    `<p>${toHtmlParagraph(copy.body)}</p>`,
    `<p>${toHtmlParagraph(copy.signoff)}</p>`,
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
