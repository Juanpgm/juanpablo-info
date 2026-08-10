import { describe, expect, it } from 'vitest';
import { formatCalendarDate, formatCalendarDuration, getCalendarDuration, getCalendarYear } from './format-date';

const words = { year: 'año', years: 'años', month: 'mes', months: 'meses', connector: 'y' };

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

describe('getCalendarDuration', () => {
  it('computes an exact-months span with no partial month', () => {
    expect(getCalendarDuration(new Date('2020-01-01'), new Date('2020-04-01'))).toEqual({ years: 0, months: 3 });
  });

  it('decrements the month when the end day-of-month is earlier than the start day-of-month', () => {
    // 2020-01-31 -> 2020-03-01: 2 calendar months apart, but end day (1) < start day (31), so it rolls back to 1 month.
    expect(getCalendarDuration(new Date('2020-01-31'), new Date('2020-03-01'))).toEqual({ years: 0, months: 1 });
  });

  it('does not decrement when the day-of-month is exactly equal (same-day-of-month edge case)', () => {
    expect(getCalendarDuration(new Date('2020-01-15'), new Date('2021-03-15'))).toEqual({ years: 1, months: 2 });
  });

  it('computes a real multi-year span from src/content/experience/es/infibague.json (2015-01-01 -> 2018-06-01)', () => {
    // Hand-computed: 2018 - 2015 = 3 years; June(5) - January(0) = 5 months; day-of-month equal (1 = 1), no decrement.
    expect(getCalendarDuration(new Date('2015-01-01'), new Date('2018-06-01'))).toEqual({ years: 3, months: 5 });
  });
});

describe('formatCalendarDuration', () => {
  it('shows months only for a sub-year span', () => {
    expect(formatCalendarDuration({ years: 0, months: 7 }, words)).toBe('7 meses');
  });

  it('uses singular "mes" for exactly one month', () => {
    expect(formatCalendarDuration({ years: 0, months: 1 }, words)).toBe('1 mes');
  });

  it('shows years and months for a year-or-more span', () => {
    expect(formatCalendarDuration({ years: 3, months: 5 }, words)).toBe('3 años 5 meses');
  });

  it('omits "0 meses" for an exact-year span', () => {
    expect(formatCalendarDuration({ years: 1, months: 0 }, words)).toBe('1 año');
  });
});
