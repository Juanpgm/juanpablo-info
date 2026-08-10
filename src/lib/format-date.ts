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

/** UTC-safe replacement for `date.getFullYear()` on a date-only value. */
export function getCalendarYear(date: Date): number {
  return date.getUTCFullYear();
}

/** `Intl.DateTimeFormat.format`, pinned to UTC so a date-only value never shifts. */
export function formatCalendarDate(date: Date, locale: string, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(locale, { ...options, timeZone: 'UTC' }).format(date);
}
