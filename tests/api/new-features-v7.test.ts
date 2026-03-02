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

describe('JellyfinApiClient - New Features v7', () => {
  let client: JellyfinApiClient;

  beforeEach(() => {
    client = new JellyfinApiClient({ serverUrl: 'http://localhost:8096', apiKey: 'test-key', userId: 'user-1' });
    mockFetch.mockReset();
  });
  afterEach(() => { vi.clearAllMocks(); });

  // -----------------------------------------------------------------------
  // Instant Mix variants
  // -----------------------------------------------------------------------
  describe('InstantMix API', () => {
    it('getArtistInstantMix calls /Artists/:id/InstantMix', async () => {
      const data = { Items: [{ Id: 'song-1', Name: 'Song', Type: 'Audio' }], TotalRecordCount: 1 };
      mockFetch.mockResolvedValueOnce(mockOk(data));
      const result = await client.getArtistInstantMix('artist-1', { limit: 10 });
      expect(result.Items).toHaveLength(1);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/Artists/artist-1/InstantMix'),
        expect.anything(),
      );
    });

    it('getArtistInstantMix includes userId in query', async () => {
      mockFetch.mockResolvedValueOnce(mockOk({ Items: [], TotalRecordCount: 0 }));
      await client.getArtistInstantMix('artist-2');
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('userId=user-1');
    });

    it('getMusicGenreInstantMix calls /MusicGenres/:name/InstantMix with encoding', async () => {
      const data = { Items: [{ Id: 'song-2', Name: 'Track', Type: 'Audio' }], TotalRecordCount: 1 };
      mockFetch.mockResolvedValueOnce(mockOk(data));
      const result = await client.getMusicGenreInstantMix('Rock Music', { limit: 20 });
      expect(result.Items).toHaveLength(1);
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('/MusicGenres/Rock%20Music/InstantMix');
    });

    it('getMusicGenreInstantMix includes userId in query', async () => {
      mockFetch.mockResolvedValueOnce(mockOk({ Items: [], TotalRecordCount: 0 }));
      await client.getMusicGenreInstantMix('Jazz');
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('userId=user-1');
    });
  });

  // -----------------------------------------------------------------------
  // DisplayPreferences
  // -----------------------------------------------------------------------
  describe('DisplayPreferences', () => {
    it('getDisplayPreferences auto-injects userId and client', async () => {
      const data = { Id: 'pref-1', SortBy: 'SortName', Client: 'emby' };
      mockFetch.mockResolvedValueOnce(mockOk(data));
      const result = await client.getDisplayPreferences('pref-1');
      expect(result.Id).toBe('pref-1');
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('/DisplayPreferences/pref-1');
      expect(url).toContain('userId=user-1');
      expect(url).toContain('client=emby');
    });

    it('getDisplayPreferences accepts custom userId and client', async () => {
      mockFetch.mockResolvedValueOnce(mockOk({ Id: 'pref-2', Client: 'emby2' }));
      await client.getDisplayPreferences('pref-2', 'other-user', 'myapp');
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('userId=other-user');
      expect(url).toContain('client=myapp');
    });

    it('updateDisplayPreferences sends POST with userId and client in query', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.updateDisplayPreferences('pref-1', { SortBy: 'DateCreated' });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/DisplayPreferences/pref-1'),
        expect.objectContaining({ method: 'POST' }),
      );
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('userId=user-1');
      expect(url).toContain('client=emby');
    });

    it('updateDisplayPreferences accepts custom client', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.updateDisplayPreferences('pref-2', { SortBy: 'SortName' }, undefined, 'customclient');
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('client=customclient');
    });
  });

  // -----------------------------------------------------------------------
  // Playback session reporting (PlayingItems endpoints)
  // -----------------------------------------------------------------------
  describe('PlayingItems playback reporting', () => {
    it('reportPlayingItemStart sends POST to /PlayingItems/:id', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.reportPlayingItemStart('item-1', { mediaSourceId: 'src-1', positionTicks: 0 });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/PlayingItems/item-1'),
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('reportPlayingItemStart works without optional params', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await expect(client.reportPlayingItemStart('item-2')).resolves.toBeUndefined();
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('/PlayingItems/item-2');
    });

    it('reportPlayingItemProgress sends POST to /PlayingItems/:id/Progress', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.reportPlayingItemProgress('item-1', { positionTicks: 50000, isPaused: false });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/PlayingItems/item-1/Progress'),
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('reportPlayingItemStopped sends DELETE to /PlayingItems/:id', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.reportPlayingItemStopped('item-1', { positionTicks: 100000 });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/PlayingItems/item-1'),
        expect.objectContaining({ method: 'DELETE' }),
      );
    });

    it('reportPlayingItemStopped works without optional params', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await expect(client.reportPlayingItemStopped('item-3')).resolves.toBeUndefined();
    });
  });

  // -----------------------------------------------------------------------
  // Ping playback session
  // -----------------------------------------------------------------------
  describe('pingPlaybackSession', () => {
    it('pingPlaybackSession sends POST to /Sessions/Playing/Ping', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.pingPlaybackSession('play-session-xyz');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/Sessions/Playing/Ping'),
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('pingPlaybackSession includes PlaySessionId in body', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.pingPlaybackSession('session-abc');
      const callArgs = mockFetch.mock.calls[0][1] as RequestInit;
      const body = JSON.parse(callArgs.body as string);
      expect(body.PlaySessionId).toBe('session-abc');
    });
  });

  // -----------------------------------------------------------------------
  // Usage Stats (PlaybackReportingActivity plugin)
  // -----------------------------------------------------------------------
  describe('Usage Stats API', () => {
    it('getUsagePlayActivity calls /user_usage_stats/PlayActivity', async () => {
      const data = [{ user_id: 'user-1', user_name: 'Steve', user_usage: { '2026-03-01': 5 } }];
      mockFetch.mockResolvedValueOnce(mockOk(data));
      const result = await client.getUsagePlayActivity({ days: 7 });
      expect(result).toBeDefined();
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('/user_usage_stats/PlayActivity');
      expect(url).toContain('days=7');
    });

    it('getUserActivity calls /user_usage_stats/user_activity', async () => {
      mockFetch.mockResolvedValueOnce(mockOk([]));
      await client.getUserActivity({ days: 30 });
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('/user_usage_stats/user_activity');
    });

    it('getHourlyReport calls /user_usage_stats/HourlyReport', async () => {
      mockFetch.mockResolvedValueOnce(mockOk({}));
      await client.getHourlyReport({ days: 14 });
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('/user_usage_stats/HourlyReport');
    });

    it('getBreakdownReport calls correct endpoint with breakdownType', async () => {
      mockFetch.mockResolvedValueOnce(mockOk({}));
      await client.getBreakdownReport('MediaType', { days: 30 });
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('/user_usage_stats/MediaType/BreakdownReport');
    });

    it('getBreakdownReport encodes breakdownType with special chars', async () => {
      mockFetch.mockResolvedValueOnce(mockOk({}));
      await client.getBreakdownReport('Video Codec', { days: 7 });
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('/user_usage_stats/Video%20Codec/BreakdownReport');
    });

    it('getMoviesReport calls /user_usage_stats/MoviesReport', async () => {
      const data = [{ label: 'Movie', count: 3, time: 300 }];
      mockFetch.mockResolvedValueOnce(mockOk(data));
      const result = await client.getMoviesReport({ days: 30 });
      expect(result).toBeDefined();
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('/user_usage_stats/MoviesReport');
    });

    it('getTvShowsReport calls /user_usage_stats/GetTvShowsReport', async () => {
      mockFetch.mockResolvedValueOnce(mockOk([]));
      await client.getTvShowsReport();
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('/user_usage_stats/GetTvShowsReport');
    });

    it('getDurationHistogramReport calls /user_usage_stats/DurationHistogramReport', async () => {
      mockFetch.mockResolvedValueOnce(mockOk({}));
      await client.getDurationHistogramReport({ dataType: 'count' });
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('/user_usage_stats/DurationHistogramReport');
    });

    it('getUsageUserList calls /user_usage_stats/user_list', async () => {
      const data = [{ name: 'Steve', id: 'user-1', in_list: false }];
      mockFetch.mockResolvedValueOnce(mockOk(data));
      const result = await client.getUsageUserList();
      expect(result).toBeDefined();
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('/user_usage_stats/user_list');
    });

    it('getUsageTypeFilterList calls /user_usage_stats/type_filter_list', async () => {
      mockFetch.mockResolvedValueOnce(mockOk(['Movie', 'Episode']));
      const result = await client.getUsageTypeFilterList();
      expect(result).toBeDefined();
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('/user_usage_stats/type_filter_list');
    });

    it('getUserReportData calls /user_usage_stats/:userId/:date/GetItems', async () => {
      mockFetch.mockResolvedValueOnce(mockOk([]));
      await client.getUserReportData('user-1', '2026-03-01');
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('/user_usage_stats/user-1/2026-03-01/GetItems');
    });
  });
});
