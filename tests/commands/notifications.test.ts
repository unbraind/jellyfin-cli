import { decode } from '@toon-format/toon';
import { afterEach, describe, expect, it } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { parse as parseYaml } from 'yaml';

const configDir = join(tmpdir(), `jellyfin-cli-notifications-${Date.now()}`);
let server: Bun.Server | undefined;

async function runCli(args: string[]): Promise<{ code: number; stdout: string; stderr: string }> {
  const child = Bun.spawn(['bun', 'run', 'src/cli.ts', ...args], {
    env: { ...process.env, JELLYFIN_CONFIG_DIR: configDir, JELLYFIN_READ_ONLY: '' },
    stdout: 'pipe',
    stderr: 'pipe',
  });
  const [stdout, stderr, code] = await Promise.all([
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
    child.exited,
  ]);
  return { code, stdout, stderr };
}

function writeConfig(): void {
  mkdirSync(configDir, { recursive: true });
  writeFileSync(join(configDir, 'settings.json'), JSON.stringify({
    defaultServer: {
      serverUrl: `http://127.0.0.1:${server!.port}`,
      apiKey: 'test-key',
      userId: 'user-1',
      outputFormat: 'toon',
    },
  }));
}

afterEach(() => {
  server?.stop(true);
  server = undefined;
  rmSync(configDir, { recursive: true, force: true });
});

describe('notifications command', () => {
  it('honors every output format for optional notification types', async () => {
    server = Bun.serve({
      port: 0,
      routes: {
        '/Notifications/Types': Response.json([{
          Type: 'Library',
          Name: 'Library changed',
          Enabled: true,
          Category: 'Library',
        }]),
      },
      fetch() { return new Response('Not Found', { status: 404 }); },
    });
    writeConfig();

    for (const format of ['toon', 'json', 'yaml', 'raw', 'table', 'markdown']) {
      const result = await runCli(['--format', format, 'notifications', 'types']);
      expect(result.code, format).toBe(0);
      expect(result.stderr, format).toBe('');
      if (format === 'toon') {
        expect(decode(result.stdout).data).toHaveLength(1);
      } else if (format === 'json' || format === 'raw') {
        expect(JSON.parse(result.stdout)).toHaveLength(1);
      } else if (format === 'yaml') {
        expect(parseYaml(result.stdout)).toHaveLength(1);
      } else {
        expect(result.stdout).toContain('Library');
      }
    }
  }, 15_000);

  it('returns a structured unavailable result when the optional endpoint is absent', async () => {
    server = Bun.serve({
      port: 0,
      fetch() { return new Response('Not Found', { status: 404 }); },
    });
    writeConfig();

    const result = await runCli(['--format', 'json', 'notifications', 'types']);

    expect(result.code).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual({
      available: false,
      message: 'Optional notification endpoint is not available on this server',
    });
  });

  it('formats notification lists and send receipts through shared output contracts', async () => {
    let sentName: string | null = null;
    server = Bun.serve({
      port: 0,
      routes: {
        '/Notifications/user-1': Response.json({
          Notifications: [{ Id: 'n1', Name: 'Ready', IsRead: false }],
        }),
      },
      fetch(request) {
        const url = new URL(request.url);
        if (url.pathname === '/Notifications/Admin' && request.method === 'POST') {
          sentName = url.searchParams.get('name');
          return new Response(null, { status: 204 });
        }
        return new Response('Not Found', { status: 404 });
      },
    });
    writeConfig();

    const listed = await runCli(['--format', 'json', 'notifications', 'list']);
    const sent = await runCli([
      '--format',
      'json',
      'notifications',
      'send',
      '--name',
      'Maintenance',
    ]);

    expect(listed.code).toBe(0);
    expect(JSON.parse(listed.stdout)).toEqual([{
      id: 'n1',
      name: 'Ready',
      is_read: false,
    }]);
    expect(sent.code).toBe(0);
    expect(JSON.parse(sent.stdout)).toEqual({ success: true, message: 'Notification sent' });
    expect(sentName).toBe('Maintenance');
  });
});
