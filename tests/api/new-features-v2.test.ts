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
    headers: {
      get: (name: string) => name === 'content-type' ? contentType : null,
    },
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(typeof data === 'string' ? data : JSON.stringify(data)),
  };
}

describe('JellyfinApiClient - New Features', () => {
  let client: JellyfinApiClient;

  beforeEach(() => {
    client = new JellyfinApiClient({
      serverUrl: 'http://localhost:8096',
      apiKey: 'test-api-key',
      userId: 'test-user-id',
    });
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Collections API', () => {
    it('should create a collection', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ Id: 'collection-123' }));
      const result = await client.createCollection({ name: 'My Collection' });
      expect(result.Id).toBe('collection-123');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/Collections'),
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('should create collection with items', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ Id: 'collection-123' }));
      await client.createCollection({ name: 'My Collection', ids: ['item1', 'item2'] });
      const call = mockFetch.mock.calls[0];
      const url = call[0] as string;
      expect(url).toContain('ids=item1%2Citem2');
    });

    it('should add items to collection', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(null, { status: 204 }));
      await client.addToCollection('collection-123', ['item1', 'item2']);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/Collections/collection-123/Items'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should remove items from collection', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(null, { status: 204 }));
      await client.removeFromCollection('collection-123', ['item1', 'item2']);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/Collections/collection-123/Items'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  describe('Live TV Timers API', () => {
    it('should create a timer', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(null, { status: 204 }));
      await client.createLiveTvTimer({
        channelId: 'channel-1',
        name: 'My Recording',
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-01-01T01:00:00Z',
      });
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8096/LiveTv/Timers',
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should update a timer', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(null, { status: 204 }));
      await client.updateLiveTvTimer('timer-123', {
        name: 'Updated Recording',
      });
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8096/LiveTv/Timers/timer-123',
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should delete a timer', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(null, { status: 204 }));
      await client.deleteLiveTvTimer('timer-123');
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8096/LiveTv/Timers/timer-123',
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('should get series timers', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ Items: [] }));
      const result = await client.getLiveTvSeriesTimers();
      expect(result).toBeDefined();
    });

    it('should get series timer by id', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ Id: 'series-timer-1' }));
      const result = await client.getLiveTvSeriesTimer('series-timer-1');
      expect(result.Id).toBe('series-timer-1');
    });

    it('should delete series timer', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(null, { status: 204 }));
      await client.deleteLiveTvSeriesTimer('series-timer-1');
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8096/LiveTv/SeriesTimers/series-timer-1',
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  describe('Playlist API', () => {
    it('should delete a playlist', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(null, { status: 204 }));
      await client.deletePlaylist('playlist-123');
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8096/Playlists/playlist-123',
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  describe('Task Triggers API', () => {
    it('should get task triggers', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse([
        { Id: 'trigger-1', Type: 'DailyTrigger' },
      ]));
      const result = await client.getTaskTriggers('task-123');
      expect(result).toHaveLength(1);
      expect(result[0].Id).toBe('trigger-1');
    });

    it('should create task trigger', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(null, { status: 204 }));
      await client.createTaskTrigger('task-123', { type: 'DailyTrigger' });
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8096/ScheduledTasks/task-123/Triggers',
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should delete task trigger', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(null, { status: 204 }));
      await client.deleteTaskTrigger('task-123', 'trigger-1');
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8096/ScheduledTasks/task-123/Triggers/trigger-1',
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  describe('Entity Lookup API', () => {
    it('should get artist by name', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ Id: 'artist-1', Name: 'Test Artist' }));
      const result = await client.getArtistByName('Test Artist');
      expect(result.Name).toBe('Test Artist');
    });

    it('should get genre by name', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ Id: 'genre-1', Name: 'Action' }));
      const result = await client.getGenreByName('Action');
      expect(result.Name).toBe('Action');
    });

    it('should get studio by name', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ Id: 'studio-1', Name: 'Universal' }));
      const result = await client.getStudioByName('Universal');
      expect(result.Name).toBe('Universal');
    });

    it('should get person by name', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ Id: 'person-1', Name: 'John Doe' }));
      const result = await client.getPersonByName('John Doe');
      expect(result.Name).toBe('John Doe');
    });
  });

  describe('Session Capabilities API', () => {
    it('should report session capabilities (write-only endpoint)', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(null, { status: 204 }));
      await client.reportSessionCapabilities({
        playableMediaTypes: ['Video', 'Audio'],
        supportsMediaControl: true,
      });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/Sessions/Capabilities'),
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('should report session capabilities', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(null, { status: 204 }));
      await client.reportSessionCapabilities({
        playableMediaTypes: ['Video'],
        supportsMediaControl: true,
      });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/Sessions/Capabilities'),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  describe('Volume API', () => {
    it('should set volume with level', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(null, { status: 204 }));
      await client.setVolume('session-123', 50);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/Sessions/session-123/System/SetVolume'),
        expect.objectContaining({
          method: 'POST',
        })
      );
      const call = mockFetch.mock.calls[0];
      const url = call[0] as string;
      expect(url).toContain('volume=50');
    });
  });
});
