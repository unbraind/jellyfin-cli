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
});
