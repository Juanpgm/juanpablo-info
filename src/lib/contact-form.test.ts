import { describe, expect, it } from 'vitest';
import { validateContactSubmission } from './contact-form';

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
    expect(validateContactSubmission(null)).toEqual({ valid: false, errors: ['Invalid request body'] });
    expect(validateContactSubmission('nope')).toEqual({ valid: false, errors: ['Invalid request body'] });
  });

  it('rejects missing/empty fields', () => {
    const result = validateContactSubmission({ name: '', email: '', message: '' });
    expect(result.valid).toBe(false);
    expect(result.valid || result.errors).toEqual([
      'Name is required',
      'Email is required',
      'Message is required',
    ]);
  });

  it('rejects an invalid email shape', () => {
    const result = validateContactSubmission({
      name: 'Ada',
      email: 'not-an-email',
      message: 'Hello, I saw your portfolio and would like to talk.',
    });
    expect(result.valid).toBe(false);
    expect(result.valid || result.errors).toEqual(['Email is not valid']);
  });

  it('rejects a too-short message', () => {
    const result = validateContactSubmission({ name: 'Ada', email: 'ada@example.com', message: 'hi' });
    expect(result.valid).toBe(false);
    expect(result.valid || result.errors).toEqual(['Message must be at least 10 characters']);
  });

  it('rejects an over-length message', () => {
    const result = validateContactSubmission({
      name: 'Ada',
      email: 'ada@example.com',
      message: 'a'.repeat(5001),
    });
    expect(result.valid).toBe(false);
    expect(result.valid || result.errors).toEqual(['Message must be 5000 characters or fewer']);
  });

  it('rejects an over-length name', () => {
    const result = validateContactSubmission({
      name: 'a'.repeat(201),
      email: 'ada@example.com',
      message: 'Hello, I saw your portfolio and would like to talk.',
    });
    expect(result.valid).toBe(false);
    expect(result.valid || result.errors).toEqual(['Name must be 200 characters or fewer']);
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
