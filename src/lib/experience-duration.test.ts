import { describe, expect, it } from 'vitest';
import { EXPERIENCE_START_DATE, getExperienceDuration } from './experience-duration';

// design.md §11 pattern: unit-test only pure lib/ branching logic. Calendar
// years/months diff, NOT naive days/30 or days/365 division.
describe('getExperienceDuration', () => {
  it('returns 0 months on the exact anniversary date', () => {
    expect(getExperienceDuration(new Date('2017-09-17T00:00:00'), new Date('2025-09-17T00:00:00'))).toEqual({
      years: 8,
      months: 0,
    });
  });

  it('rolls back a month when the day-of-month has not been reached yet', () => {
    // 2018-09-05 is before the 17th, so August is not yet complete.
    expect(getExperienceDuration(new Date('2017-09-17T00:00:00'), new Date('2018-09-05T00:00:00'))).toEqual({
      years: 0,
      months: 11,
    });
  });

  it('counts the current month once the day-of-month has passed', () => {
    // 2018-09-20 is past the 17th, so September counts.
    expect(getExperienceDuration(new Date('2017-09-17T00:00:00'), new Date('2018-09-20T00:00:00'))).toEqual({
      years: 1,
      months: 0,
    });
  });

  it('handles a multi-year span', () => {
    expect(getExperienceDuration(new Date('2017-09-17T00:00:00'), new Date('2023-01-01T00:00:00'))).toEqual({
      years: 5,
      months: 3,
    });
  });

  it('computes the real EXPERIENCE_START_DATE case for 2026-08-10', () => {
    // 2017-09-17 -> 2025-09-17 is exactly 8 years; 2025-09-17 -> 2026-08-10
    // is 10 months (the 10th has not reached the 17th of the 11th month yet).
    expect(
      getExperienceDuration(new Date(`${EXPERIENCE_START_DATE}T00:00:00`), new Date('2026-08-10T00:00:00'))
    ).toEqual({ years: 8, months: 10 });
  });
});
