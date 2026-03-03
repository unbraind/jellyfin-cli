import { describe, it, expect } from 'vitest';
import { JellyfinApiClient } from '../../src/api/client.js';

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
});
