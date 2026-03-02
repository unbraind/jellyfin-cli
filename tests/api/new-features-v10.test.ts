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

describe('JellyfinApiClient - New Features v10', () => {
  let client: JellyfinApiClient;

  beforeEach(() => {
    client = new JellyfinApiClient({ serverUrl: 'http://localhost:8096', apiKey: 'test-key', userId: 'user-1' });
    mockFetch.mockReset();
  });
  afterEach(() => { vi.clearAllMocks(); });

  // -----------------------------------------------------------------------
  // getBackupManifest
  // -----------------------------------------------------------------------
  describe('getBackupManifest', () => {
    it('calls GET /Backup/Manifest with path param', async () => {
      mockFetch.mockResolvedValueOnce(mockOk({ Version: '1', Items: [] }));
      await client.getBackupManifest('/backups/jellyfin-2026-01-01.zip');
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('/Backup/Manifest');
      expect(url).toContain('path=');
      expect(mockFetch.mock.calls[0][1]).toMatchObject({ method: 'GET' });
    });

    it('returns manifest data', async () => {
      const manifest = { Version: '1', Items: ['users', 'plugins', 'settings'] };
      mockFetch.mockResolvedValueOnce(mockOk(manifest));
      const result = await client.getBackupManifest('/backups/test.zip');
      expect(result).toMatchObject(manifest);
    });

    it('sends path as query parameter', async () => {
      mockFetch.mockResolvedValueOnce(mockOk({ schema: 'v2' }));
      await client.getBackupManifest('/some/path/backup.zip');
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('path=');
    });
  });

  // -----------------------------------------------------------------------
  // Library notification hooks
  // -----------------------------------------------------------------------
  describe('notifyLibraryMediaUpdated', () => {
    it('calls POST /Library/Media/Updated', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.notifyLibraryMediaUpdated([{ Path: '/media/movie.mkv', UpdateType: 'Modified' }]);
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('/Library/Media/Updated');
      expect(mockFetch.mock.calls[0][1]).toMatchObject({ method: 'POST' });
    });

    it('sends path in body', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.notifyLibraryMediaUpdated([{ Path: '/movies/test.mkv' }]);
      const body = JSON.parse(mockFetch.mock.calls[0][1].body as string);
      expect(body[0].Path).toBe('/movies/test.mkv');
    });

    it('handles multiple updates', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.notifyLibraryMediaUpdated([
        { Path: '/movies/a.mkv' },
        { Path: '/movies/b.mkv' },
      ]);
      const body = JSON.parse(mockFetch.mock.calls[0][1].body as string);
      expect(body).toHaveLength(2);
    });
  });

  describe('notifyMoviesAdded', () => {
    it('calls POST /Library/Movies/Added', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.notifyMoviesAdded([{ Path: '/movies/new.mkv' }]);
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('/Library/Movies/Added');
      expect(mockFetch.mock.calls[0][1]).toMatchObject({ method: 'POST' });
    });

    it('sends update array in body', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.notifyMoviesAdded([{ Path: '/movies/new.mkv', UpdateType: 'Created' }]);
      const body = JSON.parse(mockFetch.mock.calls[0][1].body as string);
      expect(body[0].UpdateType).toBe('Created');
    });

    it('resolves without error', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await expect(client.notifyMoviesAdded([])).resolves.toBeUndefined();
    });
  });

  describe('notifyMoviesUpdated', () => {
    it('calls POST /Library/Movies/Updated', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.notifyMoviesUpdated([{ Path: '/movies/existing.mkv' }]);
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('/Library/Movies/Updated');
    });

    it('sends path in body', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.notifyMoviesUpdated([{ Path: '/test.mkv' }]);
      const body = JSON.parse(mockFetch.mock.calls[0][1].body as string);
      expect(body[0].Path).toBe('/test.mkv');
    });

    it('uses POST method', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.notifyMoviesUpdated([]);
      expect(mockFetch.mock.calls[0][1]).toMatchObject({ method: 'POST' });
    });
  });

  describe('notifySeriesAdded', () => {
    it('calls POST /Library/Series/Added', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.notifySeriesAdded([{ Path: '/tv/new-show' }]);
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('/Library/Series/Added');
      expect(mockFetch.mock.calls[0][1]).toMatchObject({ method: 'POST' });
    });

    it('sends series path', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.notifySeriesAdded([{ Path: '/tv/breaking-bad', UpdateType: 'Created' }]);
      const body = JSON.parse(mockFetch.mock.calls[0][1].body as string);
      expect(body[0].Path).toBe('/tv/breaking-bad');
    });

    it('resolves without error', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await expect(client.notifySeriesAdded([])).resolves.toBeUndefined();
    });
  });

  describe('notifySeriesUpdated', () => {
    it('calls POST /Library/Series/Updated', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.notifySeriesUpdated([{ Path: '/tv/show-s02' }]);
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('/Library/Series/Updated');
    });

    it('sends update body', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.notifySeriesUpdated([{ Path: '/tv/show' }]);
      const body = JSON.parse(mockFetch.mock.calls[0][1].body as string);
      expect(body[0].Path).toBe('/tv/show');
    });

    it('uses POST method', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.notifySeriesUpdated([]);
      expect(mockFetch.mock.calls[0][1]).toMatchObject({ method: 'POST' });
    });
  });

  // -----------------------------------------------------------------------
  // Meilisearch plugin
  // -----------------------------------------------------------------------
  describe('getMeilisearchStatus', () => {
    it('calls GET /meilisearch/status', async () => {
      mockFetch.mockResolvedValueOnce(mockOk({ connected: true, indexed: 5000 }));
      await client.getMeilisearchStatus();
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('/meilisearch/status');
      expect(mockFetch.mock.calls[0][1]).toMatchObject({ method: 'GET' });
    });

    it('returns status data', async () => {
      mockFetch.mockResolvedValueOnce(mockOk({ connected: true, version: '1.0.0' }));
      const result = await client.getMeilisearchStatus();
      expect(result).toMatchObject({ connected: true });
    });

    it('returns object type', async () => {
      mockFetch.mockResolvedValueOnce(mockOk({}));
      const result = await client.getMeilisearchStatus();
      expect(typeof result).toBe('object');
    });
  });

  describe('reconnectMeilisearch', () => {
    it('calls GET /meilisearch/reconnect', async () => {
      mockFetch.mockResolvedValueOnce(mockOk({ success: true }));
      await client.reconnectMeilisearch();
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('/meilisearch/reconnect');
    });

    it('returns result data', async () => {
      mockFetch.mockResolvedValueOnce(mockOk({ reconnected: true }));
      const result = await client.reconnectMeilisearch();
      expect(result).toMatchObject({ reconnected: true });
    });

    it('uses GET method', async () => {
      mockFetch.mockResolvedValueOnce(mockOk({}));
      await client.reconnectMeilisearch();
      expect(mockFetch.mock.calls[0][1]).toMatchObject({ method: 'GET' });
    });
  });

  describe('reindexMeilisearch', () => {
    it('calls GET /meilisearch/reindex', async () => {
      mockFetch.mockResolvedValueOnce(mockOk({ status: 'reindexing' }));
      await client.reindexMeilisearch();
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('/meilisearch/reindex');
    });

    it('returns reindex result', async () => {
      mockFetch.mockResolvedValueOnce(mockOk({ started: true, itemCount: 10000 }));
      const result = await client.reindexMeilisearch();
      expect(result).toMatchObject({ started: true });
    });

    it('uses GET method', async () => {
      mockFetch.mockResolvedValueOnce(mockOk({}));
      await client.reindexMeilisearch();
      expect(mockFetch.mock.calls[0][1]).toMatchObject({ method: 'GET' });
    });
  });

  // -----------------------------------------------------------------------
  // TMDb plugin
  // -----------------------------------------------------------------------
  describe('getTmdbClientConfiguration', () => {
    it('calls GET /Tmdb/ClientConfiguration', async () => {
      mockFetch.mockResolvedValueOnce(mockOk({ tmdbKey: 'abc123' }));
      await client.getTmdbClientConfiguration();
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('/Tmdb/ClientConfiguration');
      expect(mockFetch.mock.calls[0][1]).toMatchObject({ method: 'GET' });
    });

    it('returns config data', async () => {
      mockFetch.mockResolvedValueOnce(mockOk({ apiKey: 'key123', baseImageUrl: 'https://image.tmdb.org' }));
      const result = await client.getTmdbClientConfiguration();
      expect(result).toMatchObject({ apiKey: 'key123' });
    });

    it('returns object type', async () => {
      mockFetch.mockResolvedValueOnce(mockOk({ setting: 'value' }));
      const result = await client.getTmdbClientConfiguration();
      expect(typeof result).toBe('object');
    });
  });

  describe('refreshTmdbBoxSets', () => {
    it('calls POST /TMDbBoxSets/Refresh', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.refreshTmdbBoxSets();
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('/TMDbBoxSets/Refresh');
      expect(mockFetch.mock.calls[0][1]).toMatchObject({ method: 'POST' });
    });

    it('resolves without error', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await expect(client.refreshTmdbBoxSets()).resolves.toBeUndefined();
    });

    it('sends POST request with no body', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.refreshTmdbBoxSets();
      const call = mockFetch.mock.calls[0][1];
      expect(call.method).toBe('POST');
    });
  });

  // -----------------------------------------------------------------------
  // Telegram notifier plugin
  // -----------------------------------------------------------------------
  describe('testTelegramNotifier', () => {
    it('calls GET /TelegramNotifierApi/TestNotifier', async () => {
      mockFetch.mockResolvedValueOnce(mockOk({ sent: true }));
      await client.testTelegramNotifier();
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('/TelegramNotifierApi/TestNotifier');
      expect(mockFetch.mock.calls[0][1]).toMatchObject({ method: 'GET' });
    });

    it('returns test result', async () => {
      mockFetch.mockResolvedValueOnce(mockOk({ success: true, message: 'Test sent' }));
      const result = await client.testTelegramNotifier();
      expect(result).toMatchObject({ success: true });
    });

    it('returns object type', async () => {
      mockFetch.mockResolvedValueOnce(mockOk({ status: 'ok' }));
      const result = await client.testTelegramNotifier();
      expect(typeof result).toBe('object');
    });
  });

  // -----------------------------------------------------------------------
  // InfuseSync plugin
  // -----------------------------------------------------------------------
  describe('createInfuseSyncCheckpoint', () => {
    it('calls POST /InfuseSync/Checkpoint', async () => {
      mockFetch.mockResolvedValueOnce(mockOk({ CheckpointId: 'cp-123' }));
      await client.createInfuseSyncCheckpoint();
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('/InfuseSync/Checkpoint');
      expect(mockFetch.mock.calls[0][1]).toMatchObject({ method: 'POST' });
    });

    it('returns checkpoint ID', async () => {
      mockFetch.mockResolvedValueOnce(mockOk({ CheckpointId: 'cp-abc' }));
      const result = await client.createInfuseSyncCheckpoint();
      expect(result.CheckpointId).toBe('cp-abc');
    });

    it('returns object with CheckpointId', async () => {
      mockFetch.mockResolvedValueOnce(mockOk({ CheckpointId: 'test-id' }));
      const result = await client.createInfuseSyncCheckpoint();
      expect(result).toHaveProperty('CheckpointId');
    });
  });

  describe('startInfuseSyncCheckpoint', () => {
    it('calls POST /InfuseSync/Checkpoint/:id/StartSync', async () => {
      mockFetch.mockResolvedValueOnce(mockOk({ status: 'started' }));
      await client.startInfuseSyncCheckpoint('cp-123');
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('/InfuseSync/Checkpoint/cp-123/StartSync');
      expect(mockFetch.mock.calls[0][1]).toMatchObject({ method: 'POST' });
    });

    it('returns sync result', async () => {
      mockFetch.mockResolvedValueOnce(mockOk({ progress: 0, total: 1000 }));
      const result = await client.startInfuseSyncCheckpoint('cp-1');
      expect(result).toMatchObject({ progress: 0 });
    });

    it('encodes checkpoint ID in URL', async () => {
      mockFetch.mockResolvedValueOnce(mockOk({}));
      await client.startInfuseSyncCheckpoint('cp with spaces');
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('cp%20with%20spaces');
    });
  });

  describe('getInfuseSyncRemovedItems', () => {
    it('calls GET /InfuseSync/Checkpoint/:id/RemovedItems', async () => {
      mockFetch.mockResolvedValueOnce(mockOk({ Items: [] }));
      await client.getInfuseSyncRemovedItems('cp-123');
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('/InfuseSync/Checkpoint/cp-123/RemovedItems');
      expect(mockFetch.mock.calls[0][1]).toMatchObject({ method: 'GET' });
    });

    it('returns removed items data', async () => {
      mockFetch.mockResolvedValueOnce(mockOk({ Items: ['id1', 'id2'], Count: 2 }));
      const result = await client.getInfuseSyncRemovedItems('cp-1');
      expect(result).toMatchObject({ Count: 2 });
    });

    it('returns object', async () => {
      mockFetch.mockResolvedValueOnce(mockOk({}));
      const result = await client.getInfuseSyncRemovedItems('cp-1');
      expect(typeof result).toBe('object');
    });
  });

  describe('getInfuseSyncUpdatedItems', () => {
    it('calls GET /InfuseSync/Checkpoint/:id/UpdatedItems', async () => {
      mockFetch.mockResolvedValueOnce(mockOk({ Items: [] }));
      await client.getInfuseSyncUpdatedItems('cp-456');
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('/InfuseSync/Checkpoint/cp-456/UpdatedItems');
    });

    it('returns updated items', async () => {
      mockFetch.mockResolvedValueOnce(mockOk({ Items: [{ Id: 'item1' }] }));
      const result = await client.getInfuseSyncUpdatedItems('cp-1');
      expect(result).toBeDefined();
    });

    it('uses GET method', async () => {
      mockFetch.mockResolvedValueOnce(mockOk({}));
      await client.getInfuseSyncUpdatedItems('cp-1');
      expect(mockFetch.mock.calls[0][1]).toMatchObject({ method: 'GET' });
    });
  });

  describe('getInfuseSyncUserData', () => {
    it('calls GET /InfuseSync/Checkpoint/:id/UserData', async () => {
      mockFetch.mockResolvedValueOnce(mockOk({ Data: [] }));
      await client.getInfuseSyncUserData('cp-789');
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('/InfuseSync/Checkpoint/cp-789/UserData');
    });

    it('returns user data', async () => {
      mockFetch.mockResolvedValueOnce(mockOk({ Data: [{ UserId: 'u1' }] }));
      const result = await client.getInfuseSyncUserData('cp-1');
      expect(result).toBeDefined();
    });

    it('uses GET method', async () => {
      mockFetch.mockResolvedValueOnce(mockOk({}));
      await client.getInfuseSyncUserData('cp-1');
      expect(mockFetch.mock.calls[0][1]).toMatchObject({ method: 'GET' });
    });
  });

  describe('getInfuseSyncUserFolders', () => {
    it('calls GET /InfuseSync/UserFolders/:userId', async () => {
      mockFetch.mockResolvedValueOnce(mockOk({ Folders: [] }));
      await client.getInfuseSyncUserFolders('user-1');
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('/InfuseSync/UserFolders/user-1');
    });

    it('uses current userId if not specified', async () => {
      mockFetch.mockResolvedValueOnce(mockOk({ Folders: [] }));
      await client.getInfuseSyncUserFolders();
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('/InfuseSync/UserFolders/user-1');
    });

    it('returns folders data', async () => {
      mockFetch.mockResolvedValueOnce(mockOk({ Folders: [{ Id: 'f1', Name: 'Movies' }] }));
      const result = await client.getInfuseSyncUserFolders('u1');
      expect(result).toBeDefined();
    });
  });

  // -----------------------------------------------------------------------
  // getTrailers (already in client, verify still works)
  // -----------------------------------------------------------------------
  describe('getTrailers', () => {
    it('calls GET /Trailers', async () => {
      mockFetch.mockResolvedValueOnce(mockOk({ Items: [], TotalRecordCount: 0 }));
      await client.getTrailers();
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('/Trailers');
      expect(mockFetch.mock.calls[0][1]).toMatchObject({ method: 'GET' });
    });

    it('passes limit and offset', async () => {
      mockFetch.mockResolvedValueOnce(mockOk({ Items: [], TotalRecordCount: 0 }));
      await client.getTrailers({ limit: 10, startIndex: 20 });
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('limit=10');
      expect(url).toContain('startIndex=20');
    });

    it('returns Items array', async () => {
      const items = [{ Id: 'tr1', Name: 'Movie Trailer', Type: 'Trailer' }];
      mockFetch.mockResolvedValueOnce(mockOk({ Items: items, TotalRecordCount: 1 }));
      const result = await client.getTrailers();
      expect(result.Items).toHaveLength(1);
      expect(result.Items![0].Name).toBe('Movie Trailer');
    });
  });
});
