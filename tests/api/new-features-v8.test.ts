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

describe('JellyfinApiClient - New Features v8', () => {
  let client: JellyfinApiClient;

  beforeEach(() => {
    client = new JellyfinApiClient({ serverUrl: 'http://localhost:8096', apiKey: 'test-key', userId: 'user-1' });
    mockFetch.mockReset();
  });
  afterEach(() => { vi.clearAllMocks(); });

  // -----------------------------------------------------------------------
  // Metadata editor info
  // -----------------------------------------------------------------------
  describe('getMetadataEditorInfo', () => {
    it('calls GET /Items/:id/MetadataEditor', async () => {
      const data = { ContentTypeOptions: [{ Name: 'Movies', Value: 'movies' }], ExternalIdInfos: [] };
      mockFetch.mockResolvedValueOnce(mockOk(data));
      const result = await client.getMetadataEditorInfo('item-1');
      expect(result).toBeDefined();
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('/Items/item-1/MetadataEditor');
      expect(mockFetch.mock.calls[0][1]).toMatchObject({ method: 'GET' });
    });

    it('returns the response object', async () => {
      const data = { ContentTypeOptions: [], ExternalIdInfos: [{ Name: 'TheMovieDb', Key: 'MovieDbId' }] };
      mockFetch.mockResolvedValueOnce(mockOk(data));
      const result = await client.getMetadataEditorInfo('item-2');
      expect(result).toMatchObject({ ExternalIdInfos: expect.any(Array) });
    });
  });

  // -----------------------------------------------------------------------
  // Available library options
  // -----------------------------------------------------------------------
  describe('getAvailableLibraryOptions', () => {
    it('calls GET /Libraries/AvailableOptions', async () => {
      const data = { MetadataReaders: ['nfo'], MetadataSavers: [], ImageFetchers: ['TheMovieDb'] };
      mockFetch.mockResolvedValueOnce(mockOk(data));
      const result = await client.getAvailableLibraryOptions();
      expect(result).toBeDefined();
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('/Libraries/AvailableOptions');
    });

    it('returns options object from server', async () => {
      const data = { MetadataReaders: ['nfo'], SubtitleDownloaders: [] };
      mockFetch.mockResolvedValueOnce(mockOk(data));
      const result = await client.getAvailableLibraryOptions();
      expect(result).toMatchObject({ MetadataReaders: ['nfo'] });
    });
  });

  // -----------------------------------------------------------------------
  // Default metadata options
  // -----------------------------------------------------------------------
  describe('getDefaultMetadataOptions', () => {
    it('calls GET /System/Configuration/MetadataOptions/Default', async () => {
      const data = { DisabledMetadataFetchers: [], DisabledImageFetchers: [] };
      mockFetch.mockResolvedValueOnce(mockOk(data));
      const result = await client.getDefaultMetadataOptions();
      expect(result).toBeDefined();
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('/System/Configuration/MetadataOptions/Default');
    });
  });

  // -----------------------------------------------------------------------
  // Fallback fonts
  // -----------------------------------------------------------------------
  describe('getFallbackFonts', () => {
    it('calls GET /FallbackFont/Fonts', async () => {
      const data = [{ Name: 'NotoSans', Filename: 'NotoSans.ttf', FileSize: 204800 }];
      mockFetch.mockResolvedValueOnce(mockOk(data));
      const result = await client.getFallbackFonts();
      expect(result).toHaveLength(1);
      expect(result[0].Name).toBe('NotoSans');
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('/FallbackFont/Fonts');
      expect(url).not.toContain('/Fonts/');
    });

    it('returns empty array when no fonts installed', async () => {
      mockFetch.mockResolvedValueOnce(mockOk([]));
      const result = await client.getFallbackFonts();
      expect(result).toHaveLength(0);
    });
  });

  describe('getFallbackFont', () => {
    it('calls GET /FallbackFont/Fonts/:name with URL encoding', async () => {
      mockFetch.mockResolvedValueOnce(mockOk(new ArrayBuffer(0)));
      await client.getFallbackFont('NotoSans Regular.ttf');
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('/FallbackFont/Fonts/NotoSans%20Regular.ttf');
    });

    it('calls correct path for simple font name', async () => {
      mockFetch.mockResolvedValueOnce(mockOk(new ArrayBuffer(0)));
      await client.getFallbackFont('arial.ttf');
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('/FallbackFont/Fonts/arial.ttf');
    });
  });

  // -----------------------------------------------------------------------
  // Live streams
  // -----------------------------------------------------------------------
  describe('openLiveStream', () => {
    it('calls POST /LiveStreams/Open', async () => {
      const data = { MediaSourceId: 'src-1', MediaSource: { Id: 'src-1' } };
      mockFetch.mockResolvedValueOnce(mockOk(data));
      const result = await client.openLiveStream({ itemId: 'item-1', enableDirectPlay: true });
      expect(result.MediaSourceId).toBe('src-1');
      const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toContain('/LiveStreams/Open');
      expect(init.method).toBe('POST');
    });

    it('accepts all optional parameters', async () => {
      mockFetch.mockResolvedValueOnce(mockOk({ MediaSourceId: 'src-2' }));
      await client.openLiveStream({
        openToken: 'tok-1',
        userId: 'user-1',
        playSessionId: 'play-1',
        maxStreamingBitrate: 5000000,
        enableDirectPlay: false,
        enableDirectStream: true,
      });
      const init = mockFetch.mock.calls[0][1] as RequestInit;
      const body = JSON.parse(init.body as string);
      expect(body.openToken).toBe('tok-1');
      expect(body.maxStreamingBitrate).toBe(5000000);
    });
  });

  describe('closeLiveStream', () => {
    it('calls POST /LiveStreams/Close with stream ID in body', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.closeLiveStream('stream-abc');
      const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toContain('/LiveStreams/Close');
      expect(init.method).toBe('POST');
      const body = JSON.parse(init.body as string);
      expect(body.LiveStreamId).toBe('stream-abc');
    });

    it('resolves without error on success', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await expect(client.closeLiveStream('stream-xyz')).resolves.toBeUndefined();
    });
  });

  // -----------------------------------------------------------------------
  // Session general commands
  // -----------------------------------------------------------------------
  describe('sendGeneralCommand', () => {
    it('calls POST /Sessions/:id/Command/:command', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.sendGeneralCommand('session-1', 'GoHome');
      const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toContain('/Sessions/session-1/Command/GoHome');
      expect(init.method).toBe('POST');
    });

    it('URL-encodes the command name', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.sendGeneralCommand('session-1', 'DisplayContent');
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('/Sessions/session-1/Command/DisplayContent');
    });

    it('sends args in request body when provided', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.sendGeneralCommand('session-1', 'DisplayContent', { ItemId: 'item-1', ItemType: 'Movie' });
      const init = mockFetch.mock.calls[0][1] as RequestInit;
      const body = JSON.parse(init.body as string);
      expect(body.Arguments).toMatchObject({ ItemId: 'item-1', ItemType: 'Movie' });
    });

    it('sends no body when no args provided', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.sendGeneralCommand('session-1', 'GoHome');
      const init = mockFetch.mock.calls[0][1] as RequestInit;
      expect(init.body).toBeUndefined();
    });
  });

  // Note: getAlternateSources (GET /Videos/:id/AlternateSources) was removed
  // in Jellyfin 10.11.6 — only DELETE is supported. Tests removed accordingly.

  // -----------------------------------------------------------------------
  // Update user item data (POST)
  // -----------------------------------------------------------------------
  describe('updateUserItemData', () => {
    it('calls POST /UserItems/:id/UserData with userId in query', async () => {
      const data = { IsFavorite: true, Played: false, PlayCount: 0 };
      mockFetch.mockResolvedValueOnce(mockOk(data));
      const result = await client.updateUserItemData('item-1', { IsFavorite: true });
      expect(result.IsFavorite).toBe(true);
      const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toContain('/UserItems/item-1/UserData');
      expect(url).toContain('userId=user-1');
      expect(init.method).toBe('POST');
    });

    it('uses provided userId instead of default', async () => {
      mockFetch.mockResolvedValueOnce(mockOk({ Played: true }));
      await client.updateUserItemData('item-1', { Played: true }, 'other-user');
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('userId=other-user');
    });

    it('throws when no userId available', async () => {
      const noUserClient = new JellyfinApiClient({ serverUrl: 'http://localhost:8096', apiKey: 'key' });
      await expect(noUserClient.updateUserItemData('item-1', {})).rejects.toThrow('User ID required');
    });

    it('sends data fields in request body', async () => {
      mockFetch.mockResolvedValueOnce(mockOk({ PlayCount: 5, Rating: 8.5 }));
      await client.updateUserItemData('item-1', { PlayCount: 5, Rating: 8.5 });
      const init = mockFetch.mock.calls[0][1] as RequestInit;
      const body = JSON.parse(init.body as string);
      expect(body.PlayCount).toBe(5);
      expect(body.Rating).toBe(8.5);
    });

    it('supports all data fields', async () => {
      mockFetch.mockResolvedValueOnce(mockOk({}));
      await client.updateUserItemData('item-1', {
        IsFavorite: false,
        Played: true,
        PlayCount: 3,
        PlaybackPositionTicks: 50000,
        Rating: 7,
      });
      const init = mockFetch.mock.calls[0][1] as RequestInit;
      const body = JSON.parse(init.body as string);
      expect(body.IsFavorite).toBe(false);
      expect(body.PlaybackPositionTicks).toBe(50000);
    });
  });

  // -----------------------------------------------------------------------
  // setNowViewing (already in client, but verify it works)
  // -----------------------------------------------------------------------
  describe('setNowViewing', () => {
    it('calls POST /Sessions/:id/Viewing', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.setNowViewing('session-1', 'item-1');
      const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toContain('/Sessions/session-1/Viewing');
      expect(init.method).toBe('POST');
    });

    it('includes itemId in query or body', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.setNowViewing('session-1', 'item-abc');
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toMatch(/itemId=item-abc/);
    });
  });

  // -----------------------------------------------------------------------
  // setRepositories (POST /Repositories)
  // -----------------------------------------------------------------------
  describe('setRepositories', () => {
    it('calls POST /Repositories', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.setRepositories([{ Name: 'Official', Url: 'https://repo.example.com', Enabled: true }]);
      const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toContain('/Repositories');
      expect(init.method).toBe('POST');
    });

    it('sends repository array in request body', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      const repos = [
        { Name: 'Repo1', Url: 'https://r1.example.com', Enabled: true },
        { Name: 'Repo2', Url: 'https://r2.example.com', Enabled: false },
      ];
      await client.setRepositories(repos);
      const init = mockFetch.mock.calls[0][1] as RequestInit;
      const body = JSON.parse(init.body as string);
      expect(Array.isArray(body)).toBe(true);
      expect(body).toHaveLength(2);
      expect(body[0].Name).toBe('Repo1');
      expect(body[1].Enabled).toBe(false);
    });

    it('accepts empty array to clear repositories', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.setRepositories([]);
      const init = mockFetch.mock.calls[0][1] as RequestInit;
      const body = JSON.parse(init.body as string);
      expect(Array.isArray(body)).toBe(true);
      expect(body).toHaveLength(0);
    });
  });
});
