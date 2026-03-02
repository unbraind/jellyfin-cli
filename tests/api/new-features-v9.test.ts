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

describe('JellyfinApiClient - New Features v9', () => {
  let client: JellyfinApiClient;

  beforeEach(() => {
    client = new JellyfinApiClient({ serverUrl: 'http://localhost:8096', apiKey: 'test-key', userId: 'user-1' });
    mockFetch.mockReset();
  });
  afterEach(() => { vi.clearAllMocks(); });

  // -----------------------------------------------------------------------
  // getQueryFilters2
  // -----------------------------------------------------------------------
  describe('getQueryFilters2', () => {
    it('calls GET /Items/Filters2', async () => {
      const data = { Genres: ['Action', 'Drama'], Studios: [], Tags: [], Years: [] };
      mockFetch.mockResolvedValueOnce(mockOk(data));
      const result = await client.getQueryFilters2();
      expect(result).toBeDefined();
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('/Items/Filters2');
      expect(mockFetch.mock.calls[0][1]).toMatchObject({ method: 'GET' });
    });

    it('passes userId and parentId as query params', async () => {
      mockFetch.mockResolvedValueOnce(mockOk({ Genres: [] }));
      await client.getQueryFilters2({ userId: 'u1', parentId: 'p1', includeItemTypes: ['Movie'] });
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('userId=u1');
      expect(url).toContain('parentId=p1');
    });

    it('returns Genres and Studios from response', async () => {
      mockFetch.mockResolvedValueOnce(mockOk({ Genres: ['Comedy'], Studios: ['Warner'] }));
      const result = await client.getQueryFilters2();
      expect(result.Genres).toContain('Comedy');
      expect(result.Studios).toContain('Warner');
    });
  });

  // -----------------------------------------------------------------------
  // logClientDocument
  // -----------------------------------------------------------------------
  describe('logClientDocument', () => {
    it('calls POST /ClientLog/Document', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.logClientDocument([{ Name: 'test', Message: 'hello', Level: 'Information' }]);
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('/ClientLog/Document');
      expect(mockFetch.mock.calls[0][1]).toMatchObject({ method: 'POST' });
    });

    it('sends entries in request body', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      const entries = [{ Name: 'logger', Timestamp: '2024-01-01T00:00:00Z', Message: 'test', Level: 'Warning' }];
      await client.logClientDocument(entries);
      const body = JSON.parse(mockFetch.mock.calls[0][1].body as string);
      expect(body.Entries).toHaveLength(1);
      expect(body.Entries[0].Message).toBe('test');
    });

    it('handles multiple log entries', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.logClientDocument([
        { Message: 'first', Level: 'Debug' },
        { Message: 'second', Level: 'Error' },
      ]);
      const body = JSON.parse(mockFetch.mock.calls[0][1].body as string);
      expect(body.Entries).toHaveLength(2);
    });
  });

  // -----------------------------------------------------------------------
  // reportFullSessionCapabilities
  // -----------------------------------------------------------------------
  describe('reportFullSessionCapabilities', () => {
    it('calls POST /Sessions/Capabilities/Full', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.reportFullSessionCapabilities({ playableMediaTypes: ['Video', 'Audio'] });
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('/Sessions/Capabilities/Full');
      expect(mockFetch.mock.calls[0][1]).toMatchObject({ method: 'POST' });
    });

    it('sends capabilities in request body', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.reportFullSessionCapabilities({
        playableMediaTypes: ['Video'],
        supportedCommands: ['Play', 'Stop'],
        supportsMediaControl: true,
        supportsContentUploading: false,
        supportsSync: true,
      });
      const body = JSON.parse(mockFetch.mock.calls[0][1].body as string);
      expect(body.playableMediaTypes).toContain('Video');
      expect(body.supportedCommands).toContain('Play');
      expect(body.supportsMediaControl).toBe(true);
    });

    it('handles empty capabilities', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await expect(client.reportFullSessionCapabilities({})).resolves.toBeUndefined();
    });
  });

  // -----------------------------------------------------------------------
  // getGenres
  // -----------------------------------------------------------------------
  describe('getGenres', () => {
    it('calls GET /Genres', async () => {
      mockFetch.mockResolvedValueOnce(mockOk({ Items: [], TotalRecordCount: 0 }));
      await client.getGenres();
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('/Genres');
      expect(mockFetch.mock.calls[0][1]).toMatchObject({ method: 'GET' });
    });

    it('auto-injects userId', async () => {
      mockFetch.mockResolvedValueOnce(mockOk({ Items: [{ Id: '1', Name: 'Action' }], TotalRecordCount: 1 }));
      await client.getGenres();
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('userId=user-1');
    });

    it('passes limit and parentId', async () => {
      mockFetch.mockResolvedValueOnce(mockOk({ Items: [], TotalRecordCount: 0 }));
      await client.getGenres({ limit: 50, parentId: 'p1' });
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('limit=50');
      expect(url).toContain('parentId=p1');
    });

    it('returns Items array', async () => {
      const items = [{ Id: '1', Name: 'Drama' }, { Id: '2', Name: 'Comedy' }];
      mockFetch.mockResolvedValueOnce(mockOk({ Items: items, TotalRecordCount: 2 }));
      const result = await client.getGenres();
      expect(result.Items).toHaveLength(2);
      expect(result.Items![0].Name).toBe('Drama');
    });
  });

  // -----------------------------------------------------------------------
  // getGenreByName
  // -----------------------------------------------------------------------
  describe('getGenreByName', () => {
    it('calls GET /Genres/:name', async () => {
      mockFetch.mockResolvedValueOnce(mockOk({ Id: 'g1', Name: 'Action' }));
      await client.getGenreByName('Action');
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('/Genres/Action');
      expect(mockFetch.mock.calls[0][1]).toMatchObject({ method: 'GET' });
    });

    it('URL-encodes genre name with spaces', async () => {
      mockFetch.mockResolvedValueOnce(mockOk({ Id: 'g2', Name: 'Science Fiction' }));
      await client.getGenreByName('Science Fiction');
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('Science%20Fiction');
    });

    it('returns genre item', async () => {
      mockFetch.mockResolvedValueOnce(mockOk({ Id: 'g3', Name: 'Horror', Type: 'Genre' }));
      const result = await client.getGenreByName('Horror');
      expect(result.Name).toBe('Horror');
    });
  });

  // -----------------------------------------------------------------------
  // getStudios
  // -----------------------------------------------------------------------
  describe('getStudios', () => {
    it('calls GET /Studios', async () => {
      mockFetch.mockResolvedValueOnce(mockOk({ Items: [], TotalRecordCount: 0 }));
      await client.getStudios();
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('/Studios');
      expect(mockFetch.mock.calls[0][1]).toMatchObject({ method: 'GET' });
    });

    it('auto-injects userId', async () => {
      mockFetch.mockResolvedValueOnce(mockOk({ Items: [], TotalRecordCount: 0 }));
      await client.getStudios();
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('userId=user-1');
    });

    it('returns Items array', async () => {
      const items = [{ Id: 's1', Name: 'Warner Bros.' }];
      mockFetch.mockResolvedValueOnce(mockOk({ Items: items, TotalRecordCount: 1 }));
      const result = await client.getStudios();
      expect(result.Items).toHaveLength(1);
    });
  });

  // -----------------------------------------------------------------------
  // getStudioByName
  // -----------------------------------------------------------------------
  describe('getStudioByName', () => {
    it('calls GET /Studios/:name', async () => {
      mockFetch.mockResolvedValueOnce(mockOk({ Id: 's1', Name: 'Warner Bros.' }));
      await client.getStudioByName('Warner Bros.');
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('/Studios/');
      expect(mockFetch.mock.calls[0][1]).toMatchObject({ method: 'GET' });
    });

    it('URL-encodes studio name', async () => {
      mockFetch.mockResolvedValueOnce(mockOk({ Id: 's2', Name: 'Universal Pictures' }));
      await client.getStudioByName('Universal Pictures');
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('Universal%20Pictures');
    });

    it('returns studio item', async () => {
      mockFetch.mockResolvedValueOnce(mockOk({ Id: 's3', Name: 'Pixar', Type: 'Studio' }));
      const result = await client.getStudioByName('Pixar');
      expect(result.Name).toBe('Pixar');
    });
  });

  // -----------------------------------------------------------------------
  // getPersons
  // -----------------------------------------------------------------------
  describe('getPersons', () => {
    it('calls GET /Persons', async () => {
      mockFetch.mockResolvedValueOnce(mockOk({ Items: [], TotalRecordCount: 0 }));
      await client.getPersons();
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('/Persons');
      expect(mockFetch.mock.calls[0][1]).toMatchObject({ method: 'GET' });
    });

    it('auto-injects userId', async () => {
      mockFetch.mockResolvedValueOnce(mockOk({ Items: [], TotalRecordCount: 0 }));
      await client.getPersons();
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('userId=user-1');
    });

    it('passes limit and parentId', async () => {
      mockFetch.mockResolvedValueOnce(mockOk({ Items: [], TotalRecordCount: 0 }));
      await client.getPersons({ limit: 25, parentId: 'lib1' });
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('limit=25');
      expect(url).toContain('parentId=lib1');
    });

    it('returns Items with person data', async () => {
      const items = [{ Id: 'p1', Name: 'Tom Hanks', Type: 'Person' }];
      mockFetch.mockResolvedValueOnce(mockOk({ Items: items, TotalRecordCount: 1 }));
      const result = await client.getPersons();
      expect(result.Items![0].Name).toBe('Tom Hanks');
    });
  });

  // -----------------------------------------------------------------------
  // getPersonByName
  // -----------------------------------------------------------------------
  describe('getPersonByName', () => {
    it('calls GET /Persons/:name', async () => {
      mockFetch.mockResolvedValueOnce(mockOk({ Id: 'p1', Name: 'Tom Hanks' }));
      await client.getPersonByName('Tom Hanks');
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('/Persons/');
      expect(mockFetch.mock.calls[0][1]).toMatchObject({ method: 'GET' });
    });

    it('URL-encodes person name', async () => {
      mockFetch.mockResolvedValueOnce(mockOk({ Id: 'p2', Name: 'Morgan Freeman' }));
      await client.getPersonByName('Morgan Freeman');
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('Morgan%20Freeman');
    });

    it('returns person item', async () => {
      mockFetch.mockResolvedValueOnce(mockOk({ Id: 'p3', Name: 'Meryl Streep', Type: 'Person' }));
      const result = await client.getPersonByName('Meryl Streep');
      expect(result.Name).toBe('Meryl Streep');
    });
  });
});
