import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChannelsApi } from '../../src/api/channels.js';
import { MusicGenresApi } from '../../src/api/musicgenres.js';
import { SuggestionsApi } from '../../src/api/suggestions.js';
import { TrickplayApi } from '../../src/api/trickplay.js';
import { YearsApi } from '../../src/api/years.js';
import { TvShowsApi } from '../../src/api/tvshows.js';
import { JellyfinApiError } from '../../src/api/types.js';

const mockFetch = vi.fn();
global.fetch = mockFetch;

function mockOk(data: unknown) {
  return {
    ok: true, status: 200, statusText: 'OK',
    headers: { get: (n: string) => n === 'content-type' ? 'application/json' : null },
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  };
}

const BASE_CONFIG = { serverUrl: 'http://localhost:8096', apiKey: 'test-key', userId: 'user-1' };

describe('ChannelsApi', () => {
  let api: ChannelsApi;

  beforeEach(() => {
    api = new ChannelsApi(BASE_CONFIG);
    mockFetch.mockReset();
  });

  it('should get channels', async () => {
    mockFetch.mockResolvedValueOnce(mockOk({ Items: [], TotalRecordCount: 0 }));
    const result = await api.getChannels();
    expect(result.Items).toEqual([]);
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/Channels'), expect.anything());
  });

  it('should get channels with filter params', async () => {
    mockFetch.mockResolvedValueOnce(mockOk({ Items: [{ Id: 'ch-1', Name: 'Channel 1' }], TotalRecordCount: 1 }));
    const result = await api.getChannels({ limit: 10, supportsLatestItems: true, isFavorite: false });
    expect(result.Items).toHaveLength(1);
  });

  it('should get all channel features', async () => {
    mockFetch.mockResolvedValueOnce(mockOk([{ SupportsLatestItems: true }]));
    const result = await api.getAllChannelFeatures();
    expect(result).toHaveLength(1);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/Channels/Features'),
      expect.anything()
    );
  });

  it('should get channel features for specific channel', async () => {
    mockFetch.mockResolvedValueOnce(mockOk({ SupportsMediaDeletion: false, MaxPageSize: 100 }));
    const result = await api.getChannelFeatures('ch-1');
    expect(result.MaxPageSize).toBe(100);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/Channels/ch-1/Features'),
      expect.anything()
    );
  });

  it('should get channel items', async () => {
    mockFetch.mockResolvedValueOnce(mockOk({ Items: [{ Id: 'item-1' }], TotalRecordCount: 1 }));
    const result = await api.getChannelItems('ch-1', { limit: 20, sortBy: 'DateCreated' });
    expect(result.Items).toHaveLength(1);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/Channels/ch-1/Items'),
      expect.anything()
    );
  });

  it('should get latest channel items', async () => {
    mockFetch.mockResolvedValueOnce(mockOk([{ Id: 'latest-1' }]));
    const result = await api.getLatestChannelItems('ch-1', { limit: 5 });
    expect(result).toHaveLength(1);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/Channels/ch-1/Latest'),
      expect.anything()
    );
  });
});

describe('MusicGenresApi', () => {
  let api: MusicGenresApi;

  beforeEach(() => {
    api = new MusicGenresApi(BASE_CONFIG);
    mockFetch.mockReset();
  });

  it('should get music genres', async () => {
    mockFetch.mockResolvedValueOnce(mockOk({ Items: [{ Id: 'g1', Name: 'Rock' }], TotalRecordCount: 1 }));
    const result = await api.getMusicGenres();
    expect(result.Items).toHaveLength(1);
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/MusicGenres'), expect.anything());
  });

  it('should get music genres with params', async () => {
    mockFetch.mockResolvedValueOnce(mockOk({ Items: [], TotalRecordCount: 0 }));
    await api.getMusicGenres({ limit: 10, sortBy: 'SortName', sortOrder: 'Ascending' });
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('sortBy=SortName'), expect.anything());
  });

  it('should get a specific music genre', async () => {
    mockFetch.mockResolvedValueOnce(mockOk({ Id: 'g1', Name: 'Rock' }));
    const result = await api.getMusicGenre('Rock');
    expect(result.Name).toBe('Rock');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/MusicGenres/Rock'),
      expect.anything()
    );
  });

  it('should URL-encode genre name', async () => {
    mockFetch.mockResolvedValueOnce(mockOk({ Id: 'g2', Name: 'Hip Hop' }));
    await api.getMusicGenre('Hip Hop');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/MusicGenres/Hip%20Hop'),
      expect.anything()
    );
  });
});

describe('SuggestionsApi', () => {
  let api: SuggestionsApi;

  beforeEach(() => {
    api = new SuggestionsApi(BASE_CONFIG);
    mockFetch.mockReset();
  });

  it('should get suggestions', async () => {
    const mockData = { Items: [{ Id: 'item-1', Name: 'Suggested Movie' }], TotalRecordCount: 1 };
    mockFetch.mockResolvedValueOnce(mockOk(mockData));
    const result = await api.getSuggestions();
    expect(result).toHaveLength(1);
    expect(result[0].Name).toBe('Suggested Movie');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/Users/user-1/Suggestions'),
      expect.anything()
    );
  });

  it('should return empty array when no suggestions', async () => {
    mockFetch.mockResolvedValueOnce(mockOk({ Items: [], TotalRecordCount: 0 }));
    const result = await api.getSuggestions({ limit: 5 });
    expect(result).toEqual([]);
  });

  it('should throw when no user ID', async () => {
    const apiNoUser = new SuggestionsApi({ serverUrl: 'http://localhost:8096', apiKey: 'key' });
    await expect(apiNoUser.getSuggestions()).rejects.toThrow('User ID required');
  });
});

