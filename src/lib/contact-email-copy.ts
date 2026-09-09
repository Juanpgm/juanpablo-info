/**
 * Localized copy for the sender acknowledgement email (design: contact form
 * leads, "Fase 2" §2.1). Kept out of `src/i18n/*.json` deliberately: `t()` is
 * typed as `Record<UIKey, string>` (no per-key parameters like `greeting`),
 * and `src/i18n/index.ts` re-exports `astro:i18n` — importing it at runtime
 * here would drag Astro's virtual i18n module into this pure lib and its unit
 * tests. `import type { Locale } from '../i18n'` is safe: type-only imports
 * are erased at compile time, so no runtime import happens.
 */
import type { Locale } from '../i18n';

export interface AckCopy {
  subject: string;
  greeting: (name: string) => string;
  body: string;
  signoff: string;
}

const SIGNOFF_NAME = 'Juan Pablo Guzmán Martínez';

export const ackCopy: Partial<Record<Locale, AckCopy>> = {
  es: {
    subject: 'Recibí tu mensaje',
    greeting: (name: string) => `Hola ${name},`,
    body: 'Recibí tu mensaje a través del formulario de juanpablo.info y te responderé dentro de las próximas 48 horas. Mientras tanto, podés encontrarme en LinkedIn.',
    signoff: `Saludos,\n${SIGNOFF_NAME}`,
  },
  en: {
    subject: 'I received your message',
    greeting: (name: string) => `Hi ${name},`,
    body: 'I received your message through the form at juanpablo.info and will reply within 48 hours. In the meantime you can find me on LinkedIn.',
    signoff: `Best regards,\n${SIGNOFF_NAME}`,
  },
  de: {
    subject: 'Ich habe deine Nachricht erhalten',
    greeting: (name: string) => `Hallo ${name},`,
    body: 'Ich habe deine Nachricht über das Formular auf juanpablo.info erhalten und werde innerhalb von 48 Stunden antworten. In der Zwischenzeit findest du mich auf LinkedIn.',
    signoff: `Viele Grüße,\n${SIGNOFF_NAME}`,
  },
  fr: {
    subject: "J'ai bien reçu votre message",
    greeting: (name: string) => `Bonjour ${name},`,
    body: "J'ai reçu votre message via le formulaire de juanpablo.info et je vous répondrai dans un délai de 48 heures. En attendant, vous pouvez me retrouver sur LinkedIn.",
    signoff: `Cordialement,\n${SIGNOFF_NAME}`,
  },
  ru: {
    subject: 'Я получил ваше сообщение',
    greeting: (name: string) => `Здравствуйте, ${name}!`,
    body: 'Я получил ваше сообщение через форму на juanpablo.info и отвечу в течение 48 часов. А пока вы можете найти меня в LinkedIn.',
    signoff: `С уважением,\n${SIGNOFF_NAME}`,
  },
};

/** Fallback chain: locale → en → es (mirrors `src/i18n/index.ts#t`). */
export function resolveAckCopy(locale: string): AckCopy {
  return ackCopy[locale as Locale] ?? ackCopy.en ?? (ackCopy.es as AckCopy);
}
