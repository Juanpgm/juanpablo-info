// Build-time GitHub enrichment (design.md §6). Runs once per `astro build`
// via top-level `await` in page frontmatter — never called client-side.
// Never throws: any failure (network, non-2xx, timeout, missing repo)
// degrades to `null` so the caller can fall back to the seed + `stale: true`.
import type { ProjectSeed } from '../data/projects';

export interface RepoMeta {
  stars: number;
  primaryLanguage: string | null;
  lastUpdated: string;
}

export async function fetchRepo(owner: string, repo: string, token?: string): Promise<RepoMeta | null> {
  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null; // 403 rate-limit, 404, etc.
    const json = await res.json();
    return {
      stars: json.stargazers_count,
      primaryLanguage: json.language,
      lastUpdated: json.pushed_at,
    };
  } catch {
    return null; // network error, timeout/abort, malformed JSON
  }
}

export type EnrichedProject = ProjectSeed & {
  stars?: number | null;
  primaryLanguage?: string | null;
  lastUpdated?: string | null;
  stale?: boolean;
};

/** Extracts `{owner, repo}` from a GitHub repo URL, or `null` if unparseable. */
function parseRepoUrl(repoUrl: string): { owner: string; repo: string } | null {
  const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+?)\/?$/);
  if (!match) return null;
  return { owner: match[1], repo: match[2].replace(/\.git$/, '') };
}

/**
 * Enriches project seeds with live GitHub metadata. Seeds with `isExample:
 * true` or no `repoUrl` skip the fetch entirely. Uses `Promise.allSettled`
 * across the (small, 2-3 item) project list — no sequential delay needed at
 * this scale (design.md §6).
 */
export async function mergeProjects(seed: ProjectSeed[], token?: string): Promise<EnrichedProject[]> {
  const results = await Promise.allSettled(
    seed.map(async (project): Promise<EnrichedProject> => {
      if (project.isExample || !project.repoUrl) return project;
      const parsed = parseRepoUrl(project.repoUrl);
      if (!parsed) return { ...project, stale: true };
      const meta = await fetchRepo(parsed.owner, parsed.repo, token);
      if (!meta) return { ...project, stale: true };
      return { ...project, ...meta };
    })
  );
  return results.map((result, i) => (result.status === 'fulfilled' ? result.value : { ...seed[i], stale: true }));
}
