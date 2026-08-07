import { decode } from '@toon-format/toon';
import { afterEach, describe, expect, it } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { parse as parseYaml } from 'yaml';
import { runCliInProcess } from '../utils/run-cli-in-process.js';

const configDir = join(tmpdir(), `jellyfin-cli-client-errors-${Date.now()}`);
const isolatedEnv: Record<string, string> = {
  JELLYFIN_SERVER_URL: '',
  JELLYFIN_API_KEY: '',
  JELLYFIN_USERNAME: '',
  JELLYFIN_PASSWORD: '',
  JELLYFIN_USER_ID: '',
  JELLYFIN_OUTPUT_FORMAT: '',
};
let server: Bun.Server | undefined;

async function runCli(format: string): Promise<{ code: number; stdout: string; stderr: string }> {
  return runCliInProcess(
    ['--format', format, 'clientlog', 'send', '--message', 'test'],
    { ...isolatedEnv, JELLYFIN_CONFIG_DIR: configDir },
  );
}

afterEach(() => {
  server?.stop(true);
  server = undefined;
  rmSync(configDir, { recursive: true, force: true });
});

describe('createApiClient structured setup failures', () => {
  it.each(['toon', 'json', 'yaml', 'markdown', 'table', 'raw'])(
    'formats a missing-server failure as %s',
    async (format) => {
      const result = await runCli(format);
      expect(result.code).toBe(1);
      expect(result.stdout).toBe('');
      if (format === 'toon') expect(decode(result.stderr).data.error).toContain('No server URL');
      if (format === 'json') expect(JSON.parse(result.stderr).error).toContain('No server URL');
      if (format === 'yaml') expect(parseYaml(result.stderr).error).toContain('No server URL');
      if (format === 'markdown') expect(result.stderr).toContain('**error**: No server URL');
      if (format === 'table') expect(result.stderr).toContain('error: No server URL');
      if (format === 'raw') expect(result.stderr).toContain('Error: No server URL');
    },
  );

  it.each(['json', 'yaml'])('formats a missing-credential failure as %s', async (format) => {
    mkdirSync(configDir, { recursive: true });
    writeFileSync(join(configDir, 'settings.json'), JSON.stringify({
      defaultServer: { serverUrl: 'http://127.0.0.1:1' },
    }));
    const result = await runCli(format);
    const payload = format === 'json' ? JSON.parse(result.stderr) : parseYaml(result.stderr);
    expect(result.code).toBe(1);
    expect(payload.error).toContain('No API key or username');
  });

  it.each(['json', 'yaml'])('formats an authentication failure as %s', async (format) => {
    server = Bun.serve({
      port: 0,
      fetch: () => new Response('Unauthorized', { status: 401 }),
    });
    mkdirSync(configDir, { recursive: true });
    writeFileSync(join(configDir, 'settings.json'), JSON.stringify({
      defaultServer: {
        serverUrl: `http://127.0.0.1:${server.port}`,
        username: 'test-user',
        password: 'test-password',
      },
    }));
    const result = await runCli(format);
    const payload = format === 'json' ? JSON.parse(result.stderr) : parseYaml(result.stderr);
    expect(result.code).toBe(1);
    expect(payload.error).toContain('Authentication failed');
  });
});
