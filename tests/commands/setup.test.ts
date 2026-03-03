import { afterEach, describe, expect, it } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const testConfigDir = join(tmpdir(), `jellyfin-cli-setup-test-${Date.now()}`);
const cliCommand = ['bun', 'run', 'src/cli.ts'];

async function runCli(args: string[], env: Record<string, string | undefined> = {}): Promise<{ code: number; stdout: string; stderr: string }> {
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
      expect(parsed.startup_complete).toBe(false);
      expect(parsed.setup_wizard_required).toBe(true);
      expect(parsed.configuration.ui_culture).toBe('en-US');
      expect(parsed.first_user.has_name).toBe(true);
      expect(parsed.first_user.has_password_hint).toBe(true);
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
      expect(parsed.startup_complete).toBeNull();
      expect(parsed.setup_wizard_required).toBeNull();
      expect(parsed.warnings).toContain('startup_complete_endpoint_not_available');
    } finally {
      server.stop(true);
    }
  });
});
