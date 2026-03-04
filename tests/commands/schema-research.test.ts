import { afterEach, describe, expect, it } from 'vitest';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const testConfigDir = join(tmpdir(), `jellyfin-cli-schema-research-test-${Date.now()}`);
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

afterEach(() => {
  if (mockServer) {
    mockServer.stop(true);
    mockServer = undefined;
  }
  rmSync(testConfigDir, { recursive: true, force: true });
});

describe('schema research command', () => {
  it('returns full and read-only coverage snapshots', async () => {
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
              '/Users': {
                get: { tags: ['Users'], operationId: 'GetUsers', summary: 'List users' },
                post: { tags: ['Users'], operationId: 'CreateUser', summary: 'Create user' },
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

    const result = await runCli(['schema', 'research', '--include-unmatched', '--limit', '5']);
    expect(result.code).toBe(0);
    expect(result.stdout).toContain('type: openapi_research');
    expect(result.stdout).toContain('operation_count: 3');
    expect(result.stdout).toContain('full_scope:');
    expect(result.stdout).toContain('read_only_scope:');
    expect(result.stdout).toContain('operation_scope_count: 3');
    expect(result.stdout).toContain('operation_scope_count: 2');
    expect(result.stdout).toContain('unmatched_tools_total:');
    expect(result.stdout).toContain('local_only_tools_total:');
    expect(result.stdout).toContain('unmatched_tools:');
    expect(result.stdout).toContain('local_only_tools:');
    expect(result.stdout).toContain('include_unmatched: true');
  });

  it('supports custom endpoint and global json format', async () => {
    mockServer = Bun.serve({
      port: 0,
      routes: {
        '/custom/openapi.json': new Response(
          JSON.stringify({
            info: { version: '10.11.6' },
            paths: {
              '/System/Info/Public': {
                get: { tags: ['System'], operationId: 'GetPublicSystemInfo', summary: 'Public info' },
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

    const result = await runCli(['--format', 'json', 'schema', 'research', '--endpoint', '/custom/openapi.json']);
    expect(result.code).toBe(0);
    const parsed = JSON.parse(result.stdout) as {
      source_path: string;
      full_scope: {
        operation_scope_count: number;
        unmatched_tools_total: number;
        local_only_tools_total: number;
      };
      read_only_scope: {
        operation_scope_count: number;
        unmatched_tools_total: number;
        local_only_tools_total: number;
      };
    };

    expect(parsed.source_path).toBe('/custom/openapi.json');
    expect(parsed.full_scope.operation_scope_count).toBe(1);
    expect(parsed.read_only_scope.operation_scope_count).toBe(1);
    expect(parsed.full_scope.unmatched_tools_total).toBeGreaterThanOrEqual(0);
    expect(parsed.read_only_scope.unmatched_tools_total).toBeGreaterThanOrEqual(0);
    expect(parsed.full_scope.local_only_tools_total).toBeGreaterThanOrEqual(0);
    expect(parsed.read_only_scope.local_only_tools_total).toBeGreaterThanOrEqual(0);
  });

  it('supports coverage requirement checks and fails when unmet', async () => {
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
              '/Users': {
                post: { tags: ['Users'], operationId: 'CreateUser', summary: 'Create user' },
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

    const result = await runCli([
      '--format',
      'json',
      'schema',
      'research',
      '--command-prefix',
      'system',
      '--require-coverage',
      '100',
      '--limit',
      '5',
    ]);
    expect(result.code).toBe(1);

    const parsed = JSON.parse(result.stdout) as {
      required_coverage_percent: number;
      coverage_requirement_met: boolean;
      full_scope: { coverage_percent: number };
      read_only_scope: { coverage_percent: number };
    };

    expect(parsed.required_coverage_percent).toBe(100);
    expect(parsed.coverage_requirement_met).toBe(false);
    expect(parsed.full_scope.coverage_percent).toBeLessThan(100);
    expect(parsed.read_only_scope.coverage_percent).toBeGreaterThanOrEqual(0);
    expect(result.stderr).toContain('Coverage requirement not met');
  });

  it('supports saving the research snapshot to a JSON file', async () => {
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

    const savePath = join(testConfigDir, 'reports', 'schema-research.json');
    const result = await runCli(['--format', 'json', 'schema', 'research', '--save', savePath]);
    expect(result.code).toBe(0);

    const parsed = JSON.parse(result.stdout) as {
      saved_to: string | null;
      source_path: string;
      operation_count: number;
    };
    expect(parsed.saved_to).toBe(savePath);
    expect(existsSync(savePath)).toBe(true);

    const savedPayload = JSON.parse(readFileSync(savePath, 'utf-8')) as {
      source_path: string;
      operation_count: number;
      saved_to: string | null;
    };
    expect(savedPayload.source_path).toBe('/api-docs/openapi.json');
    expect(savedPayload.operation_count).toBe(1);
    expect(savedPayload.saved_to).toBeNull();
  });
});
