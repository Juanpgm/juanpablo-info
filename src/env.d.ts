/// <reference types="astro/client" />

interface ImportMetaEnv {
  /** Optional; only raises the unauthenticated GitHub REST rate limit at build time. */
  readonly GITHUB_TOKEN?: string;
}
