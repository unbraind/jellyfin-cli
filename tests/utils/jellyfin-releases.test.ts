import { describe, expect, it, vi } from 'vitest';
import {
  discoverJellyfinReleases,
  probeConfiguredJellyfinVersion,
  resolveJellyfinVersionSelector,
} from '../../src/utils/jellyfin-releases.js';

const CONFIG = {
  serverUrl: 'http://127.0.0.1:8096',
  apiKey: 'must-not-leave-origin',
  timeout: 5000,
};

const RELEASES = [
  {
    tag_name: 'v12.0-rc4',
    name: '12.0 RC4',
    html_url: 'https://github.com/jellyfin/jellyfin/releases/tag/v12.0-rc4',
    published_at: '2026-08-02T22:23:46Z',
    draft: false,
    prerelease: true,
  },
  {
    tag_name: 'v10.11.11',
    name: '10.11.11',
    html_url: 'https://github.com/jellyfin/jellyfin/releases/tag/v10.11.11',
    published_at: '2026-06-06T16:18:54Z',
    draft: false,
    prerelease: false,
  },
];

describe('official Jellyfin release discovery', () => {
  it('selects current stable and preview releases without forwarding Jellyfin auth', async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json([
      { ...RELEASES[0], draft: true },
      { tag_name: 'nightly', draft: false, prerelease: true },
      ...RELEASES,
    ]));
    const result = await discoverJellyfinReleases(1000, fetcher);

    expect(result.stable.version).toBe('10.11.11');
    expect(result.preview?.version).toBe('12.0-rc4');
    expect(fetcher).toHaveBeenCalledOnce();
    expect(fetcher.mock.calls[0]?.[1]?.headers).not.toHaveProperty('Authorization');
    expect(fetcher.mock.calls[0]?.[1]?.headers).not.toHaveProperty('X-Emby-Token');
  });

  it('follows trusted GitHub pagination until a stable release is found', async () => {
    const secondPageUrl = 'https://api.github.com/repositories/161012019/releases?per_page=100&page=2';
    const fetcher = vi.fn()
      .mockResolvedValueOnce(Response.json([RELEASES[0]], {
        headers: { Link: `<${secondPageUrl}>; rel="next"` },
      }))
      .mockResolvedValueOnce(Response.json([RELEASES[1]]));

    const result = await discoverJellyfinReleases(5000, fetcher);

    expect(result.stable.version).toBe('10.11.11');
    expect(result.preview?.version).toBe('12.0-rc4');
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(fetcher.mock.calls[1]?.[0]).toBe(secondPageUrl);
    expect(fetcher.mock.calls[1]?.[1]?.headers).not.toHaveProperty('X-Emby-Token');
  });

  it('rejects cross-origin release pagination links', async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json(RELEASES, {
      headers: { Link: '<https://example.com/releases?page=2>; rel="next"' },
    }));
    await expect(discoverJellyfinReleases(5000, fetcher))
      .rejects.toThrow('unsafe pagination URL');
  });

  it('bounds release pagination and rejects invalid next links', async () => {
    const samePageUrl = 'https://api.github.com/repos/jellyfin/jellyfin/releases?page=2';
    const loopingFetcher = vi.fn().mockImplementation(() => Promise.resolve(Response.json([], {
      headers: { Link: `<${samePageUrl}>; rel="next"` },
    })));
    await expect(discoverJellyfinReleases(5000, loopingFetcher))
      .rejects.toThrow('exceeded 20 pages');
    expect(loopingFetcher).toHaveBeenCalledTimes(20);

    const invalidLinkFetcher = vi.fn().mockResolvedValue(Response.json(RELEASES, {
      headers: { Link: '<not a URL>; rel="next"' },
    }));
    await expect(discoverJellyfinReleases(5000, invalidLinkFetcher))
      .rejects.toThrow('invalid pagination URL');
  });

  it('fails closed for transport and malformed release payloads', async () => {
    await expect(discoverJellyfinReleases(5000, vi.fn().mockResolvedValue(
      new Response('limited', { status: 403 }),
    ))).rejects.toThrow('HTTP 403');
    await expect(discoverJellyfinReleases(5000, vi.fn().mockResolvedValue(
      Response.json({ releases: [] }),
    ))).rejects.toThrow('invalid payload');
    await expect(discoverJellyfinReleases(5000, vi.fn().mockResolvedValue(
      Response.json([RELEASES[0]]),
    ))).rejects.toThrow('no stable release');
  });

  it('resolves exact and moving selectors with explicit preview opt-in', async () => {
    const fetcher = vi.fn().mockImplementation(() => Promise.resolve(Response.json(RELEASES)));
    await expect(resolveJellyfinVersionSelector(CONFIG, '10.11.11')).resolves.toBe('10.11.11');
    await expect(resolveJellyfinVersionSelector(CONFIG, 'latest-stable', false, fetcher))
      .resolves.toBe('10.11.11');
    await expect(resolveJellyfinVersionSelector(CONFIG, 'latest-preview', true, fetcher))
      .resolves.toBe('12.0-rc4');
    await expect(resolveJellyfinVersionSelector(CONFIG, 'latest-preview', false, fetcher))
      .rejects.toThrow('requires --allow-prerelease');
    await expect(resolveJellyfinVersionSelector(
      CONFIG,
      'latest-preview',
      true,
      vi.fn().mockResolvedValue(Response.json([RELEASES[1]])),
    )).rejects.toThrow('no preview release');
  });

  it('probes only the configured public version endpoint', async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json({ Version: '10.11.11' }));
    await expect(probeConfiguredJellyfinVersion(CONFIG, fetcher)).resolves.toBe('10.11.11');
    expect(fetcher.mock.calls[0]?.[0]).toBe('http://127.0.0.1:8096/System/Info/Public');
    expect(fetcher.mock.calls[0]?.[1]?.headers).toBeUndefined();
    await expect(probeConfiguredJellyfinVersion({ serverUrl: '' }, fetcher)).resolves.toBeNull();
    await expect(probeConfiguredJellyfinVersion(
      CONFIG,
      vi.fn().mockResolvedValue(new Response('down', { status: 503 })),
    )).rejects.toThrow('HTTP 503');
    await expect(probeConfiguredJellyfinVersion(
      CONFIG,
      vi.fn().mockResolvedValue(Response.json({ Version: '../invalid' })),
    )).rejects.toThrow('invalid version');
  });
});
