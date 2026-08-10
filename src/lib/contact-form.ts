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
