import { afterEach, describe, expect, it } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const testConfigDir = join(tmpdir(), `jellyfin-cli-global-options-test-${Date.now()}`);
const cliCommand = ['bun', 'run', 'src/cli.ts'];
let mockServer: Bun.Server | undefined;

async function runCli(
  args: string[],
  env: Record<string, string | undefined> = {},
): Promise<{ code: number; stdout: string; stderr: string }> {
  const proc = Bun.spawn([...cliCommand, ...args], {
    env: {
      ...process.env,
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
});
