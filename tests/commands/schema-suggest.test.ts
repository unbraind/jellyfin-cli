import { afterEach, describe, expect, it } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const testConfigDir = join(tmpdir(), `jellyfin-cli-schema-suggest-test-${Date.now()}`);
const cliCommand = ['bun', 'run', 'src/cli.ts'];
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

function writeTestConfig(serverUrl: string): void {
  mkdirSync(testConfigDir, { recursive: true });
  writeFileSync(
    join(testConfigDir, 'settings.json'),
    JSON.stringify({
      defaultServer: {
        serverUrl,
        apiKey: 'test-api-key',
        outputFormat: 'toon',
      },
    }),
    'utf-8',
  );
}

afterEach(() => {
  if (mockServer) {
    mockServer.stop(true);
    mockServer = undefined;
  }
  rmSync(testConfigDir, { recursive: true, force: true });
});

describe('schema suggest command', () => {
  it('supports intent mode with --for-command', async () => {
    mockServer = Bun.serve({
      port: 0,
      routes: {
        '/api-docs/openapi.json': new Response(
          JSON.stringify({
            info: { version: '10.11.6' },
            paths: {
              '/Users': {
                get: { tags: ['Users'], operationId: 'GetUsers', summary: 'List users' },
                post: { tags: ['Users'], operationId: 'CreateUser', summary: 'Create user' },
              },
              '/Users/{userId}': {
                get: { tags: ['Users'], operationId: 'GetUserById', summary: 'Get user' },
              },
            },
          }),
          { headers: { 'content-type': 'application/json' } },
        ),
      },
      fetch() {
        return new Response('Not Found', { status: 404 });
      },
    });
    writeTestConfig(`http://127.0.0.1:${mockServer.port}`);

    const result = await runCli([
      '--format',
      'json',
      'schema',
      'suggest',
      '--for-command',
      'users list',
      '--limit',
      '2',
    ]);
    expect(result.code).toBe(0);
    const parsed = JSON.parse(result.stdout) as {
      mode: string;
      command_intent: string;
      suggestions_total: number;
      suggestions: Array<{ path: string; suggested_command: string; score: number }>;
    };

    expect(parsed.mode).toBe('intent');
    expect(parsed.command_intent).toBe('users list');
    expect(parsed.suggestions_total).toBeGreaterThanOrEqual(1);
    expect(parsed.suggestions.length).toBeGreaterThanOrEqual(1);
    expect(parsed.suggestions[0]?.path).toContain('/Users');
    expect(parsed.suggestions[0]?.suggested_command).toContain('user');
    expect(parsed.suggestions[0]?.score).toBeGreaterThan(0);
  });

  it('supports coverage gap mode without --for-command', async () => {
    mockServer = Bun.serve({
      port: 0,
      routes: {
        '/api-docs/openapi.json': new Response(
          JSON.stringify({
            info: { version: '10.11.6' },
            paths: {
              '/System/Info/Public': {
                get: { tags: ['System'], operationId: 'GetPublicSystemInfo', summary: 'Public info' },
              },
              '/TotallyCustom/Foo': {
                get: { tags: ['Custom'], operationId: 'GetFoo', summary: 'Get foo' },
              },
            },
          }),
          { headers: { 'content-type': 'application/json' } },
        ),
      },
      fetch() {
        return new Response('Not Found', { status: 404 });
      },
    });
    writeTestConfig(`http://127.0.0.1:${mockServer.port}`);

    const result = await runCli(['--format', 'json', 'schema', 'suggest', '--limit', '5']);
    expect(result.code).toBe(0);
    const parsed = JSON.parse(result.stdout) as {
      mode: string;
      unmatched_operation_count: number;
      suggestions: Array<{ path: string; suggested_command: string }>;
    };

    expect(parsed.mode).toBe('coverage_gap');
    expect(parsed.unmatched_operation_count).toBeGreaterThanOrEqual(1);
    expect(parsed.suggestions.some((entry) => entry.path === '/TotallyCustom/Foo')).toBe(true);
    expect(
      parsed.suggestions.some((entry) => entry.suggested_command.length > 0),
    ).toBe(true);
  });

  it('returns an error for invalid --limit', async () => {
    const result = await runCli(['schema', 'suggest', '--limit', '0']);
    expect(result.code).toBe(1);
    expect(result.stderr).toContain('Limit must be a positive integer');
  });
});
