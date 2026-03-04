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
