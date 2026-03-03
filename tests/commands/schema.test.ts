import { afterEach, describe, expect, it } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const testConfigDir = join(tmpdir(), `jellyfin-cli-schema-test-${Date.now()}`);
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

describe('schema openapi command', () => {
  it('returns openapi summary with optional operation list', async () => {
    mockServer = Bun.serve({
      port: 0,
      routes: {
        '/api-docs/openapi.json': new Response(
          JSON.stringify({
            info: { version: '10.11.6' },
            paths: {
              '/Users': { get: { tags: ['Users'] }, post: { tags: ['Users'] } },
              '/System/Info/Public': { get: { tags: ['System'] } },
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
          outputFormat: 'toon',
        },
      }),
      'utf-8',
    );

    const result = await runCli(['schema', 'openapi', '--include-paths', '--limit', '2']);
    expect(result.code).toBe(0);
    expect(result.stdout).toContain('type: openapi_summary');
    expect(result.stdout).toContain('path_count: 2');
    expect(result.stdout).toContain('operation_count: 3');
    expect(result.stdout).toContain('operations:');
  });

  it('returns error for invalid --limit', async () => {
    const result = await runCli(['schema', 'openapi', '--limit', '0']);
    expect(result.code).toBe(1);
    expect(result.stderr).toContain('Limit must be a positive integer');
  });
});

describe('schema tools command', () => {
  it('exports tool schemas with read-only safety metadata', async () => {
    const result = await runCli(['schema', 'tools', '--command', 'system', '--limit', '5']);
    expect(result.code).toBe(0);
    expect(result.stdout).toContain('type: tool_schemas');
    expect(result.stdout).toContain('command: jf system activity');
    expect(result.stdout).toContain('read_only_safe: true');
    expect(result.stdout).toContain('tools:');
  });

  it('returns error for invalid --limit', async () => {
    const result = await runCli(['schema', 'tools', '--limit', '0']);
    expect(result.code).toBe(1);
    expect(result.stderr).toContain('Limit must be a positive integer');
  });
});