describe('TrickplayApi', () => {
  let api: TrickplayApi;

  beforeEach(() => {
    api = new TrickplayApi(BASE_CONFIG);
  });

  it('should build trickplay HLS playlist URL without mediaSourceId', () => {
    const url = api.getTrickplayHlsPlaylistUrl('item-1', 240);
    expect(url).toContain('/Videos/item-1/Trickplay/240/tiles.m3u8');
    expect(url).toContain('width=240');
    expect(url).not.toContain('mediaSourceId');
  });

  it('should build trickplay HLS playlist URL with mediaSourceId', () => {
    const url = api.getTrickplayHlsPlaylistUrl('item-1', 320, { mediaSourceId: 'src-1' });
    expect(url).toContain('/Videos/item-1/Trickplay/320/tiles.m3u8');
    expect(url).toContain('mediaSourceId=src-1');
  });

  it('should build trickplay tile image URL', () => {
    const url = api.getTrickplayTileImageUrl('item-1', 240, 5);
    expect(url).toContain('/Videos/item-1/Trickplay/240/5.jpg');
    expect(url).not.toContain('mediaSourceId');
  });

  it('should build trickplay tile image URL with mediaSourceId', () => {
    const url = api.getTrickplayTileImageUrl('item-1', 240, 3, { mediaSourceId: 'src-abc' });
    expect(url).toContain('/Videos/item-1/Trickplay/240/3.jpg');
    expect(url).toContain('mediaSourceId=src-abc');
  });
});

describe('YearsApi', () => {
  let api: YearsApi;

  beforeEach(() => {
    api = new YearsApi(BASE_CONFIG);
    mockFetch.mockReset();
  });

  it('should get years', async () => {
    mockFetch.mockResolvedValueOnce(mockOk({ Items: [{ Id: 'y2020', Name: '2020' }], TotalRecordCount: 1 }));
    const result = await api.getYears();
    expect(result.Items).toHaveLength(1);
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/Years'), expect.anything());
  });

  it('should get years with sort options', async () => {
    mockFetch.mockResolvedValueOnce(mockOk({ Items: [], TotalRecordCount: 0 }));
    await api.getYears({ sortBy: 'ProductionYear', sortOrder: 'Descending', limit: 20 });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('sortBy=ProductionYear'),
      expect.anything()
    );
  });

  it('should get a specific year', async () => {
    mockFetch.mockResolvedValueOnce(mockOk({ Id: 'y2020', Name: '2020', Type: 'Year' }));
    const result = await api.getYear(2020);
    expect(result.Name).toBe('2020');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/Years/2020'),
      expect.anything()
    );
  });
});

describe('TvShowsApi', () => {
  let api: TvShowsApi;

  beforeEach(() => {
    api = new TvShowsApi(BASE_CONFIG);
    mockFetch.mockReset();
  });

  it('should get episodes for a series', async () => {
    mockFetch.mockResolvedValueOnce(mockOk({ Items: [{ Id: 'ep-1', Name: 'Pilot' }], TotalRecordCount: 1 }));
    const result = await api.getEpisodes('series-1');
    expect(result.Items).toHaveLength(1);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/Shows/series-1/Episodes'),
      expect.anything()
    );
  });

  it('should get episodes with season filter', async () => {
    mockFetch.mockResolvedValueOnce(mockOk({ Items: [], TotalRecordCount: 0 }));
    await api.getEpisodes('series-1', { season: 2, limit: 10, isMissing: false });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('season=2'),
      expect.anything()
    );
  });

  it('should get seasons for a series', async () => {
    mockFetch.mockResolvedValueOnce(mockOk({ Items: [{ Id: 's1', Name: 'Season 1' }], TotalRecordCount: 1 }));
    const result = await api.getSeasons('series-1');
    expect(result.Items).toHaveLength(1);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/Shows/series-1/Seasons'),
      expect.anything()
    );
  });

  it('should get next up episodes', async () => {
    mockFetch.mockResolvedValueOnce(mockOk({ Items: [{ Id: 'ep-next' }], TotalRecordCount: 1 }));
    const result = await api.getNextUpEpisodes({ limit: 5 });
    expect(result.Items).toHaveLength(1);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/Shows/NextUp'),
      expect.anything()
    );
  });

  it('should get upcoming episodes', async () => {
    mockFetch.mockResolvedValueOnce(mockOk({ Items: [{ Id: 'ep-upcoming' }], TotalRecordCount: 1 }));
    const result = await api.getUpcomingEpisodes({ limit: 10 });
    expect(result.Items).toHaveLength(1);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/Shows/Upcoming'),
      expect.anything()
    );
  });
});

describe('JellyfinApiError', () => {
  it('should create error with message only', () => {
    const err = new JellyfinApiError('Something went wrong');
    expect(err.message).toBe('Something went wrong');
    expect(err.statusCode).toBeUndefined();
    expect(err.details).toBeUndefined();
  });

  it('should create error with status code and details', () => {
    const err = new JellyfinApiError('Not Found', 404, { reason: 'missing' });
    expect(err.message).toBe('Not Found');
    expect(err.statusCode).toBe(404);
    expect(err.details).toEqual({ reason: 'missing' });
  });

  it('should be instanceof Error', () => {
    const err = new JellyfinApiError('test');
    expect(err instanceof Error).toBe(true);
    expect(err instanceof JellyfinApiError).toBe(true);
  });
});
