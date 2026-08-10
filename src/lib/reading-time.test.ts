import { describe, expect, it } from 'vitest';
import { readingTimeMinutes } from './reading-time';

// design.md §11: words / 200 wpm, Math.ceil, floored to a minimum of 1.
const words = (n: number) => Array.from({ length: n }, () => 'word').join(' ');

describe('readingTimeMinutes', () => {
  it('rounds exactly 200 words down to 1 minute (no partial minute)', () => {
    expect(readingTimeMinutes(words(200))).toBe(1);
  });

  it('rounds up 1 word over the 200-word boundary to 2 minutes', () => {
    expect(readingTimeMinutes(words(201))).toBe(2);
  });

  it('floors an empty string to 1 minute, never 0', () => {
    expect(readingTimeMinutes('')).toBe(1);
    expect(readingTimeMinutes('   ')).toBe(1);
  });

  it('computes minutes for a long text', () => {
    expect(readingTimeMinutes(words(1000))).toBe(5);
  });
});
