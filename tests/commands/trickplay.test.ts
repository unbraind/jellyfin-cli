import { afterEach, describe, expect, it } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const testConfigDir = join(tmpdir(), `jellyfin-cli-trickplay-test-${Date.now()}`);
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

describe('trickplay command', () => {
  it('hls-url honors --format json', async () => {
    mkdirSync(testConfigDir, { recursive: true });
    writeFileSync(
      join(testConfigDir, 'settings.json'),
      JSON.stringify({
        defaultServer: {
          serverUrl: 'http://127.0.0.1:8096',
          apiKey: 'test-api-key',
          userId: 'user-1',
          outputFormat: 'toon',
        },
      }),
      'utf-8',
    );

    const result = await runCli(['trickplay', 'hls-url', 'item-1', '320', '--format', 'json']);
    expect(result.code).toBe(0);
    const parsed = JSON.parse(result.stdout) as { url: string; item_id: string; width: string };
    expect(parsed.item_id).toBe('item-1');
    expect(parsed.width).toBe('320');
    expect(parsed.url).toContain('/Videos/item-1/Trickplay/320/');
  });

  it('tile-url honors --format json', async () => {
    mkdirSync(testConfigDir, { recursive: true });
    writeFileSync(
      join(testConfigDir, 'settings.json'),
      JSON.stringify({
        defaultServer: {
          serverUrl: 'http://127.0.0.1:8096',
          apiKey: 'test-api-key',
          userId: 'user-1',
          outputFormat: 'toon',
        },
      }),
      'utf-8',
    );

    const result = await runCli(['trickplay', 'tile-url', 'item-2', '320', '7', '--format', 'json']);
    expect(result.code).toBe(0);
    const parsed = JSON.parse(result.stdout) as { url: string; item_id: string; width: string; index: string };
    expect(parsed.item_id).toBe('item-2');
    expect(parsed.width).toBe('320');
    expect(parsed.index).toBe('7');
    expect(parsed.url).toContain('/Videos/item-2/Trickplay/320/7.jpg');
  });
});
