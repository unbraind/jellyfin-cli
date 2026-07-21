import { afterEach, describe, expect, it } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const configDir = join(tmpdir(), `jellyfin-cli-usage-stats-${Date.now()}`);
let server: Bun.Server | undefined;

async function runCli(args: string[]): Promise<{ code: number; stdout: string; stderr: string }> {
  const processResult = Bun.spawn(['bun', 'run', 'src/cli.ts', ...args], {
    env: { ...process.env, JELLYFIN_CONFIG_DIR: configDir },
    stdout: 'pipe',
    stderr: 'pipe',
  });
  const [stdout, stderr, code] = await Promise.all([
    new Response(processResult.stdout).text(),
    new Response(processResult.stderr).text(),
    processResult.exited,
  ]);
  return { code, stdout, stderr };
}

function writeConfig(): void {
  mkdirSync(configDir, { recursive: true });
  writeFileSync(join(configDir, 'settings.json'), JSON.stringify({
    defaultServer: {
      serverUrl: `http://127.0.0.1:${server!.port}`,
      apiKey: 'test-key',
      outputFormat: 'toon',
    },
  }));
}

afterEach(() => {
  server?.stop(true);
  server = undefined;
  rmSync(configDir, { recursive: true, force: true });
});

describe('usage-stats command', () => {
  it('honors structured output formats for plugin reports', async () => {
    server = Bun.serve({
      port: 0,
      routes: {
        '/user_usage_stats/MoviesReport': Response.json([{ label: 'Movie', count: 3 }]),
      },
      fetch() { return new Response('not found', { status: 404 }); },
    });
    writeConfig();

    const result = await runCli(['--format', 'json', 'usage-stats', 'movies']);
    expect(result.code).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual([{ label: 'Movie', count: 3 }]);
  });

  it('falls back to core users when the plugin user list returns 500', async () => {
    server = Bun.serve({
      port: 0,
      routes: {
        '/user_usage_stats/user_list': new Response('plugin failure', { status: 500 }),
        '/Users': Response.json([{ Id: 'user-1', Name: 'steve' }]),
      },
      fetch() { return new Response('not found', { status: 404 }); },
    });
    writeConfig();

    const result = await runCli(['usage-stats', 'users', '--format', 'json']);
    expect(result.code).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual([{
      name: 'steve',
      id: 'user-1',
      in_list: null,
      source: 'jellyfin_core_fallback',
      warning: 'playback_reporting_user_list_failed',
    }]);
  });
});
