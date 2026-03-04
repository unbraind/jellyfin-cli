import { afterEach, describe, expect, it } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const testConfigDir = join(tmpdir(), `jellyfin-cli-setup-test-${Date.now()}`);
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

async function runCli(args: string[], env: Record<string, string | undefined> = {}): Promise<{ code: number; stdout: string; stderr: string }> {
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
  rmSync(testConfigDir, { recursive: true, force: true });
});

describe('setup command', () => {
  it('setup status honors --format json when unconfigured', async () => {
    const result = await runCli(['setup', 'status', '--format', 'json']);
    expect(result.code).toBe(0);
    const parsed = JSON.parse(result.stdout);
    expect(parsed.configured).toBe(false);
    expect(parsed.message).toContain('No server configured');
  });

  it('prints masked environment values by default', async () => {
    mkdirSync(testConfigDir, { recursive: true });
    writeFileSync(join(testConfigDir, 'settings.json'), JSON.stringify({
      defaultServer: {
        serverUrl: 'http://example.local:8096',
        apiKey: 'super-secret-api-key',
        username: 'agent-user',
        password: 'top-secret-password',
        userId: 'user-1',
        timeout: 45000,
        outputFormat: 'toon',
      },
    }), 'utf-8');

    const result = await runCli(['setup', 'env']);
    expect(result.code).toBe(0);
    expect(result.stdout).toContain('JELLYFIN_SERVER_URL=http://example.local:8096');
    expect(result.stdout).toContain('JELLYFIN_API_KEY=supe...ey');
    expect(result.stdout).toContain('JELLYFIN_PASSWORD=top-...rd');
    expect(result.stdout).not.toContain('super-secret-api-key');
    expect(result.stdout).not.toContain('top-secret-password');
  });

  it('prints structured setup env output when --format is provided', async () => {
    mkdirSync(testConfigDir, { recursive: true });
    writeFileSync(join(testConfigDir, 'settings.json'), JSON.stringify({
      defaultServer: {
        serverUrl: 'http://example.local:8096',
        apiKey: 'super-secret-api-key',
        username: 'agent-user',
        password: 'top-secret-password',
        userId: 'user-1',
        timeout: 45000,
        outputFormat: 'toon',
      },
    }), 'utf-8');

    const result = await runCli(['setup', 'env', '--format', 'json']);
    expect(result.code).toBe(0);
    const parsed = JSON.parse(result.stdout);
    expect(parsed.masked).toBe(true);
    expect(parsed.variable_count).toBeGreaterThan(0);
    expect(parsed.variables.JELLYFIN_SERVER_URL).toBe('http://example.local:8096');
    expect(parsed.variables.JELLYFIN_API_KEY).toBe('supe...ey');
    expect(parsed.variables.JELLYFIN_PASSWORD).toBe('top-...rd');
  });

  it('prints shell exports from setup env', async () => {
    mkdirSync(testConfigDir, { recursive: true });
    writeFileSync(join(testConfigDir, 'settings.json'), JSON.stringify({
      defaultServer: {
        serverUrl: 'http://example.local:8096',
        apiKey: "abc'def",
        outputFormat: 'toon',
      },
    }), 'utf-8');

    const result = await runCli(['setup', 'env', '--shell', '--show-secrets']);
    expect(result.code).toBe(0);
    expect(result.stdout).toContain("export JELLYFIN_API_KEY='abc'\\''def'");
  });

  it('rejects invalid setup URL values before network calls', async () => {
    const result = await runCli(
      [
        'setup',
        '--api-key',
        'abc',
        '--non-interactive',
      ],
      { JELLYFIN_SERVER_URL: 'not-a-url' },
    );

    expect(result.code).toBe(1);
    expect(result.stderr).toContain('Server URL must be a valid http(s) URL');
  });

  it('renders setup validation errors in requested runtime format', async () => {
    const result = await runCli(
      [
        'setup',
        '--api-key',
        'abc',
        '--non-interactive',
        '--format',
        'json',
      ],
      { JELLYFIN_SERVER_URL: 'not-a-url' },
    );

    expect(result.code).toBe(1);
    const parsed = JSON.parse(result.stderr);
    expect(parsed.error).toContain('Server URL must be a valid http(s) URL');
  });

  it('accepts api key auth with username to resolve user id', async () => {
    const server = Bun.serve({
      port: 0,
      fetch(request) {
        const url = new URL(request.url);
        if (url.pathname === '/System/Info/Public') {
          return Response.json({
            ServerName: 'Local Jellyfin',
            Version: '10.9.0',
            Id: 'server-1',
            LocalAddress: `http://127.0.0.1:${server.port}`,
          });
        }
        if (url.pathname === '/Users') {
          return Response.json([
            { Id: 'user-steve', Name: 'steve', Policy: { IsAdministrator: false } },
            { Id: 'user-admin', Name: 'admin', Policy: { IsAdministrator: true } },
          ]);
        }
        return new Response('not found', { status: 404 });
      },
    });

    try {
      const result = await runCli([
        'setup',
        '--server',
        `http://127.0.0.1:${server.port}`,
        '--api-key',
        'test-api-key',
        '--username',
        'steve',
        '--non-interactive',
        '--format',
        'json',
      ]);
      expect(result.code).toBe(0);
      const trimmed = result.stdout.trim();
      const lastObjectStart = trimmed.lastIndexOf('\n{');
      const jsonText = lastObjectStart >= 0 ? trimmed.slice(lastObjectStart + 1) : trimmed;
      const parsed = JSON.parse(jsonText);
      expect(parsed.has_api_key).toBe(true);
      expect(parsed.username).toBe('steve');
      expect(parsed.user_id).toBe('user-steve');
      expect(parsed.setup_complete).toBe(true);
    } finally {
      server.stop(true);
    }
  });

  it('ignores inherited password when explicit api key is provided', async () => {
    const server = Bun.serve({
      port: 0,
      fetch(request) {
        const url = new URL(request.url);
        if (url.pathname === '/System/Info/Public') {
          return Response.json({
            ServerName: 'Local Jellyfin',
            Version: '10.9.0',
            Id: 'server-1',
            LocalAddress: `http://127.0.0.1:${server.port}`,
          });
        }
        if (url.pathname === '/Users') {
          return Response.json([{ Id: 'user-steve', Name: 'steve', Policy: { IsAdministrator: false } }]);
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
            password: 'stale-password',
            outputFormat: 'toon',
          },
        }),
        'utf-8',
      );

      const result = await runCli([
        'setup',
        '--api-key',
        'test-api-key',
        '--username',
        'steve',
        '--non-interactive',
        '--format',
        'json',
      ]);
      expect(result.code).toBe(0);
      expect(result.stderr).not.toContain('Do not combine --api-key with --password');
    } finally {
      server.stop(true);
    }
  });

  it('ignores inherited password when saved config already has api key', async () => {
    const server = Bun.serve({
      port: 0,
      fetch(request) {
        const url = new URL(request.url);
        if (url.pathname === '/System/Info/Public') {
          return Response.json({
            ServerName: 'Local Jellyfin',
            Version: '10.9.0',
            Id: 'server-1',
            LocalAddress: `http://127.0.0.1:${server.port}`,
          });
        }
        if (url.pathname === '/Users') {
          return Response.json([{ Id: 'user-steve', Name: 'steve', Policy: { IsAdministrator: false } }]);
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
            apiKey: 'saved-api-key',
            password: 'stale-password',
            outputFormat: 'toon',
          },
        }),
        'utf-8',
      );

      const result = await runCli(['setup', '--non-interactive', '--format', 'json']);
      expect(result.code).toBe(0);
      expect(result.stderr).not.toContain('Do not combine --api-key with --password');
    } finally {
      server.stop(true);
    }
  });

  it('setup startup reports startup wizard state for configured server', async () => {
    const server = Bun.serve({
      port: 0,
      fetch(request) {
        const url = new URL(request.url);
        if (url.pathname === '/Startup/Configuration') {
          return Response.json({
            UICulture: 'en-US',
            MetadataCountryCode: 'US',
            PreferredMetadataLanguage: 'en',
          });
        }
        if (url.pathname === '/Startup/FirstUser') {
          return Response.json({ Name: 'admin', PasswordHint: 'hint' });
        }
        if (url.pathname === '/Startup/Complete') {
          return Response.json(false);
        }
        return new Response('not found', { status: 404 });
      },
    });

    try {
      mkdirSync(testConfigDir, { recursive: true });
      writeFileSync(join(testConfigDir, 'settings.json'), JSON.stringify({
        defaultServer: {
          serverUrl: `http://127.0.0.1:${server.port}`,
          apiKey: 'test-key',
          outputFormat: 'toon',
        },
      }), 'utf-8');

      const result = await runCli(['setup', 'startup', '--format', 'json']);
      expect(result.code).toBe(0);
      const parsed = JSON.parse(result.stdout);
      expect(parsed.startup_complete_state).toBe('required');
      expect(parsed.startup_complete).toBe(false);
      expect(parsed.setup_wizard_required).toBe(true);
      expect(parsed.configuration.ui_culture).toBe('en-US');
      expect(parsed.first_user.has_name).toBe(true);
      expect(parsed.first_user.has_password_hint).toBe(true);
    } finally {
      server.stop(true);
    }
  });

  it('setup configuration alias reports startup diagnostics', async () => {
    const server = Bun.serve({
      port: 0,
      fetch(request) {
        const url = new URL(request.url);
        if (url.pathname === '/Startup/Configuration') {
          return Response.json({
            UICulture: 'de-AT',
            MetadataCountryCode: 'AT',
            PreferredMetadataLanguage: 'de',
          });
        }
        if (url.pathname === '/Startup/FirstUser') {
          return Response.json({ Name: 'admin' });
        }
        if (url.pathname === '/Startup/Complete') {
          return Response.json(true);
        }
        return new Response('not found', { status: 404 });
      },
    });

    try {
      mkdirSync(testConfigDir, { recursive: true });
      writeFileSync(join(testConfigDir, 'settings.json'), JSON.stringify({
        defaultServer: {
          serverUrl: `http://127.0.0.1:${server.port}`,
          apiKey: 'test-key',
          outputFormat: 'toon',
        },
      }), 'utf-8');

      const result = await runCli(['setup', 'configuration', '--format', 'json']);
      expect(result.code).toBe(0);
      const parsed = JSON.parse(result.stdout);
      expect(parsed.startup_complete_state).toBe('complete');
      expect(parsed.configuration.ui_culture).toBe('de-AT');
      expect(parsed.first_user.has_name).toBe(true);
    } finally {
      server.stop(true);
    }
  });

  it('setup startup fails when no server is configured', async () => {
    const result = await runCli(['setup', 'startup', '--format', 'json']);
    expect(result.code).toBe(1);
    const parsed = JSON.parse(result.stderr);
    expect(parsed.error).toContain('No server configured');
  });

  it('setup startup tolerates /Startup/Complete returning 405', async () => {
    const server = Bun.serve({
      port: 0,
      fetch(request) {
        const url = new URL(request.url);
        if (url.pathname === '/Startup/Configuration') {
          return Response.json({
            UICulture: 'en-US',
            MetadataCountryCode: 'US',
            PreferredMetadataLanguage: 'en',
          });
        }
        if (url.pathname === '/Startup/FirstUser') {
          return Response.json({ Name: 'admin' });
        }
        if (url.pathname === '/Startup/Complete') {
          return new Response('method not allowed', { status: 405 });
        }
        return new Response('not found', { status: 404 });
      },
    });

    try {
      mkdirSync(testConfigDir, { recursive: true });
      writeFileSync(join(testConfigDir, 'settings.json'), JSON.stringify({
        defaultServer: {
          serverUrl: `http://127.0.0.1:${server.port}`,
          apiKey: 'test-key',
          outputFormat: 'toon',
        },
      }), 'utf-8');

      const result = await runCli(['setup', 'startup', '--format', 'json']);
      expect(result.code).toBe(0);
      const parsed = JSON.parse(result.stdout);
      expect(parsed.startup_complete_state).toBe('unknown');
      expect(parsed.startup_complete).toBeNull();
      expect(parsed.setup_wizard_required).toBeNull();
      expect(parsed.warnings).toContain('startup_complete_endpoint_not_available');
    } finally {
      server.stop(true);
    }
  });

  it('setup update-configuration requires at least one field option', async () => {
    mkdirSync(testConfigDir, { recursive: true });
    writeFileSync(join(testConfigDir, 'settings.json'), JSON.stringify({
      defaultServer: {
        serverUrl: 'http://127.0.0.1:8096',
        apiKey: 'test-key',
        outputFormat: 'toon',
      },
    }), 'utf-8');

    const result = await runCli(['setup', 'update-configuration', '--format', 'json']);
    expect(result.code).toBe(1);
    const parsed = JSON.parse(result.stderr);
    expect(parsed.error).toContain('At least one option is required');
  });

  it('setup update-configuration posts startup configuration', async () => {
    let receivedBody: unknown;
    const server = Bun.serve({
      port: 0,
      async fetch(request) {
        const url = new URL(request.url);
        if (url.pathname === '/Startup/Configuration' && request.method === 'POST') {
          receivedBody = await request.json();
          return new Response(null, { status: 204 });
        }
        return new Response('not found', { status: 404 });
      },
    });

    try {
      mkdirSync(testConfigDir, { recursive: true });
      writeFileSync(join(testConfigDir, 'settings.json'), JSON.stringify({
        defaultServer: {
          serverUrl: `http://127.0.0.1:${server.port}`,
          apiKey: 'test-key',
          outputFormat: 'toon',
        },
      }), 'utf-8');

      const result = await runCli([
        'setup',
        'update-configuration',
        '--ui-culture',
        'en-US',
        '--metadata-country-code',
        'US',
        '--preferred-metadata-language',
        'en',
        '--format',
        'json',
      ]);
      expect(result.code).toBe(0);
      expect(receivedBody).toEqual({
        UICulture: 'en-US',
        MetadataCountryCode: 'US',
        PreferredMetadataLanguage: 'en',
      });
      const parsed = JSON.parse(result.stdout);
      expect(parsed.updated).toBe(true);
      expect(parsed.configuration.ui_culture).toBe('en-US');
    } finally {
      server.stop(true);
    }
  });
});
