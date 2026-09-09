import { describe, expect, it } from 'vitest';
import { parseLeadId, resolveContactedAction } from './admin-leads';

describe('parseLeadId', () => {
  it('returns null for null', () => {
    expect(parseLeadId(null)).toBeNull();
  });

  it('returns null for an empty string', () => {
    expect(parseLeadId('')).toBeNull();
  });

  it('returns null for whitespace only', () => {
    expect(parseLeadId('   ')).toBeNull();
  });

  it('parses a plain positive integer string', () => {
    expect(parseLeadId('42')).toBe(42);
  });

  // Strict, no internal-trim leniency: this is a security/trust boundary for
  // a mutating admin form POST (see src/lib/admin-leads.ts), not a UX text
  // field — a value with surrounding whitespace is rejected outright rather
  // than silently cleaned up.
  it('returns null for a numeric string with surrounding whitespace', () => {
    expect(parseLeadId(' 42 ')).toBeNull();
  });

  it('returns null for zero (SERIAL ids start at 1)', () => {
    expect(parseLeadId('0')).toBeNull();
  });

  it('returns null for a negative number', () => {
    expect(parseLeadId('-1')).toBeNull();
  });

  it('returns null for a decimal number', () => {
    expect(parseLeadId('3.5')).toBeNull();
  });

  it('returns null for a numeric-looking string with trailing letters', () => {
    expect(parseLeadId('42abc')).toBeNull();
  });

  // Leading zeros are still a valid positive integer once parsed — '007' is
  // structurally all-digits and represents 7, so it is accepted rather than
  // rejected as malformed.
  it('parses a string with leading zeros to its integer value', () => {
    expect(parseLeadId('007')).toBe(7);
  });

  it('returns null for a non-string FormDataEntryValue (a File)', () => {
    const file = new File(['content'], 'evidence.txt', { type: 'text/plain' });
    expect(parseLeadId(file)).toBeNull();
  });

  it('returns null for a numeric string that exceeds Number.MAX_SAFE_INTEGER', () => {
    expect(parseLeadId('99999999999999999999')).toBeNull();
  });
});

describe('resolveContactedAction', () => {
  it('returns null for null', () => {
    expect(resolveContactedAction(null)).toBeNull();
  });

  it('returns null for an empty string', () => {
    expect(resolveContactedAction('')).toBeNull();
  });

  it("returns 'mark' for the exact string 'mark'", () => {
    expect(resolveContactedAction('mark')).toBe('mark');
  });

  it("returns 'unmark' for the exact string 'unmark'", () => {
    expect(resolveContactedAction('unmark')).toBe('unmark');
  });

  it('returns null for wrong-case input', () => {
    expect(resolveContactedAction('Mark')).toBeNull();
  });

  it('returns null for an unknown action value', () => {
    expect(resolveContactedAction('delete')).toBeNull();
  });

  it('returns null for a non-string FormDataEntryValue (a File)', () => {
    const file = new File(['content'], 'evidence.txt', { type: 'text/plain' });
    expect(resolveContactedAction(file)).toBeNull();
  });
});
