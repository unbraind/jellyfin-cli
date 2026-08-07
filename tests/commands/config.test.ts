import { afterEach, describe, expect, it } from 'vitest';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { runCliInProcess } from '../utils/run-cli-in-process.js';

const testConfigDir = join(tmpdir(), `jellyfin-cli-config-test-${Date.now()}`);
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
  JELLYFIN_OPENAPI_OFFICIAL_FALLBACK: '0',
};

async function runCli(
  args: string[],
  env: Record<string, string | undefined> = {},
): Promise<{ code: number; stdout: string; stderr: string }> {
  return runCliInProcess(args, {
    ...isolatedJellyfinEnv,
    JELLYFIN_CONFIG_DIR: testConfigDir,
    ...env,
  });
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
    expect(result.stdout).toContain('local_address: "http://127.0.0.1:8096"');
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

describe('config output format support', () => {
  it('supports structured json output for config path', async () => {
    const result = await runCli(['config', 'path', '--format', 'json']);
    expect(result.code).toBe(0);
    const payload = JSON.parse(result.stdout) as { config_path?: string };
    expect(payload.config_path).toBe(join(testConfigDir, 'settings.json'));
  });

  it('masks secrets in config get when using structured formats', async () => {
    mkdirSync(testConfigDir, { recursive: true });
    writeFileSync(
      join(testConfigDir, 'settings.json'),
      JSON.stringify({
        defaultServer: {
          serverUrl: 'http://127.0.0.1:8096',
          apiKey: 'real-api-key-value',
          password: 'real-password-value',
          username: 'steve',
          userId: 'u1',
          outputFormat: 'toon',
          timeout: 5000,
        },
      }),
      'utf-8',
    );

    const result = await runCli(['config', 'get', '--format', 'json']);
    expect(result.code).toBe(0);
    const payload = JSON.parse(result.stdout) as {
      server_url?: string;
      username?: string | null;
      user_id?: string | null;
      apiKey?: string;
      password?: string;
    };
    expect(payload.server_url).toBe('http://127.0.0.1:8096');
    expect(payload.username).toBe('steve');
    expect(payload.user_id).toBe('u1');
    expect(Object.prototype.hasOwnProperty.call(payload, 'has_api_key')).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(payload, 'has_password')).toBe(false);
    expect(payload.apiKey).toBeUndefined();
    expect(payload.password).toBeUndefined();
  });

  it('preserves the safe server-list array shape in JSON output', async () => {
    mkdirSync(testConfigDir, { recursive: true });
    writeFileSync(join(testConfigDir, 'settings.json'), JSON.stringify({
      defaultServer: {
        serverUrl: 'http://default.local:8096',
        apiKey: 'default-secret',
        password: 'default-password',
        username: 'default-user',
      },
      servers: {
        local: {
          serverUrl: 'http://local.local:8096',
          apiKey: 'local-secret',
          password: 'local-password',
          username: 'local-user',
        },
      },
      currentServer: 'local',
    }));

    const result = await runCli(['config', 'list', '--format', 'json']);
    const payload = JSON.parse(result.stdout) as Record<string, unknown>[];
    expect(result.code).toBe(0);
    expect(Array.isArray(payload)).toBe(true);
    expect(payload).toHaveLength(2);
    expect(payload[0]).toHaveProperty('server_url');
    expect(payload.every((entry) => !('apiKey' in entry) && !('password' in entry))).toBe(true);
  });

  it('preserves the canonical system-info projection in config test output', async () => {
    mockServer = Bun.serve({
      port: 0,
      routes: {
        '/System/Info/Public': Response.json({
          ServerName: 'Test Jellyfin',
          Version: '10.11.11',
          Id: 'server-1',
          LocalAddress: 'http://127.0.0.1:8096',
          OperatingSystem: 'Linux',
          HasPendingRestart: false,
          CanSelfRestart: true,
        }),
      },
      fetch: () => new Response('Not Found', { status: 404 }),
    });
    mkdirSync(testConfigDir, { recursive: true });
    writeFileSync(join(testConfigDir, 'settings.json'), JSON.stringify({
      defaultServer: {
        serverUrl: `http://127.0.0.1:${mockServer.port}`,
        apiKey: 'test-key',
      },
    }));

    const result = await runCli(['config', 'test', '--format', 'json']);
    expect(result.code).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual({
      name: 'Test Jellyfin',
      version: '10.11.11',
      id: 'server-1',
      local_address: 'http://127.0.0.1:8096',
      operating_system: 'Linux',
      has_pending_restart: false,
      can_self_restart: true,
    });
  });
});
