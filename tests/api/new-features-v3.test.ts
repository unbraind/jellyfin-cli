import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { JellyfinApiClient, JellyfinApiError } from '../../src/api/client.js';

const mockFetch = vi.fn();
global.fetch = mockFetch;

function mockOk(data: unknown, status = 200) {
  return {
    ok: true,
    status,
    statusText: 'OK',
    headers: { get: (n: string) => n === 'content-type' ? 'application/json' : null },
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(status === 204 ? '' : JSON.stringify(data)),
  };
}

function mockNoContent() {
  return { ok: true, status: 204, statusText: 'No Content', headers: { get: () => null }, text: () => Promise.resolve('') };
}

describe('JellyfinApiClient - New Features v3', () => {
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

  describe('LibraryStructure - Virtual Folder Management', () => {
    it('should add a virtual folder', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.addVirtualFolder({ name: 'Movies', collectionType: 'movies', paths: ['/data/movies'], refreshLibrary: true });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/Library/VirtualFolders'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should add a virtual folder with minimal params', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.addVirtualFolder({ name: 'TestLib' });
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should remove a virtual folder', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.removeVirtualFolder('Movies', true);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/Library/VirtualFolders'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('should rename a virtual folder', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.renameVirtualFolder('OldName', 'NewName', false);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/Library/VirtualFolders/Name'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should add a media path', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.addMediaPath({ name: 'Movies', path: '/data/movies2', networkPath: '\\\\nas\\movies', refreshLibrary: false });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/Library/VirtualFolders/Paths'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should add a media path with minimal params', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.addMediaPath({ name: 'Movies', path: '/data/movies3' });
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should remove a media path', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.removeMediaPath('Movies', '/data/old-movies', true);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/Library/VirtualFolders/Paths'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('should update a media path', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.updateMediaPath({ name: 'Movies', pathInfo: { Path: '/data/new', NetworkPath: null } });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/Library/VirtualFolders/Paths/Update'),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  describe('ItemLookup - Remote Metadata Search', () => {
    it('should perform remote search for movie', async () => {
      const mockResults = [{ Name: 'Test Movie', ProductionYear: 2020, SearchProviderName: 'TheMovieDb' }];
      mockFetch.mockResolvedValueOnce(mockOk(mockResults));
      const results = await client.remoteSearch('Movie', {
        SearchInfo: { Name: 'Test Movie', Year: 2020 },
        IncludeDisabledProviders: false,
      });
      expect(results).toHaveLength(1);
      expect(results[0].Name).toBe('Test Movie');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/Items/RemoteSearch/Movie'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should perform remote search for series', async () => {
      const mockResults = [{ Name: 'Test Series', SearchProviderName: 'TheTvDb' }];
      mockFetch.mockResolvedValueOnce(mockOk(mockResults));
      const results = await client.remoteSearch('Series', {
        SearchInfo: { Name: 'Test Series' },
      });
      expect(results).toHaveLength(1);
    });

    it('should apply search result to an item', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.applySearchResult('item-1', {
        searchProviderName: 'TheMovieDb',
        replaceAllImages: true,
        providerIds: { Tmdb: '12345' },
      });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/Items/RemoteSearch/Apply/item-1'),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  describe('UserViews', () => {
    it('should get user views', async () => {
      const mockViews = { Items: [{ Id: 'v1', Name: 'Movies', CollectionType: 'movies' }], TotalRecordCount: 1 };
      mockFetch.mockResolvedValueOnce(mockOk(mockViews));
      const result = await client.getUserViews();
      expect(result.Items).toHaveLength(1);
      expect(result.Items?.[0].Name).toBe('Movies');
    });

    it('should get user views with explicit userId', async () => {
      const mockViews = { Items: [], TotalRecordCount: 0 };
      mockFetch.mockResolvedValueOnce(mockOk(mockViews));
      const result = await client.getUserViews('other-user');
      expect(result.TotalRecordCount).toBe(0);
    });

    it('should throw when no user ID for getUserViews', async () => {
      const clientNoUser = new JellyfinApiClient({ serverUrl: 'http://localhost:8096', apiKey: 'key' });
      await expect(clientNoUser.getUserViews()).rejects.toThrow('User ID required');
    });

    it('should get user view grouping options', async () => {
      const mockOptions = [{ Id: 'opt-1', Name: 'Shows' }];
      mockFetch.mockResolvedValueOnce(mockOk(mockOptions));
      const result = await client.getUserViewGroupingOptions();
      expect(result).toHaveLength(1);
    });

    it('should throw when no user ID for getUserViewGroupingOptions', async () => {
      const clientNoUser = new JellyfinApiClient({ serverUrl: 'http://localhost:8096', apiKey: 'key' });
      await expect(clientNoUser.getUserViewGroupingOptions()).rejects.toThrow('User ID required');
    });
  });

  describe('Videos - Merge/Split Versions', () => {
    it('should merge video versions', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.mergeVideoVersions(['item-1', 'item-2', 'item-3']);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/Videos/MergeVersions'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should delete alternate sources', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.deleteAlternateSources('item-1');
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8096/Videos/item-1/AlternateSources',
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  describe('TimeSync', () => {
    it('should get UTC time', async () => {
      const mockTime = {
        RequestReceptionTime: '2024-01-01T00:00:00Z',
        ResponseTransmissionTime: '2024-01-01T00:00:00.001Z',
      };
      mockFetch.mockResolvedValueOnce(mockOk(mockTime));
      const result = await client.getUtcTime();
      expect(result.RequestReceptionTime).toBe('2024-01-01T00:00:00Z');
    });
  });

  describe('Named Server Configuration', () => {
    it('should get named configuration section', async () => {
      const mockConfig = { Setting1: 'value1', Setting2: 42 };
      mockFetch.mockResolvedValueOnce(mockOk(mockConfig));
      const result = await client.getNamedConfiguration('network');
      expect(result).toEqual(mockConfig);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8096/System/Configuration/network',
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should update named configuration section', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.updateNamedConfiguration('network', { Setting1: 'new-value' });
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8096/System/Configuration/network',
        expect.objectContaining({ method: 'POST', body: JSON.stringify({ Setting1: 'new-value' }) })
      );
    });
  });

  describe('Artists API', () => {
    it('should get artists with sortBy and sortOrder', async () => {
      const mockResult = { Items: [{ Id: 'a1', Name: 'Artist A' }], TotalRecordCount: 1 };
      mockFetch.mockResolvedValueOnce(mockOk(mockResult));
      const result = await client.getArtists({ sortBy: 'SortName', sortOrder: 'Ascending' });
      expect(result.Items).toHaveLength(1);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('sortBy=SortName'),
        expect.anything()
      );
    });

    it('should get album artists with sortBy', async () => {
      const mockResult = { Items: [{ Id: 'a2', Name: 'Album Artist' }], TotalRecordCount: 1 };
      mockFetch.mockResolvedValueOnce(mockOk(mockResult));
      const result = await client.getAlbumArtists({ sortBy: 'SortName', sortOrder: 'Descending' });
      expect(result.Items).toHaveLength(1);
    });

    it('should get artist by name', async () => {
      const mockArtist = { Id: 'artist-1', Name: 'The Beatles' };
      mockFetch.mockResolvedValueOnce(mockOk(mockArtist));
      const result = await client.getArtistByName('The Beatles');
      expect(result.Name).toBe('The Beatles');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/Artists/The%20Beatles'),
        expect.anything()
      );
    });
  });

  describe('getVirtualFolders', () => {
    it('should get virtual folders', async () => {
      const mockFolders = [{ Name: 'Movies', CollectionType: 'movies', ItemId: 'folder-1' }];
      mockFetch.mockResolvedValueOnce(mockOk(mockFolders));
      const result = await client.getVirtualFolders();
      expect(result).toHaveLength(1);
      expect(result[0].Name).toBe('Movies');
    });
  });
});
