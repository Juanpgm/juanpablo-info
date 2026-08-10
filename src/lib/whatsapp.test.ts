import { describe, expect, it } from 'vitest';
import { getWhatsAppHref } from './whatsapp';

// design.md §7: pure link-builder, no fake numbers ever shipped — empty
// input must yield null so callers can hide the button.
describe('getWhatsAppHref', () => {
  it('returns null for an empty number', () => {
    expect(getWhatsAppHref('')).toBeNull();
  });

  it('builds a clean base URL with no message', () => {
    expect(getWhatsAppHref('573001234567')).toBe('https://wa.me/573001234567');
  });

  it('appends a URL-encoded text param when a message is given', () => {
    expect(getWhatsAppHref('573001234567', 'Hola, vi tu portafolio')).toBe(
      'https://wa.me/573001234567?text=Hola%2C%20vi%20tu%20portafolio'
    );
  });

  it('strips non-digit characters from a formatted number', () => {
    expect(getWhatsAppHref('+57 300 123 4567')).toBe('https://wa.me/573001234567');
  });
});
