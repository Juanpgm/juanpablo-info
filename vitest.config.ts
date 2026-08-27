// getViteConfig wires up Astro's virtual modules (e.g. `astro:i18n`) so
// `lib/locale-path.test.ts` can import `switchLocalePath` unmodified.
/// <reference types="vitest/config" />
import { getViteConfig } from 'astro/config';

export default getViteConfig({
  test: {
    // Nested git worktrees (e.g. .claude/worktrees/*) carry their own copy of
    // the repo, including their own test files — exclude them so `npm test`
    // from the main tree doesn't pick up other worktrees' (possibly stale) code.
    exclude: ['**/node_modules/**', '**/.claude/worktrees/**'],
  },
});
