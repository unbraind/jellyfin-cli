import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { JellyfinApiClient, JellyfinApiError } from '../../src/api/client.js';

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

describe('JellyfinApiClient - Full Coverage Tests', () => {
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

  describe('Authentication', () => {
    it('should authenticate with username and password', async () => {
      const mockUser = { Id: 'user-1', Name: 'testuser', AccessToken: 'token123' };
      mockFetch.mockResolvedValueOnce(createMockResponse(mockUser));
      
      const c = new JellyfinApiClient({ serverUrl: 'http://localhost:8096' });
      const result = await c.authenticate('testuser', 'password123');
      
      expect(result.Name).toBe('testuser');
      expect(result.Id).toBe('user-1');
    });

    it('should handle authentication failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        headers: { get: () => null },
        text: () => Promise.resolve(JSON.stringify({ error: 'Invalid credentials' })),
      });
      
      const c = new JellyfinApiClient({ serverUrl: 'http://localhost:8096' });
      await expect(c.authenticate('testuser', 'wrongpass')).rejects.toThrow(JellyfinApiError);
    });
  });

  describe('User Management', () => {
    it('should create a new user', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ Id: 'new-user-1', Name: 'newuser' }));
      const result = await client.createUser({ Name: 'newuser', Password: 'password123' });
      expect(result.Id).toBe('new-user-1');
    });

    it('should delete a user', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(null, { status: 204 }));
      await expect(client.deleteUser('user-1')).resolves.toBeUndefined();
    });

    it('should update user password', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(null, { status: 204 }));
      await expect(client.updateUserPassword('user-1', { NewPw: 'newpass123' })).resolves.toBeUndefined();
    });

    it('should update user policy', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(null, { status: 204 }));
      await expect(client.updateUserPolicy('user-1', { IsAdministrator: true })).resolves.toBeUndefined();
    });

    it('should update user configuration', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(null, { status: 204 }));
      await expect(client.updateUserConfiguration('user-1', { SubtitleLanguagePreference: 'en' })).resolves.toBeUndefined();
    });

    it('should get user by name', async () => {
      const users = [{ Id: 'user-1', Name: 'testuser' }];
      mockFetch.mockResolvedValueOnce(createMockResponse(users));
      const result = await client.getUsers();
      expect(result).toHaveLength(1);
    });
  });

  describe('System Operations', () => {
    it('should get full system info', async () => {
      const mockInfo = { ServerName: 'Test Server', Version: '10.11.0', Id: 'server-1' };
      mockFetch.mockResolvedValueOnce(createMockResponse(mockInfo));
      const result = await client.getSystemInfo();
      expect(result.ServerName).toBe('Test Server');
    });

    it('should restart server', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(null, { status: 204 }));
      await expect(client.restartServer()).resolves.toBeUndefined();
    });

    it('should shutdown server', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(null, { status: 204 }));
      await expect(client.shutdownServer()).resolves.toBeUndefined();
    });

    it('should get activity log', async () => {
      const mockLog = { Items: [{ Name: 'UserLoggedIn', Date: '2024-01-01T00:00:00Z' }], TotalRecordCount: 1 };
      mockFetch.mockResolvedValueOnce(createMockResponse(mockLog));
      const result = await client.getActivityLog();
      expect(result.Items).toHaveLength(1);
    });
  });

  describe('Library Operations', () => {
    it('should refresh library', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(null, { status: 204 }));
      await expect(client.refreshLibrary({ recursive: true })).resolves.toBeUndefined();
    });

    it('should get virtual folders', async () => {
      const mockFolders = [{ Name: 'Movies', CollectionType: 'movies' }];
      mockFetch.mockResolvedValueOnce(createMockResponse(mockFolders));
      const result = await client.getVirtualFolders();
      expect(result).toHaveLength(1);
    });

    it('should get genres', async () => {
      const mockGenres = { Items: [{ Id: 'g1', Name: 'Action' }], TotalRecordCount: 1 };
      mockFetch.mockResolvedValueOnce(createMockResponse(mockGenres));
      const result = await client.getGenres();
      expect(result.Items).toHaveLength(1);
    });

    it('should get studios', async () => {
      const mockStudios = { Items: [{ Id: 's1', Name: 'Warner Bros' }], TotalRecordCount: 1 };
      mockFetch.mockResolvedValueOnce(createMockResponse(mockStudios));
      const result = await client.getStudios();
      expect(result.Items).toHaveLength(1);
    });

    it('should get persons', async () => {
      const mockPersons = { Items: [{ Id: 'p1', Name: 'Keanu Reeves' }], TotalRecordCount: 1 };
      mockFetch.mockResolvedValueOnce(createMockResponse(mockPersons));
      const result = await client.getPersons();
      expect(result.Items).toHaveLength(1);
    });

    it('should get artists', async () => {
      const mockArtists = { Items: [{ Id: 'a1', Name: 'Artist' }], TotalRecordCount: 1 };
      mockFetch.mockResolvedValueOnce(createMockResponse(mockArtists));
      const result = await client.getArtists();
      expect(result.Items).toHaveLength(1);
    });

    it('should get album artists', async () => {
      const mockArtists = { Items: [{ Id: 'a1', Name: 'Album Artist' }], TotalRecordCount: 1 };
      mockFetch.mockResolvedValueOnce(createMockResponse(mockArtists));
      const result = await client.getAlbumArtists();
      expect(result.Items).toHaveLength(1);
    });
  });

  describe('Item Operations', () => {
    it('should get latest items', async () => {
      const mockItems = [{ Id: 'item-1', Name: 'Latest Movie' }];
      mockFetch.mockResolvedValueOnce(createMockResponse(mockItems));
      const result = await client.getLatestItems({ limit: 10 });
      expect(result).toHaveLength(1);
    });

    it('should get resume items', async () => {
      const mockItems = { Items: [{ Id: 'item-1', Name: 'Resume Movie' }], TotalRecordCount: 1 };
      mockFetch.mockResolvedValueOnce(createMockResponse(mockItems));
      const result = await client.getResumeItems({ limit: 10 });
      expect(result.Items).toHaveLength(1);
    });

    it('should get similar items', async () => {
      const mockSimilar = { Items: [{ Id: 'item-2', Name: 'Similar Movie' }] };
      mockFetch.mockResolvedValueOnce(createMockResponse(mockSimilar));
      const result = await client.getSimilarItems('item-1');
      expect(result.Items).toHaveLength(1);
    });

    it('should get intros', async () => {
      const mockIntros = [{ Id: 'intro-1', Name: 'Intro' }];
      mockFetch.mockResolvedValueOnce(createMockResponse(mockIntros));
      const result = await client.getIntros('item-1');
      expect(result).toHaveLength(1);
    });

    it('should get special features', async () => {
      const mockFeatures = [{ Id: 'sf-1', Name: 'Behind the Scenes' }];
      mockFetch.mockResolvedValueOnce(createMockResponse(mockFeatures));
      const result = await client.getSpecialFeatures('item-1');
      expect(result).toHaveLength(1);
    });

    it('should get local trailers', async () => {
      const mockTrailers = [{ Id: 'trailer-1', Name: 'Trailer' }];
      mockFetch.mockResolvedValueOnce(createMockResponse(mockTrailers));
      const result = await client.getLocalTrailers('item-1');
      expect(result).toHaveLength(1);
    });

    it('should get ancestors', async () => {
      const mockAncestors = [{ Id: 'parent-1', Name: 'Parent' }];
      mockFetch.mockResolvedValueOnce(createMockResponse(mockAncestors));
      const result = await client.getAncestors('item-1');
      expect(result).toHaveLength(1);
    });

    it('should get additional parts', async () => {
      const mockParts = { Items: [{ Id: 'part-1', Name: 'Part 2' }] };
      mockFetch.mockResolvedValueOnce(createMockResponse(mockParts));
      const result = await client.getAdditionalParts('item-1');
      expect(result.Items).toHaveLength(1);
    });

    it('should refresh item', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(null, { status: 204 }));
      await expect(client.refreshItem('item-1')).resolves.toBeUndefined();
    });

    it('should delete item', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(null, { status: 204 }));
      await expect(client.deleteItem('item-1')).resolves.toBeUndefined();
    });

    it('should update item', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(null, { status: 204 }));
      await expect(client.updateItem('item-1', { Name: 'Updated Name' })).resolves.toBeUndefined();
    });
  });

  describe('Playback Operations', () => {
    it('should get playback info', async () => {
      const mockInfo = { playSessionId: 'session-1', mediaSources: [] };
      mockFetch.mockResolvedValueOnce(createMockResponse(mockInfo));
      const result = await client.getPlaybackInfo('item-1');
      expect(result.playSessionId).toBe('session-1');
    });

    it('should generate stream URL', () => {
      const url = client.getStreamUrl('item-1');
      expect(url).toContain('/Videos/item-1/stream');
    });

    it('should generate audio stream URL', () => {
      const url = client.getAudioStreamUrl('item-1');
      expect(url).toContain('/Audio/item-1/stream');
    });

    it('should generate subtitle URL', () => {
      const url = client.getSubtitleUrl('item-1', 'source-1', 0, 'srt');
      expect(url).toContain('/Subtitles/0/Stream.srt');
    });

    it('should generate HLS master playlist URL', () => {
      const url = client.getHlsMasterPlaylistUrl('item-1');
      expect(url).toContain('/Videos/item-1/master.m3u8');
    });
  });

  describe('User Data Operations', () => {
    it('should mark favorite', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ IsFavorite: true }));
      const result = await client.markFavorite('item-1');
      expect(result.IsFavorite).toBe(true);
    });

    it('should unmark favorite', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ IsFavorite: false }));
      const result = await client.unmarkFavorite('item-1');
      expect(result.IsFavorite).toBe(false);
    });

    it('should mark played', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ Played: true }));
      const result = await client.markPlayed('item-1');
      expect(result.Played).toBe(true);
    });

    it('should unmark played', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ Played: false }));
      const result = await client.unmarkPlayed('item-1');
      expect(result.Played).toBe(false);
    });

    it('should update item rating (like)', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({}));
      await expect(client.updateUserItemRating('item-1', undefined, true)).resolves.toBeDefined();
    });

    it('should delete item rating', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({}));
      await expect(client.deleteUserItemRating('item-1')).resolves.toBeDefined();
    });
  });

  describe('Playlist Operations', () => {
    it('should create playlist', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ Id: 'playlist-1' }));
      const result = await client.createPlaylist({ name: 'My Playlist' });
      expect(result.Id).toBe('playlist-1');
    });

    it('should add to playlist', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(null, { status: 204 }));
      await expect(client.addToPlaylist('playlist-1', ['item-1', 'item-2'])).resolves.toBeUndefined();
    });

    it('should remove from playlist', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(null, { status: 204 }));
      await expect(client.removeFromPlaylist('playlist-1', ['entry-1'])).resolves.toBeUndefined();
    });

    it('should get playlist items', async () => {
      const mockItems = { Items: [{ Id: 'item-1' }], TotalRecordCount: 1 };
      mockFetch.mockResolvedValueOnce(createMockResponse(mockItems));
      const result = await client.getPlaylistItems('playlist-1');
      expect(result.Items).toHaveLength(1);
    });
  });

  describe('Session Operations', () => {
    it('should get sessions', async () => {
      const mockSessions = [{ Id: 'session-1', UserName: 'user1' }];
      mockFetch.mockResolvedValueOnce(createMockResponse(mockSessions));
      const result = await client.getSessions();
      expect(result).toHaveLength(1);
    });

    it('should get session by ID', async () => {
      const mockSession = { Id: 'session-1', UserName: 'user1' };
      mockFetch.mockResolvedValueOnce(createMockResponse(mockSession));
      const result = await client.getSessionById('session-1');
      expect(result.Id).toBe('session-1');
    });

    it('should send message command', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(null, { status: 204 }));
      await expect(client.sendMessageCommand('session-1', { header: 'Test', text: 'Hello' })).resolves.toBeUndefined();
    });

    it('should send play command', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(null, { status: 204 }));
      await expect(client.playCommand('session-1', { itemIds: ['item-1'] })).resolves.toBeUndefined();
    });

    it('should send playstate command', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(null, { status: 204 }));
      await expect(client.playstateCommand('session-1', 'Pause')).resolves.toBeUndefined();
    });
  });

  describe('Plugin Operations', () => {
    it('should get plugins', async () => {
      const mockPlugins = [{ Id: 'plugin-1', Name: 'Test Plugin' }];
      mockFetch.mockResolvedValueOnce(createMockResponse(mockPlugins));
      const result = await client.getPlugins();
      expect(result).toHaveLength(1);
    });

    it('should get plugin by ID', async () => {
      const mockPlugin = { Id: 'plugin-1', Name: 'Test Plugin' };
      mockFetch.mockResolvedValueOnce(createMockResponse(mockPlugin));
      const result = await client.getPlugin('plugin-1');
      expect(result.Name).toBe('Test Plugin');
    });

    it('should uninstall plugin', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(null, { status: 204 }));
      await expect(client.uninstallPlugin('plugin-1')).resolves.toBeUndefined();
    });

    it('should get plugin configuration', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ setting: 'value' }));
      const result = await client.getPluginConfiguration('plugin-1');
      expect(result).toBeDefined();
    });

    it('should update plugin configuration', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(null, { status: 204 }));
      await expect(client.updatePluginConfiguration('plugin-1', { setting: 'new-value' })).resolves.toBeUndefined();
    });
  });

  describe('Device Operations', () => {
    it('should get devices', async () => {
      const mockDevices = { Items: [{ Id: 'device-1', Name: 'Chrome' }], TotalRecordCount: 1 };
      mockFetch.mockResolvedValueOnce(createMockResponse(mockDevices));
      const result = await client.getDevices();
      expect(result.Items).toHaveLength(1);
    });

    it('should get device by ID', async () => {
      const mockDevice = { Id: 'device-1', Name: 'Chrome' };
      mockFetch.mockResolvedValueOnce(createMockResponse(mockDevice));
      const result = await client.getDevice('device-1');
      expect(result.Name).toBe('Chrome');
    });

    it('should delete device', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(null, { status: 204 }));
      await expect(client.deleteDevice('device-1')).resolves.toBeUndefined();
    });

    it('should update device options', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(null, { status: 204 }));
      await expect(client.updateDeviceOptions('device-1', { customName: 'My Device' })).resolves.toBeUndefined();
    });
  });

  describe('API Key Operations', () => {
    it('should get API keys', async () => {
      const mockKeys = [{ Id: 'key-1', AppName: 'Test App' }];
      mockFetch.mockResolvedValueOnce(createMockResponse(mockKeys));
      const result = await client.getApiKeys();
      expect(result).toHaveLength(1);
    });

    it('should create API key', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ Id: 'key-1', AppName: 'Test App' }));
      const result = await client.createApiKey('Test App');
      expect(result.AppName).toBe('Test App');
    });

    it('should delete API key', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(null, { status: 204 }));
      await expect(client.deleteApiKey('key-1')).resolves.toBeUndefined();
    });
  });

  describe('Notification Operations', () => {
    it('should get notification types', async () => {
      const mockTypes = [{ Type: 'PlaybackStart', Name: 'Playback Started' }];
      mockFetch.mockResolvedValueOnce(createMockResponse(mockTypes));
      const result = await client.getNotificationTypes();
      expect(result).toHaveLength(1);
    });

    it('should get notifications', async () => {
      const mockNotifications = { Notifications: [{ Id: 'notif-1' }] };
      mockFetch.mockResolvedValueOnce(createMockResponse(mockNotifications));
      const result = await client.getNotifications();
      expect(result).toBeDefined();
    });

    it('should send admin notification', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(null, { status: 204 }));
      await expect(client.sendAdminNotification({ name: 'Test', description: 'Test notification' })).resolves.toBeUndefined();
    });
  });

  describe('SyncPlay Operations', () => {
    it('should get SyncPlay groups', async () => {
      const mockGroups = [{ GroupId: 'group-1', Participants: [] }];
      mockFetch.mockResolvedValueOnce(createMockResponse(mockGroups));
      const result = await client.getSyncPlayGroups();
      expect(result).toHaveLength(1);
    });

    it('should join SyncPlay group', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(null, { status: 204 }));
      await expect(client.syncPlayJoin('group-1')).resolves.toBeUndefined();
    });

    it('should leave SyncPlay group', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(null, { status: 204 }));
      await expect(client.syncPlayLeave()).resolves.toBeUndefined();
    });

    it('should pause SyncPlay', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(null, { status: 204 }));
      await expect(client.syncPlayPause()).resolves.toBeUndefined();
    });

    it('should unpause SyncPlay', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(null, { status: 204 }));
      await expect(client.syncPlayUnpause()).resolves.toBeUndefined();
    });

    it('should stop SyncPlay', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(null, { status: 204 }));
      await expect(client.syncPlayStop()).resolves.toBeUndefined();
    });
  });

  describe('QuickConnect Operations', () => {
    it('should check if QuickConnect is enabled', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(true));
      const result = await client.quickConnectEnabled();
      expect(result).toBe(true);
    });

    it('should initiate QuickConnect', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ Secret: 'secret-1', Code: '123456' }));
      const result = await client.quickConnectInitiate();
      expect(result.Secret).toBe('secret-1');
    });

    it('should check QuickConnect connection', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ Authenticated: false }));
      const result = await client.quickConnectConnect('secret-1');
      expect(result.Authenticated).toBe(false);
    });

    it('should authorize QuickConnect', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(true));
      const result = await client.quickConnectAuthorize('123456');
      expect(result).toBe(true);
    });
  });

  describe('Backup Operations', () => {
    it('should get backups', async () => {
      const mockBackups = [{ Name: 'backup-1', Date: '2024-01-01' }];
      mockFetch.mockResolvedValueOnce(createMockResponse(mockBackups));
      const result = await client.getBackups();
      expect(result).toHaveLength(1);
    });

    it('should create backup', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(null, { status: 204 }));
      await expect(client.createBackup()).resolves.toBeUndefined();
    });

    it('should restore backup', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(null, { status: 204 }));
      await expect(client.restoreBackup('backup-1')).resolves.toBeUndefined();
    });

    it('should delete backup', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(null, { status: 204 }));
      await expect(client.deleteBackup('backup-1')).resolves.toBeUndefined();
    });
  });

  describe('Subtitle Operations', () => {
    it('should search remote subtitles', async () => {
      const mockSubtitles = [{ Id: 'sub-1', Name: 'English' }];
      mockFetch.mockResolvedValueOnce(createMockResponse(mockSubtitles));
      const result = await client.searchRemoteSubtitles('item-1', 'en');
      expect(result).toHaveLength(1);
    });

    it('should download remote subtitle', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(null, { status: 204 }));
      await expect(client.downloadRemoteSubtitle('item-1', 'sub-1')).resolves.toBeUndefined();
    });

    it('should delete subtitle', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(null, { status: 204 }));
      await expect(client.deleteSubtitle('item-1', 0)).resolves.toBeUndefined();
    });

    it('should get subtitle providers', async () => {
      const mockProviders = [{ Name: 'OpenSubtitles' }];
      mockFetch.mockResolvedValueOnce(createMockResponse(mockProviders));
      const result = await client.getSubtitleProviders();
      expect(result).toHaveLength(1);
    });
  });

  describe('Media Operations', () => {
    it('should get media segments', async () => {
      const mockSegments = [{ Id: 'seg-1', Type: 'Intro' }];
      mockFetch.mockResolvedValueOnce(createMockResponse(mockSegments));
      const result = await client.getMediaSegments('item-1');
      expect(result).toHaveLength(1);
    });

    it('should get lyrics', async () => {
      const mockLyrics = { Lyrics: [{ Text: 'Hello world' }] };
      mockFetch.mockResolvedValueOnce(createMockResponse(mockLyrics));
      const result = await client.getLyrics('item-1');
      expect(result.Lyrics).toBeDefined();
    });

    it('should get theme songs', async () => {
      const mockTheme = { Items: [], TotalRecordCount: 0 };
      mockFetch.mockResolvedValueOnce(createMockResponse(mockTheme));
      const result = await client.getThemeSongs('item-1');
      expect(result).toBeDefined();
    });

    it('should get theme videos', async () => {
      const mockTheme = { Items: [], TotalRecordCount: 0 };
      mockFetch.mockResolvedValueOnce(createMockResponse(mockTheme));
      const result = await client.getThemeVideos('item-1');
      expect(result).toBeDefined();
    });

    it('should get remote images', async () => {
      const mockImages = { Images: [{ Url: 'http://example.com/image.jpg' }], TotalRecordCount: 1 };
      mockFetch.mockResolvedValueOnce(createMockResponse(mockImages));
      const result = await client.getRemoteImages('item-1');
      expect(result.Images).toHaveLength(1);
    });

    it('should download remote image', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(null, { status: 204 }));
      await expect(client.downloadRemoteImage('item-1', { type: 'Primary' })).resolves.toBeUndefined();
    });

    it('should get external ID infos', async () => {
      const mockIds = [{ Name: 'IMDb', Key: 'imdb' }];
      mockFetch.mockResolvedValueOnce(createMockResponse(mockIds));
      const result = await client.getExternalIdInfos('item-1');
      expect(result).toHaveLength(1);
    });
  });

  describe('Localization Operations', () => {
    it('should get localization options', async () => {
      const mockOptions = [{ Name: 'English', Value: 'en' }];
      mockFetch.mockResolvedValueOnce(createMockResponse(mockOptions));
      const result = await client.getLocalizationOptions();
      expect(result).toHaveLength(1);
    });

    it('should get countries', async () => {
      const mockCountries = [{ Name: 'United States', ThreeLetterISORegionName: 'USA' }];
      mockFetch.mockResolvedValueOnce(createMockResponse(mockCountries));
      const result = await client.getCountries();
      expect(result).toHaveLength(1);
    });

    it('should get cultures', async () => {
      const mockCultures = [{ Name: 'English', TwoLetterISOLanguageName: 'en' }];
      mockFetch.mockResolvedValueOnce(createMockResponse(mockCultures));
      const result = await client.getCultures();
      expect(result).toHaveLength(1);
    });

    it('should get rating systems', async () => {
      const mockRatings = [{ Name: 'US', CountryCode: 'US' }];
      mockFetch.mockResolvedValueOnce(createMockResponse(mockRatings));
      const result = await client.getRatingSystems();
      expect(result).toHaveLength(1);
    });
  });

  describe('Environment Operations', () => {
    it('should get drives', async () => {
      const mockDrives = [{ Name: 'C:', Path: 'C:\\' }];
      mockFetch.mockResolvedValueOnce(createMockResponse(mockDrives));
      const result = await client.getDrives();
      expect(result).toHaveLength(1);
    });

    it('should get system logs', async () => {
      const mockLogs = [{ Name: 'log.txt', Size: 1024 }];
      mockFetch.mockResolvedValueOnce(createMockResponse(mockLogs));
      const result = await client.getSystemLogs();
      expect(result).toHaveLength(1);
    });

    it('should get system log file', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse('Log content here'));
      const result = await client.getSystemLogFile('log.txt');
      expect(result).toBe('Log content here');
    });

    it('should get system storage info', async () => {
      const mockStorage = { CachePath: '/cache', LogPath: '/logs' };
      mockFetch.mockResolvedValueOnce(createMockResponse(mockStorage));
      const result = await client.getSystemStorageInfo();
      expect(result.CachePath).toBe('/cache');
    });
  });

  describe('Recommendations and Instant Mix', () => {
    it('should get recommendations', async () => {
      const mockRecs = [{ BaselineItemName: 'The Matrix', Items: [] }];
      mockFetch.mockResolvedValueOnce(createMockResponse(mockRecs));
      const result = await client.getRecommendations();
      expect(result).toHaveLength(1);
    });

    it('should get instant mix', async () => {
      const mockMix = { Items: [{ Id: 'item-1' }], TotalRecordCount: 1 };
      mockFetch.mockResolvedValueOnce(createMockResponse(mockMix));
      const result = await client.getInstantMix('item-1');
      expect(result.Items).toHaveLength(1);
    });
  });

  describe('Search Operations', () => {
    it('should get search hints', async () => {
      const mockHints = { SearchHints: [{ Id: 'item-1', Name: 'The Matrix' }], TotalRecordCount: 1 };
      mockFetch.mockResolvedValueOnce(createMockResponse(mockHints));
      const result = await client.getSearchHints({ searchTerm: 'matrix' });
      expect(result.SearchHints).toHaveLength(1);
    });

    it('should get query filters', async () => {
      const mockFilters = { Genres: ['Action'], Years: [2024] };
      mockFetch.mockResolvedValueOnce(createMockResponse(mockFilters));
      const result = await client.getQueryFilters();
      expect(result.Genres).toHaveLength(1);
    });
  });

  describe('Scheduled Tasks', () => {
    it('should get scheduled tasks', async () => {
      const mockTasks = [{ Id: 'task-1', Name: 'Scan Library' }];
      mockFetch.mockResolvedValueOnce(createMockResponse(mockTasks));
      const result = await client.getScheduledTasks();
      expect(result).toHaveLength(1);
    });

    it('should get scheduled task by ID', async () => {
      const mockTask = { Id: 'task-1', Name: 'Scan Library' };
      mockFetch.mockResolvedValueOnce(createMockResponse(mockTask));
      const result = await client.getScheduledTask('task-1');
      expect(result.Name).toBe('Scan Library');
    });

    it('should start task', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(null, { status: 204 }));
      await expect(client.startTask('task-1')).resolves.toBeUndefined();
    });

    it('should stop task', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(null, { status: 204 }));
      await expect(client.stopTask('task-1')).resolves.toBeUndefined();
    });
  });

  describe('Live TV', () => {
    it('should get Live TV info', async () => {
      const mockInfo = { IsEnabled: true, Services: [] };
      mockFetch.mockResolvedValueOnce(createMockResponse(mockInfo));
      const result = await client.getLiveTvInfo();
      expect(result.IsEnabled).toBe(true);
    });

    it('should get Live TV channels', async () => {
      const mockChannels = { Items: [{ Id: 'ch-1', Name: 'Channel 1' }], TotalRecordCount: 1 };
      mockFetch.mockResolvedValueOnce(createMockResponse(mockChannels));
      const result = await client.getLiveTvChannels();
      expect(result.Items).toHaveLength(1);
    });

    it('should get Live TV programs', async () => {
      const mockPrograms = { Items: [{ Id: 'prog-1', Name: 'Show 1' }], TotalRecordCount: 1 };
      mockFetch.mockResolvedValueOnce(createMockResponse(mockPrograms));
      const result = await client.getLiveTvPrograms();
      expect(result.Items).toHaveLength(1);
    });

    it('should get Live TV recordings', async () => {
      const mockRecordings = { Items: [{ Id: 'rec-1', Name: 'Recording 1' }], TotalRecordCount: 1 };
      mockFetch.mockResolvedValueOnce(createMockResponse(mockRecordings));
      const result = await client.getLiveTvRecordings();
      expect(result.Items).toHaveLength(1);
    });

    it('should get Live TV timer', async () => {
      const mockTimer = { Id: 'timer-1', Name: 'Timer 1' };
      mockFetch.mockResolvedValueOnce(createMockResponse(mockTimer));
      const result = await client.getLiveTvTimer('timer-1');
      expect(result.Id).toBe('timer-1');
    });

    it('should get Live TV timers', async () => {
      const mockTimers = { Items: [{ Id: 'timer-1' }], TotalRecordCount: 1 };
      mockFetch.mockResolvedValueOnce(createMockResponse(mockTimers));
      const result = await client.getLiveTvTimers();
      expect(result.Items).toHaveLength(1);
    });

    it('should create Live TV series timer', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(null, { status: 204 }));
      await expect(client.createLiveTvSeriesTimer({ channelId: 'ch-1', name: 'Series Recording' })).resolves.toBeUndefined();
    });
  });

  describe('Display Preferences', () => {
    it('should get display preferences', async () => {
      const mockPrefs = { Id: 'prefs-1', CustomPrefs: {} };
      mockFetch.mockResolvedValueOnce(createMockResponse(mockPrefs));
      const result = await client.getDisplayPreferences('prefs-1');
      expect(result.Id).toBe('prefs-1');
    });
  });

  describe('Branding and Configuration', () => {
    it('should get branding', async () => {
      const mockBranding = { LoginDisclaimer: 'Welcome', CustomCss: '' };
      mockFetch.mockResolvedValueOnce(createMockResponse(mockBranding));
      const result = await client.getBranding();
      expect(result.LoginDisclaimer).toBe('Welcome');
    });

    it('should get server configuration', async () => {
      const mockConfig = { ServerName: 'Test Server', UILanguage: 'en' };
      mockFetch.mockResolvedValueOnce(createMockResponse(mockConfig));
      const result = await client.getServerConfiguration();
      expect(result.ServerName).toBe('Test Server');
    });

    it('should update server configuration', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(null, { status: 204 }));
      await expect(client.updateServerConfiguration({ ServerName: 'New Name' })).resolves.toBeUndefined();
    });

    it('should get item counts', async () => {
      const mockCounts = { MovieCount: 100, SeriesCount: 50 };
      mockFetch.mockResolvedValueOnce(createMockResponse(mockCounts));
      const result = await client.getItemCounts();
      expect(result.MovieCount).toBe(100);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      await expect(client.getPublicSystemInfo()).rejects.toThrow(JellyfinApiError);
    });

    it('should handle 500 errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        headers: { get: () => null },
        text: () => Promise.resolve(JSON.stringify({ error: 'Server error' })),
      });
      await expect(client.getPublicSystemInfo()).rejects.toThrow(JellyfinApiError);
    });

    it('should handle 404 errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: { get: () => null },
        text: () => Promise.resolve(JSON.stringify({ error: 'Not found' })),
      });
      await expect(client.getItem('nonexistent')).rejects.toThrow(JellyfinApiError);
    });
  });
});
