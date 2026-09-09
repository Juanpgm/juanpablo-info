/**
 * Pure server-side helpers for the admin lead follow-up toggle (mirrors
 * contact-form.ts's pure-function pattern — no I/O, no framework, fully
 * unit-testable). Called from the `POST` handler in `pages/admin.astro`,
 * which is the trust boundary for a mutating admin form submission — these
 * parsers are deliberately strict rather than lenient.
 */

/**
 * Parses a `contact_submissions.id` from raw form data. Only a string
 * matching `/^\d+$/` is accepted (no leading `+`/`-`, no decimals, no
 * internal or surrounding whitespace) — this is a security boundary for a
 * mutating admin POST, not a UX text field, so no whitespace-trimming
 * leniency is applied. A real id is a `SERIAL` starting at 1, so `'0'` and
 * negative values are rejected. Values are also bounded by
 * `Number.MAX_SAFE_INTEGER` so an oversized numeric string can never
 * silently produce an unsafe/wrong id.
 */
export function parseLeadId(raw: FormDataEntryValue | null): number | null {
  if (typeof raw !== 'string') return null;
  if (!/^\d+$/.test(raw)) return null;

  const value = Number(raw);
  if (!Number.isSafeInteger(value)) return null;
  if (value < 1) return null;

  return value;
}

export type ContactedAction = 'mark' | 'unmark';

/**
 * Resolves the follow-up toggle's `action` form field to a known action.
 * Only the exact strings `'mark'` and `'unmark'` are accepted — anything
 * else (missing, wrong type, unknown value, wrong case) is rejected.
 */
export function resolveContactedAction(raw: FormDataEntryValue | null): ContactedAction | null {
  if (raw === 'mark') return 'mark';
  if (raw === 'unmark') return 'unmark';
  return null;
}
