import { describe, expect, it } from 'vitest';
import {
  validateContactSubmission,
  validateAttachments,
  MAX_ATTACHMENTS,
  MAX_ATTACHMENT_SIZE_BYTES,
  MAX_TOTAL_ATTACHMENTS_SIZE_BYTES,
} from './contact-form';

describe('validateContactSubmission', () => {
  it('accepts a valid submission', () => {
    const result = validateContactSubmission({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      message: 'Hello, I saw your portfolio and would like to talk.',
      locale: 'en',
    });
    expect(result).toEqual({
      valid: true,
      data: {
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        message: 'Hello, I saw your portfolio and would like to talk.',
        locale: 'en',
        honeypot: false,
      },
    });
  });

  it('defaults locale to es when missing', () => {
    const result = validateContactSubmission({
      name: 'Ada',
      email: 'ada@example.com',
      message: 'Hello, I saw your portfolio and would like to talk.',
    });
    expect(result.valid).toBe(true);
    expect(result.valid && result.data.locale).toBe('es');
  });

  it('rejects a non-object body', () => {
    expect(validateContactSubmission(null)).toEqual({
      valid: false,
      errors: [{ field: 'name', message: 'Invalid request body' }],
    });
    expect(validateContactSubmission('nope')).toEqual({
      valid: false,
      errors: [{ field: 'name', message: 'Invalid request body' }],
    });
  });

  it('rejects missing/empty fields', () => {
    const result = validateContactSubmission({ name: '', email: '', message: '' });
    expect(result.valid).toBe(false);
    expect(result.valid || result.errors).toEqual([
      { field: 'name', message: 'Name is required' },
      { field: 'email', message: 'Email is required' },
      { field: 'message', message: 'Message is required' },
    ]);
  });

  it('rejects an invalid email shape', () => {
    const result = validateContactSubmission({
      name: 'Ada',
      email: 'not-an-email',
      message: 'Hello, I saw your portfolio and would like to talk.',
    });
    expect(result.valid).toBe(false);
    expect(result.valid || result.errors).toEqual([{ field: 'email', message: 'Email is not valid' }]);
  });

  it('rejects a too-short message', () => {
    const result = validateContactSubmission({ name: 'Ada', email: 'ada@example.com', message: 'hi' });
    expect(result.valid).toBe(false);
    expect(result.valid || result.errors).toEqual([
      { field: 'message', message: 'Message must be at least 10 characters' },
    ]);
  });

  it('rejects an over-length message', () => {
    const result = validateContactSubmission({
      name: 'Ada',
      email: 'ada@example.com',
      message: 'a'.repeat(5001),
    });
    expect(result.valid).toBe(false);
    expect(result.valid || result.errors).toEqual([
      { field: 'message', message: 'Message must be 5000 characters or fewer' },
    ]);
  });

  it('rejects an over-length name', () => {
    const result = validateContactSubmission({
      name: 'a'.repeat(201),
      email: 'ada@example.com',
      message: 'Hello, I saw your portfolio and would like to talk.',
    });
    expect(result.valid).toBe(false);
    expect(result.valid || result.errors).toEqual([
      { field: 'name', message: 'Name must be 200 characters or fewer' },
    ]);
  });

  it('flags the honeypot field as triggered without failing validation', () => {
    const result = validateContactSubmission({
      name: 'Bot',
      email: 'bot@example.com',
      message: 'This is a bot filling every field including the trap.',
      website: 'https://spam.example',
    });
    expect(result).toEqual({
      valid: true,
      data: {
        name: 'Bot',
        email: 'bot@example.com',
        message: 'This is a bot filling every field including the trap.',
        locale: 'es',
        honeypot: true,
      },
    });
  });
});

describe('validateAttachments', () => {
  it('accepts files within the count/size/type limits', () => {
    const result = validateAttachments([
      { name: 'photo.png', size: 1024, type: 'image/png' },
      { name: 'brief.pdf', size: 2048, type: 'application/pdf' },
    ]);
    expect(result).toEqual({ valid: true });
  });

  it('accepts zero files', () => {
    expect(validateAttachments([])).toEqual({ valid: true });
  });

  it('rejects an oversized file', () => {
    const result = validateAttachments([
      { name: 'huge.png', size: MAX_ATTACHMENT_SIZE_BYTES + 1, type: 'image/png' },
    ]);
    expect(result.valid).toBe(false);
    expect(result.valid || result.errors.some((e) => e.includes('huge.png'))).toBe(true);
  });

  it('rejects too many files', () => {
    const files = Array.from({ length: MAX_ATTACHMENTS + 1 }, (_, i) => ({
      name: `file-${i}.png`,
      size: 100,
      type: 'image/png',
    }));
    const result = validateAttachments(files);
    expect(result.valid).toBe(false);
    expect(result.valid || result.errors.some((e) => e.includes('up to'))).toBe(true);
  });

  it('rejects a disallowed file type', () => {
    const result = validateAttachments([{ name: 'script.exe', size: 100, type: 'application/x-msdownload' }]);
    expect(result.valid).toBe(false);
    expect(result.valid || result.errors.some((e) => e.includes('unsupported file type'))).toBe(true);
  });

  it('rejects when combined attachment size exceeds the aggregate limit', () => {
    const perFile = Math.floor(MAX_TOTAL_ATTACHMENTS_SIZE_BYTES / 2) + 1;
    const result = validateAttachments([
      { name: 'a.png', size: perFile, type: 'image/png' },
      { name: 'b.png', size: perFile, type: 'image/png' },
    ]);
    expect(result.valid).toBe(false);
    expect(result.valid || result.errors.some((e) => e.includes('Combined'))).toBe(true);
  });
});
