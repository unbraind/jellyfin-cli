import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { JellyfinApiClient } from '../../src/api/client.js';

const mockFetch = vi.fn();
global.fetch = mockFetch;

function createMockResponse(data: unknown, options: { ok?: boolean; status?: number; contentType?: string } = {}) {
  const { ok = true, status = 200, contentType = 'application/json' } = options;
  return {
    ok,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    headers: { get: (name: string) => name === 'content-type' ? contentType : null },
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(typeof data === 'string' ? data : JSON.stringify(data)),
  };
}

describe('JellyfinApiClient New Features', () => {
  let client: JellyfinApiClient;

  beforeEach(() => {
    client = new JellyfinApiClient({ serverUrl: 'http://localhost:8096', apiKey: 'test-key', userId: 'user-1' });
    mockFetch.mockReset();
  });

  afterEach(() => vi.clearAllMocks());

  describe('TV Shows', () => {
    it('should get episodes', async () => {
      const mockData = { Items: [{ Id: 'ep1', Name: 'Episode 1' }], TotalRecordCount: 1 };
      mockFetch.mockResolvedValueOnce(createMockResponse(mockData));
      const result = await client.getEpisodes('series-1', { season: 1 });
      expect(result.Items).toHaveLength(1);
    });

    it('should get seasons', async () => {
      const mockData = { Items: [{ Id: 's1', Name: 'Season 1' }], TotalRecordCount: 1 };
      mockFetch.mockResolvedValueOnce(createMockResponse(mockData));
      const result = await client.getSeasons('series-1');
      expect(result.Items).toHaveLength(1);
    });

    it('should get next up episodes', async () => {
      const mockData = { Items: [{ Id: 'ep1', Name: 'Next Episode' }], TotalRecordCount: 1 };
      mockFetch.mockResolvedValueOnce(createMockResponse(mockData));
      const result = await client.getNextUpEpisodes({ limit: 10 });
      expect(result.Items).toHaveLength(1);
    });

    it('should get upcoming episodes', async () => {
      const mockData = { Items: [{ Id: 'ep1', Name: 'Upcoming' }], TotalRecordCount: 1 };
      mockFetch.mockResolvedValueOnce(createMockResponse(mockData));
      const result = await client.getUpcomingEpisodes({ limit: 10 });
      expect(result.Items).toHaveLength(1);
    });
  });

  describe('Packages', () => {
    it('should get packages', async () => {
      const mockData = [{ guid: 'pkg-1', name: 'Test Plugin', category: 'General' }];
      mockFetch.mockResolvedValueOnce(createMockResponse(mockData));
      const result = await client.getPackages();
      expect(result[0]?.name).toBe('Test Plugin');
    });

    it('should get package info', async () => {
      const mockData = { guid: 'pkg-1', name: 'Test Plugin', versions: [] };
      mockFetch.mockResolvedValueOnce(createMockResponse(mockData));
      const result = await client.getPackageInfo('pkg-1');
      expect(result.name).toBe('Test Plugin');
    });

    it('should install package', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(null, { status: 204 }));
      await expect(client.installPackage('pkg-1', '1.0.0')).resolves.toBeUndefined();
    });

    it('should cancel package installation', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(null, { status: 204 }));
      await expect(client.cancelPackageInstallation('inst-1')).resolves.toBeUndefined();
    });
  });

  describe('Years', () => {
    it('should get years', async () => {
      const mockData = { Items: [{ Id: 'y1', Name: '2024' }], TotalRecordCount: 1 };
      mockFetch.mockResolvedValueOnce(createMockResponse(mockData));
      const result = await client.getYears();
      expect(result.Items).toHaveLength(1);
    });

    it('should get specific year', async () => {
      const mockData = { Id: 'y1', Name: '2024' };
      mockFetch.mockResolvedValueOnce(createMockResponse(mockData));
      const result = await client.getYear(2024);
      expect(result.Name).toBe('2024');
    });
  });

  describe('Music Genres', () => {
    it('should get music genres', async () => {
      const mockData = { Items: [{ Id: 'mg1', Name: 'Rock' }], TotalRecordCount: 1 };
      mockFetch.mockResolvedValueOnce(createMockResponse(mockData));
      const result = await client.getMusicGenres();
      expect(result.Items).toHaveLength(1);
    });

    it('should get music genre by name', async () => {
      const mockData = { Id: 'mg1', Name: 'Rock' };
      mockFetch.mockResolvedValueOnce(createMockResponse(mockData));
      const result = await client.getMusicGenre('Rock');
      expect(result.Name).toBe('Rock');
    });
  });

  describe('Suggestions', () => {
    it('should get suggestions', async () => {
      const mockData = { Items: [{ Id: 's1', Name: 'Suggested Movie' }], TotalRecordCount: 1 };
      mockFetch.mockResolvedValueOnce(createMockResponse(mockData));
      const result = await client.getSuggestions({ limit: 10 });
      expect(result).toHaveLength(1);
    });
  });

  describe('Channels', () => {
    it('should get channels', async () => {
      const mockData = { Items: [{ Id: 'ch1', Name: 'Channel 1' }], TotalRecordCount: 1 };
      mockFetch.mockResolvedValueOnce(createMockResponse(mockData));
      const result = await client.getChannels();
      expect(result.Items).toHaveLength(1);
    });

    it('should get all channel features', async () => {
      const mockData = [{ SupportsMediaDeletion: true }];
      mockFetch.mockResolvedValueOnce(createMockResponse(mockData));
      const result = await client.getAllChannelFeatures();
      expect(result).toHaveLength(1);
    });

    it('should get channel features', async () => {
      const mockData = { SupportsMediaDeletion: true };
      mockFetch.mockResolvedValueOnce(createMockResponse(mockData));
      const result = await client.getChannelFeatures('ch1');
      expect(result.SupportsMediaDeletion).toBe(true);
    });

    it('should get channel items', async () => {
      const mockData = { Items: [{ Id: 'i1' }], TotalRecordCount: 1 };
      mockFetch.mockResolvedValueOnce(createMockResponse(mockData));
      const result = await client.getChannelItems('ch1');
      expect(result.Items).toHaveLength(1);
    });

    it('should get latest channel items', async () => {
      const mockData = [{ Id: 'i1' }];
      mockFetch.mockResolvedValueOnce(createMockResponse(mockData));
      const result = await client.getLatestChannelItems('ch1');
      expect(result).toHaveLength(1);
    });
  });

  describe('Images', () => {
    it('should get item images', async () => {
      const mockData = [{ Type: 'Primary', Width: 1920, Height: 1080 }];
      mockFetch.mockResolvedValueOnce(createMockResponse(mockData));
      const result = await client.getItemImages('item-1');
      expect(result).toHaveLength(1);
    });

    it('should generate image URL', () => {
      const url = client.getItemImage('item-1', 'Primary', { maxWidth: 500 });
      expect(url).toContain('/Items/item-1/Images/Primary');
      expect(url).toContain('maxWidth=500');
    });

    it('should delete item image', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(null, { status: 204 }));
      await expect(client.deleteItemImage('item-1', 'Backdrop', 0)).resolves.toBeUndefined();
    });

    it('should generate user image URL', () => {
      const url = client.getUserImage('user-1', 'Primary', { maxWidth: 200 });
      expect(url).toContain('/Users/user-1/Images/Primary');
    });

    it('should delete user image', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(null, { status: 204 }));
      await expect(client.deleteUserImage('user-1', 'Primary')).resolves.toBeUndefined();
    });
  });

  describe('Trickplay', () => {
    it('should generate trickplay HLS playlist URL', () => {
      const url = client.getTrickplayHlsPlaylistUrl('item-1', 320);
      expect(url).toContain('/Videos/item-1/Trickplay/320/tiles.m3u8');
    });

    it('should generate trickplay tile image URL', () => {
      const url = client.getTrickplayTileImageUrl('item-1', 320, 5);
      expect(url).toContain('/Videos/item-1/Trickplay/320/5.jpg');
    });
  });
});
