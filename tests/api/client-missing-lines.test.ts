import { describe, it, expect, vi } from 'vitest';
import { JellyfinApiClient, JellyfinApiError } from '../../src/api/client.js';
import { detectType } from '../../src/formatters/base.js';

describe('JellyfinApiClient Missing Lines', () => {
  it('should sync modules on setUserId', () => {
    const client = new JellyfinApiClient({ serverUrl: 'http://test' });
    client.setUserId('new-user-id');
    expect(client.getUserId()).toBe('new-user-id');
  });

  it('should generate default subtitle url', () => {
    const client = new JellyfinApiClient({ serverUrl: 'http://test' });
    const url = client.getSubtitleUrl('item-1', 'source-1', 2);
    expect(url).toContain('Stream.srt');
    expect(url).toContain('streamIndex=2');
  });

  it('should generate formatted subtitle url', () => {
    const client = new JellyfinApiClient({ serverUrl: 'http://test' });
    const url = client.getSubtitleUrl('item-1', 'source-1', 2, 'vtt');
    expect(url).toContain('Stream.vtt');
    expect(url).toContain('format=vtt');
  });

  it('should call getRepositories from client wrapper', async () => {
    const client = new JellyfinApiClient({ serverUrl: 'http://test' });
    // @ts-expect-error - mocking private property or method
    vi.spyOn(client.packages, 'getRepositories').mockResolvedValue([]);
    await client.getRepositories();
    // @ts-expect-error - mocking private property or method
    expect(client.packages.getRepositories).toHaveBeenCalled();
  });

  it('should call setRepositories from client wrapper', async () => {
    const client = new JellyfinApiClient({ serverUrl: 'http://test' });
    // @ts-expect-error - mocking private property or method
    vi.spyOn(client.packages, 'setRepositories').mockResolvedValue();
    await client.setRepositories([]);
    // @ts-expect-error - mocking private property or method
    expect(client.packages.setRepositories).toHaveBeenCalledWith([]);
  });

  it('should call getInstallingPackages from client wrapper', async () => {
    const client = new JellyfinApiClient({ serverUrl: 'http://test' });
    // @ts-expect-error - mocking private property or method
    vi.spyOn(client.packages, 'getInstallingPackages').mockResolvedValue([]);
    await client.getInstallingPackages();
    // @ts-expect-error - mocking private property or method
    expect(client.packages.getInstallingPackages).toHaveBeenCalled();
  });

  it('should throw error in getItemRootFolder when no user id', async () => {
    const client = new JellyfinApiClient({ serverUrl: 'http://test' });
    await expect(client.getItemRootFolder()).rejects.toThrow(JellyfinApiError);
  });

  it('should pass no mediaSourceId to trickplay hls', () => {
    const client = new JellyfinApiClient({ serverUrl: 'http://test' });
    const url = client.getTrickplayHlsPlaylistUrl('item-1', 320);
    expect(url).toContain('/Videos/item-1/Trickplay/320/tiles.m3u8?width=320');
  });

  it('should pass no mediaSourceId to trickplay tile', () => {
    const client = new JellyfinApiClient({ serverUrl: 'http://test' });
    const url = client.getTrickplayTileImageUrl('item-1', 320, 0);
    expect(url).toContain('/Videos/item-1/Trickplay/320/0.jpg');
  });

  it('should throw error in getSuggestions when no user id', async () => {
    const client = new JellyfinApiClient({ serverUrl: 'http://test' });
    await expect(client.getSuggestions()).rejects.toThrow(JellyfinApiError);
  });

  it('should fallback to unknown type in detectType', () => {
    expect(detectType(() => {})).toBe('unknown');
  });

  it('should call getItemsByPath', async () => {
    const client = new JellyfinApiClient({ serverUrl: 'http://test' });
    // @ts-expect-error - mocking private property or method
    vi.spyOn(client, 'request').mockResolvedValue([]);
    await client.getItemsByPath('/test/path');
    // @ts-expect-error - mocking private property or method
    expect(client.request).toHaveBeenCalledWith('GET', '/Items/ByPath', { path: '/test/path' });
  });
});
