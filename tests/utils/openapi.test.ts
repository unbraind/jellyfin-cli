import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchOpenApiDocument, getOpenApiStats, summarizeOpenApi } from '../../src/utils/openapi.js';

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
