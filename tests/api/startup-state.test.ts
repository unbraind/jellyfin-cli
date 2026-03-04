import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { JellyfinApiClient } from '../../src/api/client.js';

const mockFetch = vi.fn();
global.fetch = mockFetch;

function mockOk(data: unknown) {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: { get: (n: string) => (n === 'content-type' ? 'application/json' : null) },
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  };
}

function mockNoContent() {
  return {
    ok: true,
    status: 204,
    statusText: 'No Content',
    headers: { get: () => null },
    text: () => Promise.resolve(''),
  };
}

describe('JellyfinApiClient startup state APIs', () => {
  let client: JellyfinApiClient;

  beforeEach(() => {
    client = new JellyfinApiClient({
      serverUrl: 'http://localhost:8096',
      apiKey: 'test-key',
      userId: 'user-1',
    });
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('gets startup configuration', async () => {
    mockFetch.mockResolvedValueOnce(
      mockOk({
        UICulture: 'en-US',
        MetadataCountryCode: 'US',
        PreferredMetadataLanguage: 'en',
      }),
    );

    const result = await client.getStartupConfiguration();
    const [url, opts] = mockFetch.mock.calls[0];

    expect(url).toContain('/Startup/Configuration');
    expect(opts).toMatchObject({ method: 'GET' });
    expect(result.UICulture).toBe('en-US');
  });

  it('gets startup first user', async () => {
    mockFetch.mockResolvedValueOnce(
      mockOk({
        Name: 'admin',
        PasswordHint: 'hint',
      }),
    );

    const result = await client.getStartupFirstUser();
    const [url, opts] = mockFetch.mock.calls[0];

    expect(url).toContain('/Startup/FirstUser');
    expect(opts).toMatchObject({ method: 'GET' });
    expect(result.Name).toBe('admin');
  });

  it('checks startup completion state', async () => {
    mockFetch.mockResolvedValueOnce(mockOk(true));

    const result = await client.isStartupComplete();
    const [url, opts] = mockFetch.mock.calls[0];

    expect(url).toContain('/Startup/Complete');
    expect(opts).toMatchObject({ method: 'GET' });
    expect(result).toBe(true);
  });

  it('updates startup configuration', async () => {
    mockFetch.mockResolvedValueOnce(mockNoContent());

    const payload = {
      UICulture: 'en-GB',
      MetadataCountryCode: 'GB',
      PreferredMetadataLanguage: 'en',
    };
    const result = await client.updateStartupConfiguration(payload);
    const [url, opts] = mockFetch.mock.calls[0];
    const body = JSON.parse((opts.body as string) ?? '{}');

    expect(url).toContain('/Startup/Configuration');
    expect(opts).toMatchObject({ method: 'POST' });
    expect(body).toMatchObject(payload);
    expect(result).toBeUndefined();
  });
});
