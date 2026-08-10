import { describe, expect, it } from 'vitest';
import { formatCalendarDate, getCalendarYear } from './format-date';

// Post-launch bugfix: `z.coerce.date()` parses a bare "YYYY-MM-DD" content
// date as UTC midnight. Reading it with local-timezone APIs shifts the
// displayed calendar date backwards in negative-UTC-offset zones (e.g.
// America/Bogota, UTC-5) — these helpers must stay pinned to UTC regardless
// of the machine's local timezone.
describe('getCalendarYear', () => {
  it('returns the UTC year for a UTC-midnight Jan 1 date, not the local-shifted previous year', () => {
    expect(getCalendarYear(new Date('2026-01-01'))).toBe(2026);
  });
});

describe('formatCalendarDate', () => {
  it('formats a Dec 1 date as December, not November', () => {
    expect(formatCalendarDate(new Date('2018-12-01'), 'en', { year: 'numeric', month: 'long' })).toBe('December 2018');
  });

  it('formats a Jan 1 date with the correct (non-shifted) year', () => {
    expect(formatCalendarDate(new Date('2026-01-01'), 'en', { year: 'numeric', month: 'long' })).toBe('January 2026');
  });
});
