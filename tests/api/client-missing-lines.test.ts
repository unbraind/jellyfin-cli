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

  it('should generate stream urls for container and universal endpoints', () => {
    const client = new JellyfinApiClient({ serverUrl: 'http://test', apiKey: 'k', userId: 'u1' });

    const videoContainerUrl = client.getVideoStreamByContainerUrl('item-1', 'mp4', {
      maxStreamingBitrate: 3200000,
    });
    expect(videoContainerUrl).toContain('/Videos/item-1/stream.mp4');
    expect(videoContainerUrl).toContain('maxStreamingBitrate=3200000');
    expect(videoContainerUrl).toContain('userId=u1');

    const audioContainerUrl = client.getAudioStreamByContainerUrl('item-1', 'aac');
    expect(audioContainerUrl).toContain('/Audio/item-1/stream.aac');
    expect(audioContainerUrl).toContain('userId=u1');

    const universalAudioUrl = client.getUniversalAudioStreamUrl('item-1');
    expect(universalAudioUrl).toContain('/Audio/item-1/universal');
    expect(universalAudioUrl).toContain('userId=u1');

    const audioMasterUrl = client.getAudioHlsMasterPlaylistUrl('item-1');
    expect(audioMasterUrl).toContain('/Audio/item-1/master.m3u8');
    expect(audioMasterUrl).toContain('userId=u1');

    const audioVariantUrl = client.getAudioHlsVariantPlaylistUrl('item-1');
    expect(audioVariantUrl).toContain('/Audio/item-1/main.m3u8');
    expect(audioVariantUrl).toContain('userId=u1');
  });

  it('should generate legacy hls, item file, kodi, and branding urls', () => {
    const client = new JellyfinApiClient({ serverUrl: 'http://test', apiKey: 'k', userId: 'u1' });

    const legacyHls = client.getLegacyHlsVideoPlaylistUrl('item-1', 'pl-1');
    expect(legacyHls).toContain('/Videos/item-1/hls/pl-1/stream.m3u8');
    expect(legacyHls).toContain('userId=u1');

    const legacyAudio = client.getLegacyHlsAudioSegmentUrl('item-1', 'seg-9');
    expect(legacyAudio).toContain('/Audio/item-1/hls/seg-9/stream.mp3');
    expect(legacyAudio).toContain('userId=u1');

    const itemFile = client.getItemFileUrl('item-1');
    expect(itemFile).toContain('/Items/item-1/File');
    expect(itemFile).toContain('api_key=k');

    const kodiNoParent = client.getKodiStrmUrl('movies', '123');
    expect(kodiNoParent).toContain('/Kodi/movies/123/file.strm');

    const kodiWithParent = client.getKodiStrmUrl('episodes', '123', 'season-1');
    expect(kodiWithParent).toContain('/Kodi/episodes/season-1/123/file.strm');

    const brandingCssUrl = client.getBrandingCssStaticUrl();
    expect(brandingCssUrl).toBe('http://test/Branding/Css.css');
  });
});
