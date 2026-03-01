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

describe('JellyfinApiClient - New Features v4', () => {
  let client: JellyfinApiClient;

  beforeEach(() => {
    client = new JellyfinApiClient({ serverUrl: 'http://localhost:8096', apiKey: 'test-key', userId: 'user-1' });
    mockFetch.mockReset();
  });
  afterEach(() => { vi.clearAllMocks(); });

  // SyncPlay Extended
  describe('SyncPlay Extended', () => {
    it('should create a SyncPlay group', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.syncPlayCreate('Test Group');
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/SyncPlay/New'), expect.objectContaining({ method: 'POST' }));
    });

    it('should create a SyncPlay group without name', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.syncPlayCreate();
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should get SyncPlay group by ID', async () => {
      const group = { GroupId: 'g1', PlayingItemName: 'Test', IsPaused: false, Participants: [] };
      mockFetch.mockResolvedValueOnce(mockOk(group));
      const result = await client.syncPlayGetGroup('g1');
      expect(result.GroupId).toBe('g1');
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/SyncPlay/g1'), expect.objectContaining({ method: 'GET' }));
    });

    it('should seek in SyncPlay group', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.syncPlaySeek(1000000);
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/SyncPlay/Seek'), expect.objectContaining({ method: 'POST' }));
    });

    it('should skip to next item in SyncPlay', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.syncPlayNextItem('playlist-item-1');
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/SyncPlay/NextItem'), expect.objectContaining({ method: 'POST' }));
    });

    it('should go to previous item in SyncPlay', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.syncPlayPreviousItem();
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/SyncPlay/PreviousItem'), expect.objectContaining({ method: 'POST' }));
    });

    it('should set repeat mode', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.syncPlaySetRepeatMode('RepeatAll');
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/SyncPlay/SetRepeatMode'), expect.objectContaining({ method: 'POST' }));
    });

    it('should set shuffle mode', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.syncPlaySetShuffleMode('Shuffle');
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/SyncPlay/SetShuffleMode'), expect.objectContaining({ method: 'POST' }));
    });

    it('should queue items in SyncPlay', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.syncPlayQueue(['item1', 'item2']);
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/SyncPlay/Queue'), expect.objectContaining({ method: 'POST' }));
    });

    it('should set a new SyncPlay queue', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.syncPlaySetNewQueue(['item1', 'item2'], 5000);
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/SyncPlay/SetNewQueue'), expect.objectContaining({ method: 'POST' }));
    });

    it('should remove items from SyncPlay playlist', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.syncPlayRemoveFromPlaylist(['pl1', 'pl2']);
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/SyncPlay/RemoveFromPlaylist'), expect.objectContaining({ method: 'POST' }));
    });

    it('should move a SyncPlay playlist item', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.syncPlayMovePlaylistItem('pl1', 3);
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/SyncPlay/MovePlaylistItem'), expect.objectContaining({ method: 'POST' }));
    });

    it('should set a SyncPlay playlist item', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.syncPlaySetPlaylistItem('pl1');
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/SyncPlay/SetPlaylistItem'), expect.objectContaining({ method: 'POST' }));
    });

    it('should send SyncPlay ping', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.syncPlayPing(42);
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/SyncPlay/Ping'), expect.objectContaining({ method: 'POST' }));
    });
  });

  // LiveTV Extended
  describe('LiveTV Extended', () => {
    it('should get guide info', async () => {
      const info = { StartDate: '2026-01-01T00:00:00Z', EndDate: '2026-01-15T00:00:00Z' };
      mockFetch.mockResolvedValueOnce(mockOk(info));
      const result = await client.getLiveTvGuideInfo();
      expect(result.StartDate).toBe('2026-01-01T00:00:00Z');
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/LiveTv/GuideInfo'), expect.anything());
    });

    it('should get recommended programs', async () => {
      const data = { Items: [{ Id: 'p1', Name: 'Program 1' }], TotalRecordCount: 1 };
      mockFetch.mockResolvedValueOnce(mockOk(data));
      const result = await client.getLiveTvRecommendedPrograms({ limit: 10 });
      expect(result.Items).toHaveLength(1);
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/LiveTv/Programs/Recommended'), expect.anything());
    });

    it('should get recording folders', async () => {
      const data = { Items: [{ Id: 'f1', Name: 'Recordings' }], TotalRecordCount: 1 };
      mockFetch.mockResolvedValueOnce(mockOk(data));
      const result = await client.getLiveTvRecordingFolders();
      expect(result.Items).toHaveLength(1);
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/LiveTv/Recordings/Folders'), expect.anything());
    });

    it('should get recording groups', async () => {
      const data = { Items: [], TotalRecordCount: 0 };
      mockFetch.mockResolvedValueOnce(mockOk(data));
      const result = await client.getLiveTvRecordingGroups();
      expect(result.TotalRecordCount).toBe(0);
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/LiveTv/Recordings/Groups'), expect.anything());
    });

    it('should get recording by ID', async () => {
      const rec = { Id: 'rec1', Name: 'Recording 1' };
      mockFetch.mockResolvedValueOnce(mockOk(rec));
      const result = await client.getLiveTvRecordingById('rec1');
      expect(result.Id).toBe('rec1');
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/LiveTv/Recordings/rec1'), expect.anything());
    });

    it('should delete a recording', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.deleteLiveTvRecording('rec1');
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/LiveTv/Recordings/rec1'), expect.objectContaining({ method: 'DELETE' }));
    });

    it('should discover tuners', async () => {
      const tuners = [{ Type: 'hdhomerun', Url: 'http://192.168.1.1:65001' }];
      mockFetch.mockResolvedValueOnce(mockOk(tuners));
      const result = await client.discoverTuners();
      expect(result).toHaveLength(1);
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/LiveTv/Tuners/Discover'), expect.anything());
    });

    it('should get tuner host types', async () => {
      const types = [{ Name: 'HD Homerun', Id: 'hdhomerun' }, { Name: 'M3U Tuner', Id: 'm3u' }];
      mockFetch.mockResolvedValueOnce(mockOk(types));
      const result = await client.getTunerHostTypes();
      expect(result).toHaveLength(2);
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/LiveTv/TunerHosts/Types'), expect.anything());
    });
  });

  // Auth Providers
  describe('Auth Providers', () => {
    it('should get auth providers', async () => {
      const providers = [{ Name: 'Default', Id: 'default-provider-id' }];
      mockFetch.mockResolvedValueOnce(mockOk(providers));
      const result = await client.getAuthProviders();
      expect(result).toHaveLength(1);
      expect(result[0].Name).toBe('Default');
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/Auth/Providers'), expect.anything());
    });

    it('should get password reset providers', async () => {
      const providers = [{ Name: 'Default Password Reset Provider', Id: 'reset-provider-id' }];
      mockFetch.mockResolvedValueOnce(mockOk(providers));
      const result = await client.getPasswordResetProviders();
      expect(result).toHaveLength(1);
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/Auth/PasswordResetProviders'), expect.anything());
    });
  });

  // Items Extended
  describe('Items Extended', () => {
    it('should get trailers', async () => {
      const data = { Items: [{ Id: 't1', Name: 'Trailer 1', Type: 'Trailer' }], TotalRecordCount: 1 };
      mockFetch.mockResolvedValueOnce(mockOk(data));
      const result = await client.getTrailers({ limit: 10 });
      expect(result.Items).toHaveLength(1);
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/Trailers'), expect.anything());
    });

    it('should get critic reviews', async () => {
      const data = { Items: [{ ReviewerName: 'Critic A', Body: 'Great film', IsNegative: false }], TotalRecordCount: 1 };
      mockFetch.mockResolvedValueOnce(mockOk(data));
      const result = await client.getCriticReviews('item1');
      expect(result.Items).toHaveLength(1);
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/Items/item1/CriticReviews'), expect.anything());
    });

    it('should get item root folder', async () => {
      const root = { Id: 'root1', Name: 'Media Folders', Type: 'UserRootFolder' };
      mockFetch.mockResolvedValueOnce(mockOk(root));
      const result = await client.getItemRootFolder();
      expect(result.Type).toBe('UserRootFolder');
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/Users/user-1/Items/Root'), expect.anything());
    });

    it('should throw if no userId for root folder', async () => {
      const noUserClient = new JellyfinApiClient({ serverUrl: 'http://localhost:8096', apiKey: 'test-key' });
      await expect(noUserClient.getItemRootFolder()).rejects.toThrow('User ID required');
    });

    it('should set item content type', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.setItemContentType('item1', 'TvShows');
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/Items/item1/ContentType'), expect.objectContaining({ method: 'POST' }));
    });

    it('should get album instant mix', async () => {
      const data = { Items: [{ Id: 's1', Name: 'Song 1' }], TotalRecordCount: 1 };
      mockFetch.mockResolvedValueOnce(mockOk(data));
      const result = await client.getAlbumInstantMix('album1', { limit: 5 });
      expect(result.Items).toHaveLength(1);
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/Albums/album1/InstantMix'), expect.anything());
    });

    it('should get song instant mix', async () => {
      const data = { Items: [{ Id: 's2', Name: 'Song 2' }], TotalRecordCount: 1 };
      mockFetch.mockResolvedValueOnce(mockOk(data));
      const result = await client.getSongInstantMix('song1', { limit: 5 });
      expect(result.Items).toHaveLength(1);
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/Songs/song1/InstantMix'), expect.anything());
    });

    it('should generate item download URL', () => {
      const url = client.getItemDownloadUrl('item1');
      expect(url).toContain('/Items/item1/Download');
      expect(url).toContain('api_key=test-key');
    });
  });

  // User Data
  describe('User Data', () => {
    it('should get user item data', async () => {
      const data = { IsFavorite: true, Played: false, PlayCount: 0, PlaybackPositionTicks: 0 };
      mockFetch.mockResolvedValueOnce(mockOk(data));
      const result = await client.getUserItemData('item1');
      expect(result.IsFavorite).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/UserItems/item1/UserData'), expect.anything());
    });

    it('should throw if no userId for user item data', async () => {
      const noUserClient = new JellyfinApiClient({ serverUrl: 'http://localhost:8096', apiKey: 'test-key' });
      await expect(noUserClient.getUserItemData('item1')).rejects.toThrow('User ID required');
    });
  });

  // Sessions Extended
  describe('Sessions Extended', () => {
    it('should add user to session', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.addSessionUser('session1', 'user2');
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/Sessions/session1/User/user2'), expect.objectContaining({ method: 'POST' }));
    });

    it('should remove user from session', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.removeSessionUser('session1', 'user2');
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/Sessions/session1/User/user2'), expect.objectContaining({ method: 'DELETE' }));
    });

    it('should set now viewing', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.setNowViewing('session1', 'item1');
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/Sessions/session1/Viewing'), expect.objectContaining({ method: 'POST' }));
    });
  });

  // Playlists Extended
  describe('Playlists Extended', () => {
    it('should get playlist by ID', async () => {
      const playlist = { Id: 'pl1', Name: 'My Playlist', Type: 'Playlist' };
      mockFetch.mockResolvedValueOnce(mockOk(playlist));
      const result = await client.getPlaylist('pl1');
      expect(result.Id).toBe('pl1');
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/Playlists/pl1'), expect.objectContaining({ method: 'GET' }));
    });

    it('should update playlist', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.updatePlaylist('pl1', { Name: 'New Name' });
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/Playlists/pl1'), expect.objectContaining({ method: 'POST' }));
    });

    it('should get playlist users', async () => {
      const users = [{ UserId: 'user2', CanEdit: false }];
      mockFetch.mockResolvedValueOnce(mockOk(users));
      const result = await client.getPlaylistUsers('pl1');
      expect(result).toHaveLength(1);
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/Playlists/pl1/Users'), expect.objectContaining({ method: 'GET' }));
    });

    it('should set playlist user access', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.setPlaylistUserAccess('pl1', 'user2', true);
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/Playlists/pl1/Users/user2'), expect.objectContaining({ method: 'POST' }));
    });

    it('should remove playlist user access', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.removePlaylistUserAccess('pl1', 'user2');
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/Playlists/pl1/Users/user2'), expect.objectContaining({ method: 'DELETE' }));
    });

    it('should move playlist item', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.movePlaylistItem('pl1', 'item1', 2);
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/Playlists/pl1/Items/item1/Move/2'), expect.objectContaining({ method: 'POST' }));
    });
  });

  // Users Extended
  describe('Users Extended', () => {
    it('should get public users', async () => {
      const users = [{ Id: 'user2', Name: 'guest' }];
      mockFetch.mockResolvedValueOnce(mockOk(users));
      const result = await client.getPublicUsers();
      expect(result).toHaveLength(1);
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/Users/Public'), expect.anything());
    });
  });

  // Environment Extended
  describe('Environment Extended', () => {
    it('should get directory contents', async () => {
      const dirs = [{ Name: 'media', Path: '/mnt/media', Type: 'Directory' }];
      mockFetch.mockResolvedValueOnce(mockOk(dirs));
      const result = await client.getDirectoryContents('/mnt', { includeFiles: false });
      expect(result).toHaveLength(1);
      expect(result[0].Name).toBe('media');
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/Environment/DirectoryContents'), expect.anything());
    });

    it('should get network shares', async () => {
      const shares = [{ Name: 'NAS', Path: '\\\\nas\\share' }];
      mockFetch.mockResolvedValueOnce(mockOk(shares));
      const result = await client.getNetworkShares();
      expect(result).toHaveLength(1);
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/Environment/NetworkShares'), expect.anything());
    });
  });

  // System Extended
  describe('System Extended', () => {
    it('should get system endpoint', async () => {
      const ep = { IsLocal: false, IsInNetwork: true };
      mockFetch.mockResolvedValueOnce(mockOk(ep));
      const result = await client.getSystemEndpoint();
      expect(result.IsInNetwork).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/System/Endpoint'), expect.anything());
    });
  });

  // Videos Extended
  describe('Videos Extended', () => {
    it('should cancel active encodings', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.cancelActiveEncodings();
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/Videos/ActiveEncodings'), expect.objectContaining({ method: 'DELETE' }));
    });

    it('should cancel active encodings for specific device', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.cancelActiveEncodings('device-1');
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/Videos/ActiveEncodings'), expect.objectContaining({ method: 'DELETE' }));
    });
  });

  // Reports
  describe('Reports', () => {
    it('should get activity report', async () => {
      const data = { Rows: [{ Id: '1', RowType: 'Movie', Columns: [{ Name: 'Test' }] }], TotalRecordCount: 1 };
      mockFetch.mockResolvedValueOnce(mockOk(data));
      const result = await client.getActivityReport({ limit: 10 });
      expect(result.TotalRecordCount).toBe(1);
      expect(result.Rows).toHaveLength(1);
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/Reports/Activities'), expect.anything());
    });

    it('should get items report', async () => {
      const data = { Rows: [{ Columns: [{ Name: 'Item Name' }] }], TotalRecordCount: 1 };
      mockFetch.mockResolvedValueOnce(mockOk(data));
      const result = await client.getItemsReport({ reportView: 'ReportData' });
      expect(result.TotalRecordCount).toBe(1);
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/Reports/Items'), expect.anything());
    });

    it('should get report headers', async () => {
      const headers = [{ Name: 'Name', FieldName: 'Name', DisplayType: 'Screen' }];
      mockFetch.mockResolvedValueOnce(mockOk(headers));
      const result = await client.getReportHeaders({ reportView: 'ReportData' });
      expect(result).toHaveLength(1);
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/Reports/Headers'), expect.anything());
    });
  });
});
