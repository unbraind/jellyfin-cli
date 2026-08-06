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
