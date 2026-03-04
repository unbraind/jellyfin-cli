import { afterEach, describe, expect, it } from 'vitest';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
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

  it('reports formatter validation status when --validate-formats is enabled', async () => {
    mockServer = Bun.serve({
      port: 0,
      routes: {
        '/System/Info/Public': new Response(
          JSON.stringify({
            ServerName: 'Test Jellyfin',
            Version: '10.11.6',
            LocalAddress: 'http://127.0.0.1:8096',
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

    const result = await runCli(['config', 'doctor', '--validate-formats', '--format', 'json']);
    expect(result.code).toBe(0);
    const payload = JSON.parse(result.stdout) as {
      format_validations?: {
        enabled: boolean;
        all_ok: boolean;
        formats: Record<string, { ok: boolean }>;
      };
    };
    expect(payload.format_validations?.enabled).toBe(true);
    expect(payload.format_validations?.all_ok).toBe(true);
    expect(payload.format_validations?.formats.toon?.ok).toBe(true);
    expect(payload.format_validations?.formats.json?.ok).toBe(true);
    expect(payload.format_validations?.formats.yaml?.ok).toBe(true);
    expect(payload.format_validations?.formats.markdown?.ok).toBe(true);
    expect(payload.format_validations?.formats.table?.ok).toBe(true);
    expect(payload.format_validations?.formats.raw?.ok).toBe(true);
  });

  it('exits non-zero when --require-connected is set and config is missing', async () => {
    const result = await runCli(['config', 'doctor', '--require-connected', '--format', 'json']);
    expect(result.code).toBe(1);
    const payload = JSON.parse(result.stdout) as {
      configured: boolean;
      requirements?: {
        all_met: boolean;
        checks: {
          connection_ok: boolean | null;
        };
      };
    };
    expect(payload.configured).toBe(false);
    expect(payload.requirements?.all_met).toBe(false);
    expect(payload.requirements?.checks.connection_ok).toBe(false);
  });

  it('exits non-zero when --require-openapi is set and OpenAPI is unavailable', async () => {
    mockServer = Bun.serve({
      port: 0,
      routes: {
        '/System/Info/Public': new Response(
          JSON.stringify({
            ServerName: 'Test Jellyfin',
            Version: '10.11.6',
            LocalAddress: 'http://127.0.0.1:8096',
          }),
          { headers: { 'content-type': 'application/json' } },
        ),
        '/Users': new Response(JSON.stringify([{ Id: 'u1', Name: 'steve' }]), {
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
          userId: 'u1',
          outputFormat: 'toon',
          timeout: 5000,
        },
      }),
      'utf-8',
    );

    const result = await runCli(['config', 'doctor', '--require-openapi', '--format', 'json']);
    expect(result.code).toBe(1);
    const payload = JSON.parse(result.stdout) as {
      checks?: { openapi_available: boolean };
      requirements?: {
        all_met: boolean;
        checks: {
          openapi_available: boolean | null;
        };
      };
    };
    expect(payload.checks?.openapi_available).toBe(false);
    expect(payload.requirements?.all_met).toBe(false);
    expect(payload.requirements?.checks.openapi_available).toBe(false);
  });
});

describe('config set command', () => {
  it('updates active named server when --name is omitted', async () => {
    mkdirSync(testConfigDir, { recursive: true });
    writeFileSync(
      join(testConfigDir, 'settings.json'),
      JSON.stringify({
        defaultServer: {
          serverUrl: 'http://default.local:8096',
          apiKey: 'default-key',
          timeout: 30000,
          outputFormat: 'toon',
        },
        servers: {
          local: {
            serverUrl: 'http://local.local:8096',
            apiKey: 'local-key',
            timeout: 30000,
            outputFormat: 'toon',
          },
        },
        currentServer: 'local',
      }),
      'utf-8',
    );

    const result = await runCli(['config', 'set', '--timeout', '90000']);
    expect(result.code).toBe(0);

    const settings = JSON.parse(readFileSync(join(testConfigDir, 'settings.json'), 'utf-8')) as {
      defaultServer?: { timeout?: number };
      servers?: Record<string, { timeout?: number }>;
    };

    expect(settings.servers?.local?.timeout).toBe(90000);
    expect(settings.defaultServer?.timeout).toBe(30000);
  });
});
