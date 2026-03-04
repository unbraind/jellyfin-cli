import { describe, expect, it } from 'vitest';
import { tokenizeIntentValue, tokenizePathValue } from '../../src/utils/openapi-tokenize.js';

describe('openapi tokenize utils', () => {
  it('splits camel-case tokens and normalizes singular/plural forms', () => {
    const tokens = tokenizeIntentValue('MediaSegments libraries');
    expect(tokens).toEqual(expect.arrayContaining(['media', 'segment', 'library']));
  });

  it('expands known domain aliases for better intent matching', () => {
    const apiTokens = tokenizeIntentValue('apikeys list');
    expect(apiTokens).toEqual(expect.arrayContaining(['apikey', 'api', 'key', 'auth', 'list']));

    const qcTokens = tokenizeIntentValue('quickconnect status');
    expect(qcTokens).toEqual(expect.arrayContaining(['quickconnect', 'quick', 'connect', 'status']));

    const liveTokens = tokenizeIntentValue('/LiveTv/Channels');
    expect(liveTokens).toEqual(expect.arrayContaining(['live', 'tv', 'channel']));

    const syncPlayTokens = tokenizeIntentValue('syncplay list');
    expect(syncPlayTokens).toEqual(expect.arrayContaining(['syncplay', 'sync', 'play', 'list']));

    const healthTokens = tokenizeIntentValue('system health');
    expect(healthTokens).toEqual(expect.arrayContaining(['health', 'ping']));

    const userDataTokens = tokenizeIntentValue('userdata get');
    expect(userDataTokens).toEqual(expect.arrayContaining(['userdata', 'user', 'data', 'get']));

    const clientlogTokens = tokenizeIntentValue('clientlog send');
    expect(clientlogTokens).toEqual(expect.arrayContaining(['clientlog', 'client', 'log', 'document']));

    const identifyTokens = tokenizeIntentValue('items identify');
    expect(identifyTokens).toEqual(expect.arrayContaining(['identify', 'search', 'lookup', 'remote']));

    const renameTokens = tokenizeIntentValue('devices rename');
    expect(renameTokens).toEqual(expect.arrayContaining(['rename', 'update', 'option', 'custom', 'name']));

    const runTokens = tokenizeIntentValue('tasks run');
    expect(runTokens).toEqual(expect.arrayContaining(['run', 'running', 'start', 'execute']));

    const transcodingTokens = tokenizeIntentValue('videos cancel-transcoding');
    expect(transcodingTokens).toEqual(expect.arrayContaining(['transcoding', 'encoding', 'transcode']));

    const volumeTokens = tokenizeIntentValue('sessions volume');
    expect(volumeTokens).toEqual(expect.arrayContaining(['volume', 'level', 'command']));

    const liveTvTokens = tokenizeIntentValue('livetv channels');
    expect(liveTvTokens).toEqual(expect.arrayContaining(['livetv', 'live', 'tv', 'channel']));

    const chapterTokens = tokenizeIntentValue('items chapters');
    expect(chapterTokens).toEqual(expect.arrayContaining(['chapter', 'segment']));

    const notificationTokens = tokenizeIntentValue('notifications list');
    expect(notificationTokens).toEqual(expect.arrayContaining(['notification', 'notify']));

    const muteTokens = tokenizeIntentValue('sessions mute');
    expect(muteTokens).toEqual(expect.arrayContaining(['mute', 'command']));

    const unmuteTokens = tokenizeIntentValue('sessions unmute');
    expect(unmuteTokens).toEqual(expect.arrayContaining(['unmute', 'command']));

    const unshareTokens = tokenizeIntentValue('playlists unshare');
    expect(unshareTokens).toEqual(expect.arrayContaining(['unshare', 'share', 'remove']));
  });

  it('deduplicates repeated tokens from mixed casing and separators', () => {
    const tokens = tokenizeIntentValue('QuickConnect quick-connect quickConnect');
    const unique = new Set(tokens);
    expect(tokens.length).toBe(unique.size);
  });

  it('tokenizes OpenAPI paths as a unique set', () => {
    const tokenSet = tokenizePathValue('/Auth/Keys/{key}');
    expect(tokenSet.has('auth')).toBe(true);
    expect(tokenSet.has('key')).toBe(true);
  });
});
