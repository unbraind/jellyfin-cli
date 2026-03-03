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

  it('returns unavailable stats when no openapi endpoint is reachable', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('connection refused'));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const stats = await getOpenApiStats(CONFIG);
    expect(stats.available).toBe(false);
    expect(stats.error).toContain('connection refused');
  });
});
