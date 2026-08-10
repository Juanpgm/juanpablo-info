/**
 * Post-launch bugfix: content dates (`startDate`, `endDate`, `pubDate`,
 * `updatedDate`) are date-only strings (`"YYYY-MM-DD"`), coerced by
 * `z.coerce.date()` as UTC midnight. Reading/formatting them with
 * timezone-local APIs (`.getFullYear()`, `Intl.DateTimeFormat` without
 * `timeZone`) shifts the displayed calendar date backwards in any
 * negative-UTC-offset zone (e.g. a Jan 1 date renders as Dec 31 of the
 * previous year). Pin every read to UTC so the displayed date always matches
 * the source content, regardless of the machine's local timezone.
 */

import type { ExperienceDurationWords } from './experience-duration';

/** UTC-safe replacement for `date.getFullYear()` on a date-only value. */
export function getCalendarYear(date: Date): number {
  return date.getUTCFullYear();
}

/** `Intl.DateTimeFormat.format`, pinned to UTC so a date-only value never shifts. */
export function formatCalendarDate(date: Date, locale: string, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(locale, { ...options, timeZone: 'UTC' }).format(date);
}

export interface CalendarDuration {
  years: number;
  months: number;
}

/**
 * Same years/months-elapsed algorithm as `experience-duration.ts`'s
 * `getExperienceDuration`, but UTC-pinned — for content dates (`startDate`/
 * `endDate`), NOT the Home page's live local-"today" counter. Do not read
 * these with `.getFullYear()`/`.getMonth()`/`.getDate()`; that's the exact
 * bug class fixed by `getCalendarYear`/`formatCalendarDate` above.
 */
export function getCalendarDuration(startDate: Date, endDate: Date): CalendarDuration {
  let years = endDate.getUTCFullYear() - startDate.getUTCFullYear();
  let months = endDate.getUTCMonth() - startDate.getUTCMonth();
  if (endDate.getUTCDate() < startDate.getUTCDate()) months--;
  if (months < 0) {
    years--;
    months += 12;
  }
  return { years, months };
}

/** "6 meses" under a year, "3 años 5 meses" at a year or more — compact, for per-role duration display. */
export function formatCalendarDuration(duration: CalendarDuration, words: ExperienceDurationWords): string {
  const m = `${duration.months} ${duration.months === 1 ? words.month : words.months}`;
  if (duration.years === 0) return m;
  const y = `${duration.years} ${duration.years === 1 ? words.year : words.years}`;
  return duration.months === 0 ? y : `${y} ${m}`;
}
