import { afterEach, describe, expect, it } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const testConfigDir = join(tmpdir(), `jellyfin-cli-years-test-${Date.now()}`);
const cliCommand = ['bun', 'run', 'src/cli.ts'];
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

async function runCli(args: string[]): Promise<{ code: number; stdout: string; stderr: string }> {
  const proc = Bun.spawn([...cliCommand, ...args], {
    env: {
      ...process.env,
      ...isolatedJellyfinEnv,
      JELLYFIN_CONFIG_DIR: testConfigDir,
    },
    stdout: 'pipe',
    stderr: 'pipe',
  });

  const [stdout, stderr, code] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);

  return { code, stdout, stderr };
}

afterEach(() => {
  rmSync(testConfigDir, { recursive: true, force: true });
});

describe('years command', () => {
  it('uses Filters2 years when available', async () => {
    let yearsEndpointCalled = false;
    const server = Bun.serve({
      port: 0,
      fetch(request) {
        const url = new URL(request.url);
        if (url.pathname === '/Items/Filters2') {
          return Response.json({
            Genres: [],
            Studios: [],
            Tags: [],
            Years: [2023, 2025, 2024],
          });
        }
        if (url.pathname === '/Years') {
          yearsEndpointCalled = true;
          return Response.json({ Items: [] });
        }
        return new Response('not found', { status: 404 });
      },
    });

    try {
      mkdirSync(testConfigDir, { recursive: true });
      writeFileSync(
        join(testConfigDir, 'settings.json'),
        JSON.stringify({
          defaultServer: {
            serverUrl: `http://127.0.0.1:${server.port}`,
            apiKey: 'test-api-key',
            userId: 'user-1',
            outputFormat: 'toon',
          },
        }),
        'utf-8',
      );

      const result = await runCli(['years', 'list', '--limit', '2', '--order', 'Descending', '--format', 'json']);
      expect(result.code).toBe(0);
      const parsed = JSON.parse(result.stdout) as Array<{ year: number }>;
      expect(parsed).toEqual([
        { id: '2025', name: '2025', year: 2025, child_count: null },
        { id: '2024', name: '2024', year: 2024, child_count: null },
      ]);
      expect(yearsEndpointCalled).toBe(false);
    } finally {
      server.stop(true);
    }
  });

  it('falls back to /Years when Filters2 is unavailable', async () => {
    const server = Bun.serve({
      port: 0,
      fetch(request) {
        const url = new URL(request.url);
        if (url.pathname === '/Items/Filters2') {
          return new Response('not found', { status: 404 });
        }
        if (url.pathname === '/Years') {
          return Response.json({
            Items: [
              { Id: 'y2020', Name: '2020', ProductionYear: 2020, ChildCount: 11 },
              { Id: 'y2021', Name: '2021', ProductionYear: 2021, ChildCount: 12 },
            ],
          });
        }
        return new Response('not found', { status: 404 });
      },
    });

    try {
      mkdirSync(testConfigDir, { recursive: true });
      writeFileSync(
        join(testConfigDir, 'settings.json'),
        JSON.stringify({
          defaultServer: {
            serverUrl: `http://127.0.0.1:${server.port}`,
            apiKey: 'test-api-key',
            userId: 'user-1',
            outputFormat: 'toon',
          },
        }),
        'utf-8',
      );

      const result = await runCli(['years', 'list', '--limit', '2', '--format', 'json']);
      expect(result.code).toBe(0);
      const parsed = JSON.parse(result.stdout) as Array<{ id: string; year: number }>;
      expect(parsed).toEqual([
        { id: 'y2020', name: '2020', year: 2020, child_count: 11 },
        { id: 'y2021', name: '2021', year: 2021, child_count: 12 },
      ]);
    } finally {
      server.stop(true);
    }
  });
});
