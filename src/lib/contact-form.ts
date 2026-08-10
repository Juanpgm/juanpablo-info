/**
 * Pure server-side validation for the contact form (mirrors lib/whatsapp.ts's
 * pure-function pattern — no I/O, no framework, fully unit-testable).
 * Never trust the client's `required` attributes; this is the real guard,
 * called from `pages/api/contact.ts`.
 *
 * The honeypot field (`website`) is checked here too rather than inline in
 * the route: a bot that fills it produces a structurally *valid* submission
 * with `honeypot: true`, so the caller can silently no-op (never send email,
 * never write to the DB, never tip the bot off with a 400).
 */

export interface ContactSubmissionData {
  name: string;
  email: string;
  message: string;
  locale: string;
  honeypot: boolean;
}

export type ValidateContactResult =
  | { valid: true; data: ContactSubmissionData }
  | { valid: false; errors: string[] };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_NAME_LENGTH = 200;
const MIN_MESSAGE_LENGTH = 10;
const MAX_MESSAGE_LENGTH = 5000;

/**
 * Attachment constraints, shared by the client (ContactModal.astro's script,
 * pre-flight check before upload) and the server (pages/api/contact.ts, the
 * real trust boundary — the client check is UX only, never trusted alone).
 *
 * Per-file/combined caps are deliberately conservative: Vercel serverless
 * functions cap the whole request body at ~4.5MB (undocumented in code, but
 * a real platform ceiling) — 3 files at a naive "5MB each" would already
 * blow past that before this code ever runs. 3MB/file + 4MB combined leaves
 * headroom for multipart boundaries and the text fields.
 */
export const MAX_ATTACHMENTS = 3;
export const MAX_ATTACHMENT_SIZE_BYTES = 3 * 1024 * 1024;
export const MAX_TOTAL_ATTACHMENTS_SIZE_BYTES = 4 * 1024 * 1024;

const ALLOWED_ATTACHMENT_MIME_PREFIXES = ['image/'];
const ALLOWED_ATTACHMENT_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

export interface AttachmentInfo {
  name: string;
  size: number;
  type: string;
}

export type ValidateAttachmentsResult = { valid: true } | { valid: false; errors: string[] };

function isAllowedAttachmentType(type: string): boolean {
  return (
    ALLOWED_ATTACHMENT_MIME_PREFIXES.some((prefix) => type.startsWith(prefix)) ||
    ALLOWED_ATTACHMENT_MIME_TYPES.has(type)
  );
}

/**
 * Pure validator for file attachments (count/size/type) — sibling to
 * `validateContactSubmission` rather than folded into it, since attachments
 * are optional and structurally distinct (a `File[]`, not a form field).
 */
export function validateAttachments(files: AttachmentInfo[]): ValidateAttachmentsResult {
  const errors: string[] = [];

  if (files.length > MAX_ATTACHMENTS) {
    errors.push(`You can attach up to ${MAX_ATTACHMENTS} files`);
  }

  let totalSize = 0;
  for (const file of files) {
    totalSize += file.size;
    if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
      errors.push(`"${file.name}" exceeds the ${MAX_ATTACHMENT_SIZE_BYTES / (1024 * 1024)}MB limit per file`);
    }
    if (!isAllowedAttachmentType(file.type)) {
      errors.push(`"${file.name}" has an unsupported file type`);
    }
  }

  if (totalSize > MAX_TOTAL_ATTACHMENTS_SIZE_BYTES) {
    errors.push(`Combined attachments exceed the ${MAX_TOTAL_ATTACHMENTS_SIZE_BYTES / (1024 * 1024)}MB limit`);
  }

  return errors.length > 0 ? { valid: false, errors } : { valid: true };
}

export function validateContactSubmission(data: unknown): ValidateContactResult {
  if (typeof data !== 'object' || data === null) {
    return { valid: false, errors: ['Invalid request body'] };
  }

  const record = data as Record<string, unknown>;
  const name = typeof record.name === 'string' ? record.name.trim() : '';
  const email = typeof record.email === 'string' ? record.email.trim() : '';
  const message = typeof record.message === 'string' ? record.message.trim() : '';
  const locale = typeof record.locale === 'string' && record.locale ? record.locale : 'es';
  const honeypot = typeof record.website === 'string' && record.website.trim().length > 0;

  const errors: string[] = [];

  if (!name) {
    errors.push('Name is required');
  } else if (name.length > MAX_NAME_LENGTH) {
    errors.push(`Name must be ${MAX_NAME_LENGTH} characters or fewer`);
  }

  if (!email) {
    errors.push('Email is required');
  } else if (!EMAIL_RE.test(email)) {
    errors.push('Email is not valid');
  }

  if (!message) {
    errors.push('Message is required');
  } else if (message.length < MIN_MESSAGE_LENGTH) {
    errors.push(`Message must be at least ${MIN_MESSAGE_LENGTH} characters`);
  } else if (message.length > MAX_MESSAGE_LENGTH) {
    errors.push(`Message must be ${MAX_MESSAGE_LENGTH} characters or fewer`);
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, data: { name, email, message, locale, honeypot } };
}
