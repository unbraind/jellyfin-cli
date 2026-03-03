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

describe('JellyfinApiClient Extended', () => {
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

  describe('User Management', () => {
    it('should create a user', async () => {
      const mockUser = { Id: 'new-user-id', Name: 'TestUser' };
      mockFetch.mockResolvedValueOnce(createMockResponse(mockUser));

      const result = await client.createUser({ Name: 'TestUser', Password: 'pass' });
      expect(result).toEqual(mockUser);
    });

    it('should delete a user', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 204, headers: { get: () => null }, text: () => Promise.resolve('') });

      await client.deleteUser('user-id');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/Users/user-id'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('should update user password', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 204, headers: { get: () => null }, text: () => Promise.resolve('') });

      await client.updateUserPassword('user-id', { CurrentPw: 'old', NewPw: 'new' });
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe('Quick Connect', () => {
    it('should check if Quick Connect is enabled', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(true));

      const result = await client.quickConnectEnabled();
      expect(result).toBe(true);
    });

    it('should initiate Quick Connect', async () => {
      const mockResult = { Secret: 'secret', Code: '123456' };
      mockFetch.mockResolvedValueOnce(createMockResponse(mockResult));

      const result = await client.quickConnectInitiate();
      expect(result.Secret).toBe('secret');
      expect(result.Code).toBe('123456');
    });
  });

  describe('Localization', () => {
    it('should get localization options', async () => {
      const mockOptions = [{ Name: 'English', Value: 'en-US' }];
      mockFetch.mockResolvedValueOnce(createMockResponse(mockOptions));

      const result = await client.getLocalizationOptions();
      expect(result).toEqual(mockOptions);
    });

    it('should get countries', async () => {
      const mockCountries = [{ Name: 'United States', TwoLetterISORegionName: 'US' }];
      mockFetch.mockResolvedValueOnce(createMockResponse(mockCountries));

      const result = await client.getCountries();
      expect(result).toEqual(mockCountries);
    });

    it('should get cultures', async () => {
      const mockCultures = [{ Name: 'English', TwoLetterISOLanguageName: 'en' }];
      mockFetch.mockResolvedValueOnce(createMockResponse(mockCultures));

      const result = await client.getCultures();
      expect(result).toEqual(mockCultures);
    });

    it('should get rating systems', async () => {
      const mockRatings = [{ Name: 'MPAA', CountryCode: 'US' }];
      mockFetch.mockResolvedValueOnce(createMockResponse(mockRatings));

      const result = await client.getRatingSystems();
      expect(result).toEqual(mockRatings);
    });
  });

  describe('Environment', () => {
    it('should get drives', async () => {
      const mockDrives = [{ Name: 'C:', Path: 'C:\\' }];
      mockFetch.mockResolvedValueOnce(createMockResponse(mockDrives));

      const result = await client.getDrives();
      expect(result).toEqual(mockDrives);
    });

    it('should get system logs', async () => {
      const mockLogs = [{ Name: 'log.txt', Size: 1024 }];
      mockFetch.mockResolvedValueOnce(createMockResponse(mockLogs));

      const result = await client.getSystemLogs();
      expect(result).toEqual(mockLogs);
    });

    it('should get system storage info', async () => {
      const mockStorage = { CachePath: '/cache', LogPath: '/logs' };
      mockFetch.mockResolvedValueOnce(createMockResponse(mockStorage));

      const result = await client.getSystemStorageInfo();
      expect(result.CachePath).toBe('/cache');
      expect(result.LogPath).toBe('/logs');
    });
  });

  describe('Backup', () => {
    it('should get backups', async () => {
      const mockBackups = [{ Name: 'backup1', Path: '/backups/backup1' }];
      mockFetch.mockResolvedValueOnce(createMockResponse(mockBackups));

      const result = await client.getBackups();
      expect(result).toEqual(mockBackups);
    });

    it('should create a backup', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 204, headers: { get: () => null }, text: () => Promise.resolve('') });

      await client.createBackup();
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/Backup'),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  describe('SyncPlay', () => {
    it('should get SyncPlay groups', async () => {
      const mockGroups = [{ GroupId: 'group-1', IsPaused: false }];
      mockFetch.mockResolvedValueOnce(createMockResponse(mockGroups));

      const result = await client.getSyncPlayGroups();
      expect(result).toEqual(mockGroups);
    });

    it('should join a SyncPlay group', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 204, headers: { get: () => null }, text: () => Promise.resolve('') });

      await client.syncPlayJoin('group-1');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/SyncPlay/Join'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should leave a SyncPlay group', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 204, headers: { get: () => null }, text: () => Promise.resolve('') });

      await client.syncPlayLeave();
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/SyncPlay/Leave'),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  describe('Media', () => {
    it('should get media segments', async () => {
      const mockSegments = [{ Id: 'seg-1', Type: 'Intro' }];
      mockFetch.mockResolvedValueOnce(createMockResponse(mockSegments));

      const result = await client.getMediaSegments('item-1');
      expect(result).toEqual(mockSegments);
    });

    it('should get lyrics', async () => {
      const mockLyrics = { Metadata: { Title: 'Song' }, Lyrics: [] };
      mockFetch.mockResolvedValueOnce(createMockResponse(mockLyrics));

      const result = await client.getLyrics('item-1');
      expect(result.Metadata?.Title).toBe('Song');
    });

    it('should get external ID infos', async () => {
      const mockIds = [{ Name: 'IMDb', Key: 'imdb' }];
      mockFetch.mockResolvedValueOnce(createMockResponse(mockIds));

      const result = await client.getExternalIdInfos('item-1');
      expect(result).toEqual(mockIds);
    });

    it('should get remote images', async () => {
      const mockImages = { Images: [{ Url: 'http://example.com/img.jpg' }], TotalRecordCount: 1 };
      mockFetch.mockResolvedValueOnce(createMockResponse(mockImages));

      const result = await client.getRemoteImages('item-1');
      expect(result.TotalRecordCount).toBe(1);
    });

    it('should get theme songs', async () => {
      const mockTheme = { Items: [], TotalRecordCount: 0 };
      mockFetch.mockResolvedValueOnce(createMockResponse(mockTheme));

      const result = await client.getThemeSongs('item-1');
      expect(result.TotalRecordCount).toBe(0);
    });
  });

  describe('Subtitles', () => {
    it('should search remote subtitles', async () => {
      const mockSubtitles = [{ Id: 'sub-1', Name: 'English' }];
      mockFetch.mockResolvedValueOnce(createMockResponse(mockSubtitles));

      const result = await client.searchRemoteSubtitles('item-1', 'eng');
      expect(result).toEqual(mockSubtitles);
    });

    it('should get subtitle providers', async () => {
      const mockProviders = [{ Name: 'OpenSubtitles' }];
      mockFetch.mockResolvedValueOnce(createMockResponse(mockProviders));

      const result = await client.getSubtitleProviders();
      expect(result).toEqual(mockProviders);
    });
  });

  describe('URL Generation', () => {
    it('should generate HLS master playlist URL', () => {
      const url = client.getHlsMasterPlaylistUrl('item-1');
      expect(url).toContain('/Videos/item-1/master.m3u8');
      expect(url).toContain('userId=test-user-id');
    });
  });

  describe('Display Preferences', () => {
    it('should get display preferences', async () => {
      const mockPrefs = { Id: 'prefs-1', Client: 'test' };
      mockFetch.mockResolvedValueOnce(createMockResponse(mockPrefs));

      const result = await client.getDisplayPreferences('prefs-1');
      expect(result.Id).toBe('prefs-1');
    });
  });

  describe('Query Filters', () => {
    it('should get query filters', async () => {
      const mockFilters = { Genres: [{ Name: 'Action', Id: 'genre-1' }] };
      mockFetch.mockResolvedValueOnce(createMockResponse(mockFilters));

      const result = await client.getQueryFilters();
      expect(result.Genres).toEqual([{ Name: 'Action', Id: 'genre-1' }]);
    });
  });
});
