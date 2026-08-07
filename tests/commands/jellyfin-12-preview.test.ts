import { decode } from '@toon-format/toon';
import { afterEach, describe, expect, it } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { parse as parseYaml } from 'yaml';
import { runCliInProcess } from '../utils/run-cli-in-process.js';

const testConfigDir = join(tmpdir(), `jellyfin-cli-preview-test-${Date.now()}`);
const isolatedJellyfinEnv: Record<string, string> = {
  JELLYFIN_SERVER_URL: '',
  JELLYFIN_API_KEY: '',
  JELLYFIN_USERNAME: '',
  JELLYFIN_PASSWORD: '',
  JELLYFIN_USER_ID: '',
  JELLYFIN_TIMEOUT: '',
  JELLYFIN_OUTPUT_FORMAT: '',
  JELLYFIN_READ_ONLY: '',
  JELLYFIN_EXPLAIN: '',
};

afterEach(() => {
  rmSync(testConfigDir, { recursive: true, force: true });
});

describe('Jellyfin 12 preview command controls', () => {
  it('routes every additive flag through the production command tree', async () => {
    const requests: URL[] = [];
    const server = Bun.serve({
      port: 0,
      fetch(request) {
        const url = new URL(request.url);
        requests.push(url);
        if (request.method === 'POST' && url.pathname === '/Playlists/playlist-1/Items') {
          return new Response(null, { status: 204 });
        }
        if (url.pathname === '/System/ActivityLog/Entries') {
          return Response.json({ Items: [{ Id: 1, Name: 'Test' }] });
        }
        return Response.json({ Items: [{ Id: 'result-1', Name: 'Result' }], TotalRecordCount: 1 });
      },
    });
    mkdirSync(testConfigDir, { recursive: true });
    writeFileSync(join(testConfigDir, 'settings.json'), JSON.stringify({
      defaultServer: {
        serverUrl: `http://127.0.0.1:${server.port}`,
        apiKey: 'test-api-key',
        userId: 'user-1',
        outputFormat: 'toon',
      },
    }), 'utf-8');
    const runCli = (args: string[]) => runCliInProcess(args, {
      ...isolatedJellyfinEnv,
      JELLYFIN_CONFIG_DIR: testConfigDir,
    });

    try {
      const results = [];
      results.push(await runCli([
        'items', 'collections', 'item-1', '--limit', '2', '--offset', '1',
        '--fields', 'Overview,Genres', '--format', 'json',
      ]));
      results.push(await runCli([
        'items', 'list', '--audio-languages', 'eng,deu',
        '--subtitle-languages', 'fra', '--format', 'json',
      ]));
      results.push(await runCli([
        'persons', 'list', '--offset', '3', '--search', 'Alex',
        '--name-starts-with', 'A', '--name-less-than', 'M',
        '--name-starts-with-or-greater', 'B', '--format', 'json',
      ]));
      results.push(await runCli([
        'trailers', 'list', '--audio-languages', 'eng,deu',
        '--subtitle-languages', 'fra', '--order', 'Descending', '--format', 'json',
      ]));
      results.push(await runCli([
        'system', 'activity', '--max-date', '2026-08-07T12:00:00Z',
        '--name', 'Task', '--overview', 'done', '--short-overview', 'ok',
        '--type', 'ScheduledTask', '--item', 'item-1', '--username', 'steve',
        '--severity', 'Warning', '--sort', 'DateCreated,Name', '--order', 'Descending',
        '--format', 'json',
      ]));
      results.push(await runCli([
        'playlists', 'add', 'playlist-1', 'item-1', 'item-2', '--position', '4',
        '--format', 'json',
      ]));

      expect(results.every((result) => result.code === 0)).toBe(true);
      expect(JSON.parse(results[0]?.stdout ?? '{}').Items).toHaveLength(1);
      expect(requests.map((url) => url.pathname)).toEqual([
        '/Items/item-1/Collections',
        '/Items',
        '/Persons',
        '/Trailers',
        '/System/ActivityLog/Entries',
        '/Playlists/playlist-1/Items',
      ]);
      expect(requests[0]?.searchParams.getAll('fields')).toEqual(['Overview', 'Genres']);
      expect(requests[1]?.searchParams.getAll('audioLanguages')).toEqual(['eng', 'deu']);
      expect(requests[2]?.searchParams.get('searchTerm')).toBe('Alex');
      expect(requests[3]?.searchParams.get('sortOrder')).toBe('Descending');
      expect(requests[4]?.searchParams.get('severity')).toBe('Warning');
      expect(requests[4]?.searchParams.getAll('sortBy')).toEqual(['DateCreated', 'Name']);
      expect(requests[5]?.searchParams.get('position')).toBe('4');

      const formatted = new Map<string, string>();
      for (const outputFormat of ['toon', 'yaml', 'raw', 'table', 'markdown']) {
        const result = await runCli([
          'items', 'collections', 'item-1', '--format', outputFormat,
        ]);
        expect(result.code).toBe(0);
        formatted.set(outputFormat, result.stdout);
      }
      expect(() => decode(formatted.get('toon') ?? '')).not.toThrow();
      expect(() => parseYaml(formatted.get('yaml') ?? '')).not.toThrow();
      expect(() => JSON.parse(formatted.get('raw') ?? '')).not.toThrow();
      expect(formatted.get('table')).toContain('Result');
      expect(formatted.get('markdown')).toContain('Result');
    } finally {
      server.stop(true);
    }
  });

  it('rejects invalid preview numeric and severity values', async () => {
    mkdirSync(testConfigDir, { recursive: true });
    writeFileSync(join(testConfigDir, 'settings.json'), JSON.stringify({
      defaultServer: {
        serverUrl: 'http://127.0.0.1:1',
        apiKey: 'test-api-key',
        userId: 'user-1',
      },
    }), 'utf-8');
    const runCli = (args: string[]) => runCliInProcess(args, {
      ...isolatedJellyfinEnv,
      JELLYFIN_CONFIG_DIR: testConfigDir,
    });

    const position = await runCli(['playlists', 'add', 'p', 'i', '--position', '-1']);
    const severity = await runCli(['system', 'activity', '--severity', 'Verbose']);
    const activitySort = await runCli(['system', 'activity', '--sort', 'Date']);
    const trailerOrder = await runCli(['trailers', 'list', '--order', 'Newest']);

    expect(position.code).toBe(1);
    expect(position.stderr).toContain('Position must be a non-negative integer');
    expect(severity.code).toBe(1);
    expect(severity.stderr).toContain("Invalid severity 'Verbose'");
    expect(activitySort.code).toBe(1);
    expect(activitySort.stderr).toContain("Invalid activity sort field 'Date'");
    expect(trailerOrder.code).toBe(1);
    expect(trailerOrder.stderr).toContain("Invalid sort order 'Newest'");
  });
});
