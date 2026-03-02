import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { JellyfinApiClient } from '../../src/api/client.js';

const mockFetch = vi.fn();
global.fetch = mockFetch;

function mockOk(data: unknown, status = 200) {
  return {
    ok: true, status, statusText: 'OK',
    headers: { get: (n: string) => n === 'content-type' ? 'application/json' : null },
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(status === 204 ? '' : JSON.stringify(data)),
  };
}
function mockNoContent() {
  return { ok: true, status: 204, statusText: 'No Content', headers: { get: () => null }, text: () => Promise.resolve('') };
}

describe('JellyfinApiClient - New Features v6', () => {
  let client: JellyfinApiClient;

  beforeEach(() => {
    client = new JellyfinApiClient({ serverUrl: 'http://localhost:8096', apiKey: 'test-key', userId: 'user-1' });
    mockFetch.mockReset();
  });
  afterEach(() => { vi.clearAllMocks(); });

  // -----------------------------------------------------------------------
  // Lyrics management
  // -----------------------------------------------------------------------
  describe('Lyrics management', () => {
    it('getLyrics returns LyricsInfo', async () => {
      const data = { Metadata: { Artist: 'Artist', Title: 'Song' }, Lyrics: [{ Text: 'Hello', Start: 0 }] };
      mockFetch.mockResolvedValueOnce(mockOk(data));
      const result = await client.getLyrics('item-1');
      expect(result.Metadata?.Artist).toBe('Artist');
      expect(result.Lyrics).toHaveLength(1);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/Audio/item-1/Lyrics'),
        expect.anything(),
      );
    });

    it('uploadLyrics sends POST to /Audio/:id/Lyrics', async () => {
      const data = { Metadata: { IsSynced: false }, Lyrics: [{ Text: 'Hello', Start: null }] };
      mockFetch.mockResolvedValueOnce(mockOk(data));
      const result = await client.uploadLyrics('item-2', { language: 'en', isSynced: false, data: 'Hello' });
      expect(result.Lyrics).toHaveLength(1);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/Audio/item-2/Lyrics'),
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('deleteLyrics sends DELETE to /Audio/:id/Lyrics', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await expect(client.deleteLyrics('item-3')).resolves.toBeUndefined();
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/Audio/item-3/Lyrics'),
        expect.objectContaining({ method: 'DELETE' }),
      );
    });

    it('searchRemoteLyrics sends GET to /Audio/:id/RemoteSearch/Lyrics', async () => {
      const data = [{ Id: 'lyric-1', Name: 'My Lyrics', ProviderName: 'OpenSubtitles' }];
      mockFetch.mockResolvedValueOnce(mockOk(data));
      const result = await client.searchRemoteLyrics('item-4');
      expect(result).toHaveLength(1);
      expect(result[0].ProviderName).toBe('OpenSubtitles');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/Audio/item-4/RemoteSearch/Lyrics'),
        expect.anything(),
      );
    });

    it('downloadRemoteLyrics sends POST to /Audio/:id/RemoteSearch/Lyrics/:lyricId', async () => {
      const data = { Metadata: { IsSynced: true }, Lyrics: [{ Text: 'Line 1', Start: 1000 }] };
      mockFetch.mockResolvedValueOnce(mockOk(data));
      const result = await client.downloadRemoteLyrics('item-5', 'lyric-abc');
      expect(result.Lyrics).toHaveLength(1);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/Audio/item-5/RemoteSearch/Lyrics/lyric-abc'),
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('downloadRemoteLyrics URL-encodes lyricId with special chars', async () => {
      const data = { Metadata: null, Lyrics: [] };
      mockFetch.mockResolvedValueOnce(mockOk(data));
      await client.downloadRemoteLyrics('item-6', 'lyric id/with spaces');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('lyric%20id%2Fwith%20spaces'),
        expect.anything(),
      );
    });
  });

  // -----------------------------------------------------------------------
  // Bitrate test
  // -----------------------------------------------------------------------
  describe('Bitrate test', () => {
    it('testBitrate sends GET to /Playback/BitrateTest', async () => {
      mockFetch.mockResolvedValueOnce(mockOk(0));
      await client.testBitrate(500000);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/Playback/BitrateTest'),
        expect.anything(),
      );
    });

    it('testBitrate without size omits size param', async () => {
      mockFetch.mockResolvedValueOnce(mockOk(0));
      await client.testBitrate();
      const url = (mockFetch.mock.calls[0] as unknown[])[0] as string;
      expect(url).toContain('/Playback/BitrateTest');
    });

    it('testBitrate with size includes size param', async () => {
      mockFetch.mockResolvedValueOnce(mockOk(0));
      await client.testBitrate(1000000);
      const url = (mockFetch.mock.calls[0] as unknown[])[0] as string;
      expect(url).toContain('size=1000000');
    });
  });

  // -----------------------------------------------------------------------
  // Sessions logout
  // -----------------------------------------------------------------------
  describe('Sessions logout', () => {
    it('logoutSession sends POST to /Sessions/Logout', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await expect(client.logoutSession()).resolves.toBeUndefined();
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/Sessions/Logout'),
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });

  // -----------------------------------------------------------------------
  // Sessions capabilities (write-only endpoint)
  // -----------------------------------------------------------------------
  describe('Sessions capabilities', () => {
    it('reportSessionCapabilities sends POST to /Sessions/Capabilities', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.reportSessionCapabilities({
        playableMediaTypes: ['Video'],
        supportedCommands: ['Play'],
        supportsMediaControl: true,
      });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/Sessions/Capabilities'),
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('reportSessionCapabilities without supportsMediaControl', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.reportSessionCapabilities({ playableMediaTypes: ['Audio'] });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/Sessions/Capabilities'),
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });
});
