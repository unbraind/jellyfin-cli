import { afterEach, describe, expect, it } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const testConfigDir = join(tmpdir(), `jellyfin-cli-items-options-test-${Date.now()}`);
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

describe('items list option handling', () => {
  it('clamps output to requested --limit when server returns extra rows', async () => {
    const server = Bun.serve({
      port: 0,
      fetch(request) {
        const url = new URL(request.url);
        if (url.pathname === '/Users') {
          return Response.json([{ Id: 'user-1', Name: 'steve', Policy: { IsAdministrator: true } }]);
        }
        if (url.pathname === '/Users/user-1/Items') {
          return Response.json({
            Items: [
              { Id: '1', Name: 'One' },
              { Id: '2', Name: 'Two' },
              { Id: '3', Name: 'Three' },
            ],
          });
        }
        return new Response('not found', { status: 404 });
      },
    });

    try {
      mkdirSync(testConfigDir, { recursive: true });
      writeFileSync(join(testConfigDir, 'settings.json'), JSON.stringify({
        defaultServer: {
          serverUrl: `http://127.0.0.1:${server.port}`,
          apiKey: 'test-api-key',
          outputFormat: 'toon',
        },
      }), 'utf-8');

      const result = await runCli(['items', 'list', '--limit', '2', '--format', 'json']);
      expect(result.code).toBe(0);
      const parsed = JSON.parse(result.stdout);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(2);
      expect(parsed[0].Name).toBe('One');
      expect(parsed[1].Name).toBe('Two');
    } finally {
      server.stop(true);
    }
  });

  it('rejects invalid numeric options with clear errors', async () => {
    const server = Bun.serve({
      port: 0,
      fetch(request) {
        const url = new URL(request.url);
        if (url.pathname === '/Users') {
          return Response.json([{ Id: 'user-1', Name: 'steve', Policy: { IsAdministrator: true } }]);
        }
        return new Response('not found', { status: 404 });
      },
    });

    try {
      mkdirSync(testConfigDir, { recursive: true });
      writeFileSync(join(testConfigDir, 'settings.json'), JSON.stringify({
        defaultServer: {
          serverUrl: `http://127.0.0.1:${server.port}`,
          apiKey: 'test-api-key',
          outputFormat: 'toon',
        },
      }), 'utf-8');

      const badLimit = await runCli(['items', 'list', '--limit', '0', '--format', 'json']);
      expect(badLimit.code).toBe(1);
      expect(badLimit.stderr).toContain('Limit must be a positive integer');

      const badOffset = await runCli(['items', 'list', '--offset', '-1', '--format', 'json']);
      expect(badOffset.code).toBe(1);
      expect(badOffset.stderr).toContain('Offset must be a non-negative integer');
    } finally {
      server.stop(true);
    }
  });
});
