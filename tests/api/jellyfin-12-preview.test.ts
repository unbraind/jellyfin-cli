import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { JellyfinApiClient } from '../../src/api/client.js';

const mockFetch = vi.fn();
global.fetch = mockFetch;

function jsonResponse(data: unknown): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

beforeEach(() => {
  mockFetch.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('Jellyfin 12 API compatibility', () => {
  it('uses canonical item routes published by stable and preview contracts', async () => {
    const client = new JellyfinApiClient({
      serverUrl: 'http://localhost:8096',
      apiKey: 'test-key',
      userId: 'user-1',
    });
    mockFetch
      .mockResolvedValueOnce(jsonResponse({ Items: [] }))
      .mockResolvedValueOnce(jsonResponse({ Id: 'item-1' }))
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse({ Items: [] }))
      .mockResolvedValueOnce(jsonResponse({ Id: 'root' }))
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse([]));

    await client.getItems();
    await client.getItem('item-1');
    await client.getLatestItems();
    await client.getResumeItems();
    await client.getItemRootFolder();
    await client.getIntros('item-1');
    await client.getSpecialFeatures('item-1');
    await client.getLocalTrailers('item-1');

    expect(mockFetch.mock.calls.map(([url]) => new URL(String(url)).pathname)).toEqual([
      '/Items',
      '/Items/item-1',
      '/Items/Latest',
      '/UserItems/Resume',
      '/Items/Root',
      '/Items/item-1/Intros',
      '/Items/item-1/SpecialFeatures',
      '/Items/item-1/LocalTrailers',
    ]);
    for (const [url] of mockFetch.mock.calls) {
      expect(new URL(String(url)).searchParams.get('userId')).toBe('user-1');
    }
  });

  it('sends additive collection, filter, sorting, and insertion controls', async () => {
    const client = new JellyfinApiClient({
      serverUrl: 'http://localhost:8096',
      apiKey: 'test-key',
      userId: 'user-1',
    });
    mockFetch
      .mockResolvedValueOnce(jsonResponse({ Items: [] }))
      .mockResolvedValueOnce(jsonResponse({ Items: [] }))
      .mockResolvedValueOnce(jsonResponse({ Items: [] }))
      .mockResolvedValueOnce(jsonResponse({ Items: [] }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));

    await client.getItemCollections('item-1', {
      startIndex: 2,
      limit: 3,
      fields: ['Overview', 'Genres'],
    });
    await client.getPersons({
      startIndex: 4,
      nameStartsWith: 'A',
      nameLessThan: 'M',
      nameStartsWithOrGreater: 'B',
    });
    await client.getTrailers({
      audioLanguages: ['eng', 'deu'],
      subtitleLanguages: ['fra'],
      sortOrder: ['Descending'],
    });
    await client.getActivityLog({
      maxDate: '2026-08-07T12:00:00Z',
      severity: 'Warning',
      sortBy: ['DateCreated', 'Name'],
      sortOrder: ['Descending'],
    });
    await client.addToPlaylist('playlist-1', ['item-1', 'item-2'], undefined, 4);

    const urls = mockFetch.mock.calls.map(([url]) => new URL(String(url)));
    expect(urls[0]?.pathname).toBe('/Items/item-1/Collections');
    expect(urls[0]?.searchParams.getAll('fields')).toEqual(['Overview', 'Genres']);
    expect(urls[1]?.searchParams.get('nameStartsWith')).toBe('A');
    expect(urls[1]?.searchParams.get('nameLessThan')).toBe('M');
    expect(urls[2]?.searchParams.getAll('audioLanguages')).toEqual(['eng', 'deu']);
    expect(urls[2]?.searchParams.get('sortOrder')).toBe('Descending');
    expect(urls[3]?.searchParams.get('severity')).toBe('Warning');
    expect(urls[3]?.searchParams.getAll('sortBy')).toEqual(['DateCreated', 'Name']);
    expect(urls[4]?.searchParams.getAll('ids')).toEqual(['item-1', 'item-2']);
    expect(urls[4]?.searchParams.get('position')).toBe('4');
  });
});
