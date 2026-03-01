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

describe('JellyfinApiClient - Coverage Completion', () => {
  let client: JellyfinApiClient;

  beforeEach(() => {
    client = new JellyfinApiClient({
      serverUrl: 'http://localhost:8096',
      apiKey: 'test-key',
      userId: 'user-1',
    });
    mockFetch.mockReset();
  });

  afterEach(() => { vi.clearAllMocks(); });

  describe('Session Control - Missing Methods', () => {
    it('should set repeat mode', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.setRepeatMode('session-1', 'RepeatAll');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/Sessions/session-1/RepeatMode'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should set shuffle mode', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.setShuffleMode('session-1', 'Shuffle');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/Sessions/session-1/Shuffle'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should send system command', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.sendSystemCommand('session-1', 'ToggleMute');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/Sessions/session-1/System/ToggleMute'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should set volume', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.setVolume('session-1', 75);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/Sessions/session-1/System/SetVolume'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should report playback start', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.reportPlaybackStart({
        ItemId: 'item-1',
        SessionId: 'session-1',
        MediaSourceId: 'source-1',
        AudioStreamIndex: 0,
        SubtitleStreamIndex: -1,
        IsPaused: false,
        IsMuted: false,
        PositionTicks: 0,
        VolumeLevel: 100,
        PlayMethod: 'DirectPlay',
      });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/Sessions/Playing'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should report playback progress', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.reportPlaybackProgress({
        ItemId: 'item-1',
        PositionTicks: 12345678,
        IsPaused: false,
        IsMuted: false,
        VolumeLevel: 100,
        PlayMethod: 'DirectPlay',
      });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/Sessions/Playing/Progress'),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  describe('setUserId - syncModules', () => {
    it('should sync all sub-modules when userId is updated', async () => {
      // setUserId triggers syncModules which recreates all sub-API modules with new userId
      client.setUserId('new-user-id');
      expect(client.getUserId()).toBe('new-user-id');

      // Verify the new userId is used in subsequent requests
      const mockResult = { Items: [], TotalRecordCount: 0 };
      mockFetch.mockResolvedValueOnce(mockOk(mockResult));
      await client.getChannels();
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('userId=new-user-id'),
        expect.anything()
      );
    });

    it('should sync suggestions module with new userId', async () => {
      client.setUserId('synced-user');
      mockFetch.mockResolvedValueOnce(mockOk({ Items: [], TotalRecordCount: 0 }));
      await client.getSuggestions();
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/Users/synced-user/Suggestions'),
        expect.anything()
      );
    });

    it('should sync trickplay module after userId update', () => {
      client.setUserId('trickplay-user');
      // getTrickplayHlsPlaylistUrl doesn't use userId but should still work after sync
      const url = client.getTrickplayHlsPlaylistUrl('item-1', 240);
      expect(url).toContain('/Videos/item-1/Trickplay/240/tiles.m3u8');
    });
  });

  describe('getIntros', () => {
    it('should get intros for an item', async () => {
      const mockIntros = [{ Id: 'intro-1', Name: 'Intro' }];
      mockFetch.mockResolvedValueOnce(mockOk(mockIntros));
      const result = await client.getIntros('item-1');
      expect(result).toHaveLength(1);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/Users/user-1/Items/item-1/Intros'),
        expect.anything()
      );
    });

    it('should get intros when userId is set on client', async () => {
      mockFetch.mockResolvedValueOnce(mockOk([]));
      const result = await client.getIntros('item-2');
      expect(result).toEqual([]);
    });
  });

  describe('getItems - without userId', () => {
    it('should use /Items endpoint when no userId', async () => {
      const clientNoUser = new JellyfinApiClient({ serverUrl: 'http://localhost:8096', apiKey: 'key' });
      mockFetch.mockResolvedValueOnce(mockOk({ Items: [], TotalRecordCount: 0 }));
      await clientNoUser.getItems();
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8096/Items',
        expect.anything()
      );
    });
  });

  describe('getItem - without userId', () => {
    it('should use /Items endpoint when no userId', async () => {
      const clientNoUser = new JellyfinApiClient({ serverUrl: 'http://localhost:8096', apiKey: 'key' });
      mockFetch.mockResolvedValueOnce(mockOk({ Id: 'item-1', Name: 'Test' }));
      await clientNoUser.getItem('item-1');
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8096/Items/item-1',
        expect.anything()
      );
    });
  });

  describe('Package delegation methods', () => {
    it('should cancel package installation via client', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.cancelPackageInstallation('install-abc');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/Packages/Installing/install-abc'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('should get repositories via client', async () => {
      const mockRepos = [{ Name: 'Official', Url: 'https://repo.jellyfin.org' }];
      mockFetch.mockResolvedValueOnce(mockOk(mockRepos));
      const result = await client.getRepositories();
      expect(result).toEqual(mockRepos);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/Repositories'),
        expect.anything()
      );
    });
  });

  describe('reportPlaybackProgress - explicit test', () => {
    it('should call /Sessions/Playing/Progress endpoint', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      const info = { ItemId: 'item-1', PositionTicks: 99999 };
      await client.reportPlaybackProgress(info);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain('/Sessions/Playing/Progress');
    });
  });
});
