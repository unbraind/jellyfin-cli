import { afterEach, describe, expect, it } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const testConfigDir = join(tmpdir(), `jellyfin-cli-global-options-test-${Date.now()}`);
const cliCommand = ['bun', 'run', 'src/cli.ts'];
let mockServer: Bun.Server | undefined;
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

async function runCli(
  args: string[],
  env: Record<string, string | undefined> = {},
): Promise<{ code: number; stdout: string; stderr: string }> {
  const proc = Bun.spawn([...cliCommand, ...args], {
    env: {
      ...process.env,
      ...isolatedJellyfinEnv,
      JELLYFIN_CONFIG_DIR: testConfigDir,
      ...env,
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
  if (mockServer) {
    mockServer.stop(true);
    mockServer = undefined;
  }
  rmSync(testConfigDir, { recursive: true, force: true });
});

describe('global CLI option propagation', () => {
  it('applies global --format to commands that rely on createApiClient options', async () => {
    mockServer = Bun.serve({
      port: 0,
      routes: {
        '/Health': new Response('"Healthy"', {
          headers: { 'content-type': 'application/json' },
        }),
      },
      fetch() {
        return new Response('Not Found', { status: 404 });
      },
    });

    mkdirSync(testConfigDir, { recursive: true });
    writeFileSync(
      join(testConfigDir, 'settings.json'),
      JSON.stringify({
        defaultServer: {
          serverUrl: `http://127.0.0.1:${mockServer.port}`,
          apiKey: 'test-api-key',
          outputFormat: 'toon',
        },
      }),
      'utf-8',
    );

    const result = await runCli(['--format', 'json', 'system', 'health']);
    expect(result.code).toBe(0);
    expect(() => JSON.parse(result.stdout)).not.toThrow();
    expect(result.stdout).toContain('"success":true');
    expect(result.stdout).toContain('Server health: Healthy');
  });

  it('applies global --server to commands that use createApiClient', async () => {
    mockServer = Bun.serve({
      port: 0,
      routes: {
        '/Health': new Response('"Healthy"', {
          headers: { 'content-type': 'application/json' },
        }),
      },
      fetch() {
        return new Response('Not Found', { status: 404 });
      },
    });

    mkdirSync(testConfigDir, { recursive: true });
    writeFileSync(
      join(testConfigDir, 'settings.json'),
      JSON.stringify({
        defaultServer: {
          serverUrl: 'http://127.0.0.1:1',
          apiKey: 'invalid-default-key',
          outputFormat: 'toon',
        },
        servers: {
          working: {
            serverUrl: `http://127.0.0.1:${mockServer.port}`,
            apiKey: 'test-api-key',
            outputFormat: 'toon',
          },
        },
      }),
      'utf-8',
    );

    const result = await runCli(['--server', 'working', '--format', 'json', 'system', 'health']);
    expect(result.code).toBe(0);
    expect(result.stdout).toContain('"success":true');
    expect(result.stdout).toContain('Server health: Healthy');
  });

  it('applies global --format json to system info output', async () => {
    mockServer = Bun.serve({
      port: 0,
      routes: {
        '/System/Info': Response.json({
          ServerName: 'Test Server',
          Version: '10.11.6',
          Id: 'server-1',
          LocalAddress: `http://127.0.0.1:${0}`,
          HasPendingRestart: false,
          CanSelfRestart: true,
        }),
      },
      fetch() {
        return new Response('Not Found', { status: 404 });
      },
    });

    mkdirSync(testConfigDir, { recursive: true });
    writeFileSync(
      join(testConfigDir, 'settings.json'),
      JSON.stringify({
        defaultServer: {
          serverUrl: `http://127.0.0.1:${mockServer.port}`,
          apiKey: 'test-api-key',
          outputFormat: 'toon',
        },
      }),
      'utf-8',
    );

    const result = await runCli(['--format', 'json', 'system', 'info']);
    expect(result.code).toBe(0);
    const parsed = JSON.parse(result.stdout);
    expect(parsed.ServerName).toBe('Test Server');
    expect(parsed.Version).toBe('10.11.6');
  });

  it('applies global --format json to users me output', async () => {
    const userId = 'user-1';
    mockServer = Bun.serve({
      port: 0,
      routes: {
        '/Users/user-1': Response.json({
          Id: userId,
          Name: 'steve',
          ServerId: 'server-1',
        }),
      },
      fetch(request) {
        const url = new URL(request.url);
        if (url.pathname === '/Users') {
          return Response.json([{ Id: userId, Name: 'steve' }]);
        }
        return new Response('Not Found', { status: 404 });
      },
    });

    mkdirSync(testConfigDir, { recursive: true });
    writeFileSync(
      join(testConfigDir, 'settings.json'),
      JSON.stringify({
        defaultServer: {
          serverUrl: `http://127.0.0.1:${mockServer.port}`,
          apiKey: 'test-api-key',
          userId,
          outputFormat: 'toon',
        },
      }),
      'utf-8',
    );

    const result = await runCli(['--format', 'json', 'users', 'me']);
    expect(result.code).toBe(0);
    const parsed = JSON.parse(result.stdout);
    expect(parsed.Id).toBe(userId);
    expect(parsed.Name).toBe('steve');
  });

  it('applies global --format json to items list output', async () => {
    mockServer = Bun.serve({
      port: 0,
      routes: {
        '/Users/user-1/Items': Response.json({
          Items: [
            { Id: 'item-1', Name: 'Movie A', Type: 'Movie' },
          ],
          TotalRecordCount: 1,
        }),
      },
      fetch(request) {
        const url = new URL(request.url);
        if (url.pathname === '/Users') {
          return Response.json([{ Id: 'user-1', Name: 'steve' }]);
        }
        return new Response('Not Found', { status: 404 });
      },
    });

    mkdirSync(testConfigDir, { recursive: true });
    writeFileSync(
      join(testConfigDir, 'settings.json'),
      JSON.stringify({
        defaultServer: {
          serverUrl: `http://127.0.0.1:${mockServer.port}`,
          apiKey: 'test-api-key',
          userId: 'user-1',
          outputFormat: 'toon',
        },
      }),
      'utf-8',
    );

    const result = await runCli(['--format', 'json', 'items', 'list', '--limit', '1']);
    expect(result.code).toBe(0);
    const parsed = JSON.parse(result.stdout);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0].Id).toBe('item-1');
  });

  it('applies global --format json to config doctor output', async () => {
    mockServer = Bun.serve({
      port: 0,
      routes: {
        '/System/Info/Public': Response.json({
          ServerName: 'Test Server',
          Version: '10.11.6',
          LocalAddress: 'http://127.0.0.1:8096',
        }),
        '/Users': Response.json([{ Id: 'user-1', Name: 'steve' }]),
        '/api-docs/openapi.json': Response.json({
          paths: {
            '/Users': { get: {} },
          },
        }),
      },
      fetch() {
        return new Response('Not Found', { status: 404 });
      },
    });

    mkdirSync(testConfigDir, { recursive: true });
    writeFileSync(
      join(testConfigDir, 'settings.json'),
      JSON.stringify({
        defaultServer: {
          serverUrl: `http://127.0.0.1:${mockServer.port}`,
          apiKey: 'test-api-key',
          userId: 'user-1',
          outputFormat: 'toon',
        },
      }),
      'utf-8',
    );

    const result = await runCli(['--format', 'json', 'config', 'doctor']);
    expect(result.code).toBe(0);
    const parsed = JSON.parse(result.stdout);
    const payload = parsed.data ?? parsed;
    expect(payload.configured).toBe(true);
    expect(payload.checks.connection_ok).toBe(true);
  });
});
