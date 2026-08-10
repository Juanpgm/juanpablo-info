// getViteConfig wires up Astro's virtual modules (e.g. `astro:i18n`) so
// `lib/locale-path.test.ts` can import `switchLocalePath` unmodified.
/// <reference types="vitest/config" />
import { getViteConfig } from 'astro/config';

export default getViteConfig({
  test: {},
});
