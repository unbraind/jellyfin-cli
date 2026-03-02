import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { JellyfinApiClient } from '../../src/api/client.js';
import { LiveTvApi } from '../../src/api/livetv.js';

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

describe('JellyfinApiClient - New Features v5', () => {
  let client: JellyfinApiClient;

  beforeEach(() => {
    client = new JellyfinApiClient({ serverUrl: 'http://localhost:8096', apiKey: 'test-key', userId: 'user-1' });
    mockFetch.mockReset();
  });
  afterEach(() => { vi.clearAllMocks(); });

  // LiveTV Admin (via livetv submodule)
  describe('LiveTV Admin', () => {
    it('should get series recordings', async () => {
      const data = { Items: [{ Id: 'rec1', Name: 'Series Recording' }], TotalRecordCount: 1 };
      mockFetch.mockResolvedValueOnce(mockOk(data));
      const result = await client.livetv.getLiveTvSeriesRecordings({ limit: 10 });
      expect(result.Items).toHaveLength(1);
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/LiveTv/Recordings/Series'), expect.anything());
    });

    it('should get timer defaults', async () => {
      const defaults = { Id: 'default-timer', Type: 'SeriesTimer' };
      mockFetch.mockResolvedValueOnce(mockOk(defaults));
      const result = await client.livetv.getLiveTvTimerDefaults();
      expect(result.Type).toBe('SeriesTimer');
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/LiveTv/Timers/Defaults'), expect.anything());
    });

    it('should get timer defaults for a program', async () => {
      const defaults = { Id: 'prog-timer', Type: 'Timer' };
      mockFetch.mockResolvedValueOnce(mockOk(defaults));
      await client.livetv.getLiveTvTimerDefaults({ programId: 'prog1' });
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('programId=prog1'), expect.anything());
    });

    it('should add a tuner host', async () => {
      const result = { Id: 'tuner1', Url: 'http://192.168.1.100:65001', Type: 'HdHomerun' };
      mockFetch.mockResolvedValueOnce(mockOk(result));
      const response = await client.livetv.addTunerHost({ Url: 'http://192.168.1.100:65001', Type: 'HdHomerun' });
      expect(response.Id).toBe('tuner1');
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/LiveTv/TunerHosts'), expect.objectContaining({ method: 'POST' }));
    });

    it('should delete a tuner host', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.livetv.deleteTunerHost('tuner1');
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/LiveTv/TunerHosts'), expect.objectContaining({ method: 'DELETE' }));
    });

    it('should reset a tuner', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.livetv.resetTuner('tuner1');
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/LiveTv/Tuners/tuner1/Reset'), expect.objectContaining({ method: 'POST' }));
    });

    it('should add a listing provider', async () => {
      const result = { Id: 'prov1', Type: 'SchedulesDirect' };
      mockFetch.mockResolvedValueOnce(mockOk(result));
      const response = await client.livetv.addListingProvider({ Type: 'SchedulesDirect', Username: 'user', Password: 'pass' });
      expect(response.Id).toBe('prov1');
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/LiveTv/ListingProviders'), expect.objectContaining({ method: 'POST' }));
    });

    it('should delete a listing provider', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.livetv.deleteListingProvider('prov1');
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/LiveTv/ListingProviders'), expect.objectContaining({ method: 'DELETE' }));
    });

    it('should get channel mapping options', async () => {
      const options = { ProviderName: 'Test', TunerChannels: [], ProviderChannels: [], Mappings: [] };
      mockFetch.mockResolvedValueOnce(mockOk(options));
      const result = await client.livetv.getChannelMappingOptions({ providerId: 'prov1' });
      expect(result.ProviderName).toBe('Test');
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/LiveTv/ChannelMappingOptions'), expect.anything());
    });

    it('should set channel mappings', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.livetv.setChannelMappings({ providerId: 'prov1', mappings: [{ tunerChannelId: 'ch1', providerChannelId: 'pch1' }] });
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/LiveTv/ChannelMappings'), expect.objectContaining({ method: 'POST' }));
    });
  });

  // Users - New Methods
  describe('Users - New Methods', () => {
    it('should initiate forgot password flow', async () => {
      const result = { Action: 'PinCode', PinFile: '/tmp/pin.json', PinExpirationDate: '2026-03-01T23:00:00Z' };
      mockFetch.mockResolvedValueOnce(mockOk(result));
      const response = await client.forgotPassword('testuser');
      expect(response.Action).toBe('PinCode');
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/Users/ForgotPassword'), expect.objectContaining({ method: 'POST' }));
    });

    it('should redeem forgot password pin', async () => {
      const result = { Success: true, UsersReset: ['testuser'] };
      mockFetch.mockResolvedValueOnce(mockOk(result));
      const response = await client.redeemForgotPasswordPin('123456');
      expect(response.Success).toBe(true);
      expect(response.UsersReset).toContain('testuser');
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/Users/ForgotPassword/Pin'), expect.objectContaining({ method: 'POST' }));
    });

    it('should authenticate with QuickConnect', async () => {
      const user = { Id: 'user-1', Name: 'testuser' };
      mockFetch.mockResolvedValueOnce(mockOk(user));
      const result = await client.authenticateWithQuickConnect('qc-secret-123');
      expect(result.Id).toBe('user-1');
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/Users/AuthenticateWithQuickConnect'), expect.objectContaining({ method: 'POST' }));
    });
  });

  // Plugins - Enable/Disable
  describe('Plugins - Enable/Disable', () => {
    it('should enable a plugin', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.enablePlugin('plugin-id-1', '1.0.0.0');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/Plugins/plugin-id-1/1.0.0.0/Enable'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should disable a plugin', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.disablePlugin('plugin-id-1', '1.0.0.0');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/Plugins/plugin-id-1/1.0.0.0/Disable'),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  // Videos - Merge/Split
  describe('Videos - Merge/Split', () => {
    it('should merge episode versions', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.mergeEpisodeVersions(['ep1', 'ep2']);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/MergeVersions/MergeEpisodes'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should merge movie versions', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.mergeMovieVersions(['mov1', 'mov2']);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/MergeVersions/MergeMovies'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should split episode versions', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.splitEpisodeVersions(['ep1']);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/MergeVersions/SplitEpisodes'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should split movie versions', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.splitMovieVersions(['mov1']);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/MergeVersions/SplitMovies'),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  // Library - New Methods
  describe('Library - New Methods', () => {
    it('should get media folders', async () => {
      const data = { Items: [{ Id: 'f1', Name: 'Movies', Type: 'CollectionFolder' }], TotalRecordCount: 1 };
      mockFetch.mockResolvedValueOnce(mockOk(data));
      const result = await client.getMediaFolders();
      expect(result.Items).toHaveLength(1);
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/Library/MediaFolders'), expect.anything());
    });

    it('should get media folders excluding hidden', async () => {
      const data = { Items: [], TotalRecordCount: 0 };
      mockFetch.mockResolvedValueOnce(mockOk(data));
      await client.getMediaFolders(false);
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('isHidden=false'), expect.anything());
    });

    it('should get physical paths', async () => {
      const paths = ['/mnt/movies', '/mnt/shows', '/mnt/music'];
      mockFetch.mockResolvedValueOnce(mockOk(paths));
      const result = await client.getPhysicalPaths();
      expect(result).toHaveLength(3);
      expect(result[0]).toBe('/mnt/movies');
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/Library/PhysicalPaths'), expect.anything());
    });
  });

  // Playlists - Instant Mix
  describe('Playlists - Instant Mix', () => {
    it('should get playlist instant mix', async () => {
      const data = { Items: [{ Id: 's1', Name: 'Song 1' }], TotalRecordCount: 1 };
      mockFetch.mockResolvedValueOnce(mockOk(data));
      const result = await client.getPlaylistInstantMix('pl1', { limit: 20 });
      expect(result.Items).toHaveLength(1);
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/Playlists/pl1/InstantMix'), expect.anything());
    });

    it('should get playlist instant mix with default userId', async () => {
      const data = { Items: [], TotalRecordCount: 0 };
      mockFetch.mockResolvedValueOnce(mockOk(data));
      await client.getPlaylistInstantMix('pl1');
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('userId=user-1'), expect.anything());
    });
  });

  // Environment - New Methods
  describe('Environment - New Methods', () => {
    it('should get parent path', async () => {
      mockFetch.mockResolvedValueOnce(mockOk('/mnt/media'));
      const result = await client.getParentPath('/mnt/media/movies');
      expect(result).toBe('/mnt/media');
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/Environment/ParentPath'), expect.anything());
    });

    it('should validate a path', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.validatePath({ path: '/mnt/media' });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/Environment/ValidatePath'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should validate a file path', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.validatePath({ path: '/mnt/media/file.mkv', isFile: true });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/Environment/ValidatePath'),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  // SyncPlay - New Methods
  describe('SyncPlay - New Methods', () => {
    it('should report buffering', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.syncPlayBuffering({ PositionTicks: 1000000, IsPlaying: true });
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/SyncPlay/Buffering'), expect.objectContaining({ method: 'POST' }));
    });

    it('should report ready', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.syncPlayReady({ PositionTicks: 1000000, IsPlaying: true });
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/SyncPlay/Ready'), expect.objectContaining({ method: 'POST' }));
    });

    it('should set ignore wait', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.syncPlaySetIgnoreWait(true);
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/SyncPlay/SetIgnoreWait'), expect.objectContaining({ method: 'POST' }));
    });
  });
});

// LiveTvApi standalone tests
describe('LiveTvApi - Standalone', () => {
  let api: LiveTvApi;

  beforeEach(() => {
    api = new LiveTvApi({ serverUrl: 'http://localhost:8096', apiKey: 'test-key', userId: 'user-1' });
    mockFetch.mockReset();
  });
  afterEach(() => { vi.clearAllMocks(); });

  it('should include userId when getting series recordings', async () => {
    mockFetch.mockResolvedValueOnce(mockOk({ Items: [], TotalRecordCount: 0 }));
    await api.getLiveTvSeriesRecordings();
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('userId=user-1'), expect.anything());
  });

  it('should use provided userId for series recordings', async () => {
    mockFetch.mockResolvedValueOnce(mockOk({ Items: [], TotalRecordCount: 0 }));
    await api.getLiveTvSeriesRecordings({ userId: 'other-user' });
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('userId=other-user'), expect.anything());
  });

  it('should get timer defaults without params', async () => {
    mockFetch.mockResolvedValueOnce(mockOk({ Id: 'default', Type: 'SeriesTimer' }));
    const result = await api.getLiveTvTimerDefaults();
    expect(result.Type).toBe('SeriesTimer');
  });

  it('should add tuner host with all params', async () => {
    const mockResult = { Id: 'th1', Url: 'http://tuner.local', Type: 'M3U', FriendlyName: 'My Tuner' };
    mockFetch.mockResolvedValueOnce(mockOk(mockResult));
    const result = await api.addTunerHost({
      Url: 'http://tuner.local',
      Type: 'M3U',
      FriendlyName: 'My Tuner',
      EnabledTunerCount: 4,
      AllowHWTranscoding: true,
    });
    expect(result.FriendlyName).toBe('My Tuner');
  });

  it('should export LiveTvInfo type', () => {
    // Just a type check - ensure the import works
    expect(typeof api.getLiveTvInfo).toBe('function');
  });
});
