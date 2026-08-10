/**
 * Live "years of experience" calculation (post-launch fast-follow). Pure,
 * framework-free (design.md §11 — the only kind of module worth unit-testing)
 * so it runs identically at Astro build-time (Node, for the SSR fallback) and
 * re-imported client-side (for the live recompute on every page load).
 */

// ISO date, parsed as `${EXPERIENCE_START_DATE}T00:00:00` by callers to avoid
// the classic bug where `new Date('2017-09-17')` (no time part) is parsed as
// UTC midnight and shifts to the previous day in negative-UTC-offset zones.
export const EXPERIENCE_START_DATE = '2017-09-17';

export interface ExperienceDuration {
  years: number;
  months: number;
}

/**
 * Calendar years/months elapsed between `startDate` and `now` — NOT a naive
 * days/30 or days/365 division, which would drift. Days are intentionally
 * dropped (only years + months are shown).
 */
export function getExperienceDuration(startDate: Date, now: Date): ExperienceDuration {
  let years = now.getFullYear() - startDate.getFullYear();
  let months = now.getMonth() - startDate.getMonth();
  if (now.getDate() < startDate.getDate()) months--;
  if (months < 0) {
    years--;
    months += 12;
  }
  return { years, months };
}

export interface ExperienceDurationWords {
  year: string;
  years: string;
  month: string;
  months: string;
  connector: string;
}

/** "8 years and 10 months" — singular/plural picked per language via `words`. */
export function formatExperienceDuration(duration: ExperienceDuration, words: ExperienceDurationWords): string {
  const y = `${duration.years} ${duration.years === 1 ? words.year : words.years}`;
  const m = `${duration.months} ${duration.months === 1 ? words.month : words.months}`;
  return `${y} ${words.connector} ${m}`;
}
