import { afterEach, describe, expect, it } from 'vitest';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const testConfigDir = join(tmpdir(), `jellyfin-cli-setup-env-file-test-${Date.now()}`);
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

async function runCli(
  args: string[],
  env: Record<string, string | undefined> = {},
): Promise<{ code: number; stdout: string; stderr: string }> {
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

describe('setup env --write-file', () => {
  it('writes masked key/value env file by default', async () => {
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

    const outputPath = join(testConfigDir, 'setup.env');
    const result = await runCli(['setup', 'env', '--write-file', outputPath, '--format', 'json']);
    expect(result.code).toBe(0);
    const parsed = JSON.parse(result.stdout);
    expect(parsed.masked).toBe(true);
    expect(parsed.shell).toBe(false);
    expect(parsed.line_count).toBe(parsed.variable_count);
    expect(parsed.wrote_to).toBe(outputPath);

    const written = readFileSync(outputPath, 'utf-8');
    expect(written).toContain('JELLYFIN_SERVER_URL=http://example.local:8096');
    expect(written).toContain('JELLYFIN_API_KEY=supe...ey');
    expect(written).toContain('JELLYFIN_PASSWORD=top-...rd');
    expect(written).not.toContain('super-secret-api-key');
    expect(written).not.toContain('top-secret-password');
  });

  it('writes shell exports with secrets when explicitly requested', async () => {
    mkdirSync(testConfigDir, { recursive: true });
    writeFileSync(join(testConfigDir, 'settings.json'), JSON.stringify({
      defaultServer: {
        serverUrl: 'http://example.local:8096',
        apiKey: "abc'def",
        password: 'secret',
        outputFormat: 'toon',
      },
    }), 'utf-8');

    const outputPath = join(testConfigDir, 'setup.exports');
    const result = await runCli([
      'setup',
      'env',
      '--shell',
      '--show-secrets',
      '--write-file',
      outputPath,
      '--format',
      'json',
    ]);
    expect(result.code).toBe(0);
    const parsed = JSON.parse(result.stdout);
    expect(parsed.masked).toBe(false);
    expect(parsed.shell).toBe(true);
    expect(parsed.wrote_to).toBe(outputPath);

    const written = readFileSync(outputPath, 'utf-8');
    expect(written).toContain("export JELLYFIN_API_KEY='abc'\\''def'");
    expect(written).toContain("export JELLYFIN_PASSWORD='secret'");
  });
});
