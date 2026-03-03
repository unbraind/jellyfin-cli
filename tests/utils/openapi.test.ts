import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  extractOpenApiOperations,
  fetchOpenApiDocument,
  filterOpenApiOperations,
  getOpenApiStats,
  matchOperationsForCommandIntent,
  summarizeOpenApi,
} from '../../src/utils/openapi.js';

const CONFIG = {
  serverUrl: 'http://127.0.0.1:8096',
  apiKey: 'test-key',
  timeout: 5000,
};

describe('openapi utils', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    vi.restoreAllMocks();
    globalThis.fetch = originalFetch;
  });

  it('summarizes paths, operations, and tags', () => {
    const summary = summarizeOpenApi({
      info: { version: '10.11.6' },
      paths: {
        '/Users': {
          get: { tags: ['Users'] },
          post: { tags: ['Users'] },
        },
        '/System/Info/Public': {
          get: { tags: ['System'] },
        },
      },
    });

    expect(summary.pathCount).toBe(2);
    expect(summary.operationCount).toBe(3);
    expect(summary.serverVersion).toBe('10.11.6');
    expect(summary.topTags).toEqual([
      { tag: 'Users', operations: 2 },
      { tag: 'System', operations: 1 },
    ]);
  });

  it('extracts operations with read-only safety metadata', () => {
    const operations = extractOpenApiOperations({
      paths: {
        '/Users': {
          get: { tags: ['Users'], operationId: 'GetUsers', summary: 'List users' },
          post: { tags: ['Users'], operationId: 'CreateUser', summary: 'Create user' },
        },
      },
    });

    expect(operations).toEqual([
      {
        method: 'GET',
        path: '/Users',
        operationId: 'GetUsers',
        summary: 'List users',
        tags: ['Users'],
        deprecated: false,
        readOnlySafe: true,
      },
      {
        method: 'POST',
        path: '/Users',
        operationId: 'CreateUser',
        summary: 'Create user',
        tags: ['Users'],
        deprecated: false,
        readOnlySafe: false,
      },
    ]);
  });

  it('filters operations by method, tag, path prefix, and search', () => {
    const operations = extractOpenApiOperations({
      paths: {
        '/Users': {
          get: { tags: ['Users'], summary: 'List users' },
          post: { tags: ['Users'], summary: 'Create user' },
        },
        '/System/Info/Public': {
          get: { tags: ['System'], summary: 'Public info' },
        },
      },
    });

    const filtered = filterOpenApiOperations(operations, {
      method: 'GET',
      tag: 'Users',
      pathPrefix: '/Users',
      search: 'list',
    });
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.path).toBe('/Users');
    expect(filtered[0]?.method).toBe('GET');
  });

  it('matches operations for command intent with ranked scores', () => {
    const operations = extractOpenApiOperations({
      paths: {
        '/Users': {
          get: { tags: ['Users'], summary: 'List users' },
        },
        '/System/Info/Public': {
          get: { tags: ['System'], summary: 'Public info' },
        },
      },
    });

    const matches = matchOperationsForCommandIntent(operations, 'users list');
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0]?.path).toBe('/Users');
    expect(matches[0]?.score).toBeGreaterThan(0);
    expect(matches[0]?.matchedOn.some((reason) => reason.includes('path:user'))).toBe(true);
  });

  it('fetches openapi from fallback candidate path', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response('Not Found', { status: 404 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            info: { version: '10.11.6' },
            paths: { '/System/Info/Public': { get: { tags: ['System'] } } },
          }),
          { headers: { 'content-type': 'application/json' } },
        ),
      );

    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const result = await fetchOpenApiDocument(CONFIG);
    expect(result.sourcePath).toBe('/openapi.json');
    expect(Object.keys(result.document.paths ?? {})).toContain('/System/Info/Public');
  });

  it('throws when server URL is missing', async () => {
    await expect(fetchOpenApiDocument({
      serverUrl: '',
    })).rejects.toThrow('Missing server URL');
  });

  it('throws for invalid openapi payload when no valid candidate is found', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            info: { version: '10.11.6' },
          }),
          { headers: { 'content-type': 'application/json' } },
        ),
      )
      .mockResolvedValueOnce(new Response('Not Found', { status: 404 }))
      .mockResolvedValueOnce(new Response('Not Found', { status: 404 }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await expect(fetchOpenApiDocument(CONFIG)).rejects.toThrow('HTTP 404 at /swagger/v1/swagger.json');
  });

  it('returns empty list when intent has no meaningful tokens', () => {
    const operations = extractOpenApiOperations({
      paths: {
        '/Users': {
          get: { tags: ['Users'], summary: 'List users' },
        },
      },
    });

    expect(matchOperationsForCommandIntent(operations, ' /  - _ ')).toEqual([]);
  });

  it('matches command intent on tag and summary metadata', () => {
    const operations = extractOpenApiOperations({
      paths: {
        '/People/Search': {
          get: { tags: ['Metadata'], summary: 'Lookup persons remotely', operationId: 'LookupPerson' },
        },
      },
    });

    const matches = matchOperationsForCommandIntent(operations, 'metadata lookup');
    expect(matches).toHaveLength(1);
    expect(matches[0]?.matchedOn).toEqual(expect.arrayContaining(['tag:metadata', 'meta:lookup']));
  });

  it('sorts command intent matches by score, then depth, then method/path', () => {
    const operations = extractOpenApiOperations({
      paths: {
        '/Library': {
          get: { tags: ['Library'], summary: 'List library entries', operationId: 'GetLibrary' },
          post: { tags: ['Library'], summary: 'List library entries', operationId: 'PostLibrary' },
        },
        '/Library/Items': {
          get: { tags: ['Library'], summary: 'List library entries', operationId: 'GetLibraryItems' },
        },
      },
    });

    const matches = matchOperationsForCommandIntent(operations, 'library');
    const methodsForLibrary = matches.filter((entry) => entry.path === '/Library').map((entry) => entry.method);
    expect(matches[0]?.path).toBe('/Library');
    expect(matches[1]?.path).toBe('/Library');
    expect(methodsForLibrary).toEqual(['GET', 'POST']);
  });

  it('prefers read-only operations for read-only command intents', () => {
    const operations = extractOpenApiOperations({
      paths: {
        '/Items': {
          get: { tags: ['Items'], summary: 'List items', operationId: 'GetItems' },
          delete: { tags: ['Library'], summary: 'Delete items', operationId: 'DeleteItems' },
        },
      },
    });

    const matches = matchOperationsForCommandIntent(operations, 'items list');
    expect(matches[0]?.method).toBe('GET');
    expect(matches[0]?.readOnlySafe).toBe(true);
  });

  it('filters out operations when tag or search terms do not match', () => {
    const operations = extractOpenApiOperations({
      paths: {
        '/Users': {
          get: { tags: ['Users'], summary: 'List users' },
        },
      },
    });

    const noTagMatch = filterOpenApiOperations(operations, { tag: 'System' });
    expect(noTagMatch).toEqual([]);

    const noSearchMatch = filterOpenApiOperations(operations, { search: 'nonexistent-token' });
    expect(noSearchMatch).toEqual([]);
  });

  it('returns unavailable stats when no openapi endpoint is reachable', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('connection refused'));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const stats = await getOpenApiStats(CONFIG);
    expect(stats.available).toBe(false);
    expect(stats.error).toContain('connection refused');
  });
});
