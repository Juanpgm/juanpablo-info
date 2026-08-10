/**
 * Builds a `wa.me` link from `site.whatsapp` (design.md §7: pure, no I/O).
 * Returns `null` when `number` is empty so callers can conditionally render
 * the WhatsApp button only once a real number is configured.
 */
export function getWhatsAppHref(number: string, message?: string): string | null {
  const digits = number.replace(/\D/g, '');
  if (!digits) return null;

  const query = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${digits}${query}`;
}
