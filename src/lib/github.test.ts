import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchRepo, mergeProjects } from './github';
import type { ProjectSeed } from '../data/projects';

// design.md §6 / §11: fetchRepo must never throw — any failure degrades to
// `null`, and mergeProjects must never throw either — it falls back to the
// seed with `stale: true` per item.

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('fetchRepo', () => {
  it('returns null on a non-2xx response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }));
    const result = await fetchRepo('owner', 'repo');
    expect(result).toBeNull();
  });

  it('returns null on a network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')));
    const result = await fetchRepo('owner', 'repo');
    expect(result).toBeNull();
  });

  it('returns null when the request is aborted (timeout)', async () => {
    // Replace AbortSignal.timeout with a signal we control, then abort it
    // mid-flight to simulate the real 5s timeout firing — deterministic,
    // no need to wait out a real 5000ms clock.
    const controller = new AbortController();
    vi.spyOn(AbortSignal, 'timeout').mockReturnValue(controller.signal);
    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string, opts: { signal: AbortSignal }) => {
        return new Promise((_resolve, reject) => {
          opts.signal.addEventListener('abort', () => {
            reject(new DOMException('The operation was aborted.', 'TimeoutError'));
          });
        });
      })
    );

    const promise = fetchRepo('owner', 'repo');
    controller.abort();
    const result = await promise;

    expect(result).toBeNull();
  });
});

describe('mergeProjects', () => {
  const withRepo: ProjectSeed = {
    id: 'with-repo',
    name: 'With Repo',
    description: { es: '', en: '', de: '', fr: '', ru: '' },
    stack: [],
    repoUrl: 'https://github.com/owner/repo',
    isExample: false,
  };
  const exampleSeed: ProjectSeed = {
    id: 'example',
    name: 'Example',
    description: { es: '', en: '', de: '', fr: '', ru: '' },
    stack: [],
    isExample: true,
  };
  const noRepoUrlSeed: ProjectSeed = {
    id: 'no-repo-url',
    name: 'No Repo URL',
    description: { es: '', en: '', de: '', fr: '', ru: '' },
    stack: [],
    isExample: false,
  };

  it('never throws and falls back to seed + stale:true when fetchRepo fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')));

    const result = await mergeProjects([withRepo]);

    expect(result).toEqual([{ ...withRepo, stale: true }]);
  });

  it('skips the fetch entirely for isExample and no-repoUrl seeds', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false });
    vi.stubGlobal('fetch', fetchMock);

    const result = await mergeProjects([exampleSeed, noRepoUrlSeed]);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result).toEqual([exampleSeed, noRepoUrlSeed]);
  });

  it('merges live metadata for a successful fetch, alongside skipped seeds', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ stargazers_count: 5, language: 'TypeScript', pushed_at: '2026-01-01T00:00:00Z' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await mergeProjects([withRepo, exampleSeed]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result[0]).toMatchObject({ stars: 5, primaryLanguage: 'TypeScript', lastUpdated: '2026-01-01T00:00:00Z' });
    expect(result[1]).toEqual(exampleSeed);
  });
});
