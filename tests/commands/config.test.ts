import { afterEach, describe, expect, it } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const testConfigDir = join(tmpdir(), `jellyfin-cli-config-test-${Date.now()}`);
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

describe('config doctor command', () => {
  it('returns unconfigured status when no server is set', async () => {
    const result = await runCli(['config', 'doctor']);
    expect(result.code).toBe(0);
    expect(result.stdout).toContain('type: config_doctor');
    expect(result.stdout).toContain('configured: false');
  });

  it('reports connectivity, auth, and openapi stats for configured server', async () => {
    mockServer = Bun.serve({
      port: 0,
      routes: {
        '/System/Info/Public': new Response(
          JSON.stringify({
            ServerName: 'Test Jellyfin',
            Version: '10.11.6',
            LocalAddress: 'http://http://127.0.0.1:8096',
          }),
          { headers: { 'content-type': 'application/json' } },
        ),
        '/Users': new Response(JSON.stringify([{ Id: 'u1', Name: 'steve' }]), {
          headers: { 'content-type': 'application/json' },
        }),
        '/api-docs/openapi.json': new Response(
          JSON.stringify({
            paths: {
              '/System/Info/Public': { get: {} },
              '/Users': { get: {}, post: {} },
            },
          }),
          { headers: { 'content-type': 'application/json' } },
        ),
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
          userId: 'u1',
          outputFormat: 'toon',
          timeout: 5000,
        },
      }),
      'utf-8',
    );

    const result = await runCli(['config', 'doctor']);
    expect(result.code).toBe(0);
    expect(result.stdout).toContain('configured: true');
    expect(result.stdout).toContain('connection_ok: true');
    expect(result.stdout).toContain('auth_ok: true');
    expect(result.stdout).toContain('openapi_available: true');
    expect(result.stdout).toContain('path_count: 2');
    expect(result.stdout).toContain('operation_count: 3');
    expect(result.stdout).toContain('server_local_address_looks_malformed');
    expect(result.stdout).toContain('local_address: http://127.0.0.1:8096');
  });
});
