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
              '/Users': {
                get: { tags: ['Users'], operationId: 'GetUsers', summary: 'List users' },
                post: { tags: ['Users'], operationId: 'CreateUser', summary: 'Create user' },
              },
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

    const result = await runCli(['schema', 'openapi', '--include-paths', '--limit', '2']);
    expect(result.code).toBe(0);
    expect(result.stdout).toContain('type: openapi_summary');
    expect(result.stdout).toContain('path_count: 2');
    expect(result.stdout).toContain('operation_count: 3');
    expect(result.stdout).toContain('operations:');
    expect(result.stdout).toContain('read_only_safe: true');
  });

  it('supports operation filtering and command-intent inference', async () => {
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

    const result = await runCli([
      'schema',
      'openapi',
      '--include-paths',
      '--method',
      'GET',
      '--tag',
      'Users',
      '--for-command',
      'users list',
      '--limit',
      '5',
    ]);
    expect(result.code).toBe(0);
    expect(result.stdout).toContain('filtered_operation_count: 1');
    expect(result.stdout).toContain('command_intent: users list');
    expect(result.stdout).toContain('command_matches:');
    expect(result.stdout).toContain('matched_on:');
  });

  it('supports read-only-only operation filtering', async () => {
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

    const result = await runCli([
      'schema',
      'openapi',
      '--include-paths',
      '--read-only-ops',
      '--limit',
      '10',
    ]);
    expect(result.code).toBe(0);
    expect(result.stdout).toContain('read_only_ops: true');
    expect(result.stdout).toContain('filtered_operation_count: 2');
    expect(result.stdout).not.toContain('method: POST');
  });

  it('applies operation filters to --for-command matches', async () => {
    mockServer = Bun.serve({
      port: 0,
      routes: {
        '/api-docs/openapi.json': new Response(
          JSON.stringify({
            info: { version: '10.11.6' },
            paths: {
              '/Library/Media/Updated': {
                post: { tags: ['Library'], operationId: 'PostUpdatedMedia', summary: 'Post external media update' },
              },
              '/Items/{itemId}/ExternalIdInfos': {
                get: { tags: ['ItemLookup'], operationId: 'GetExternalIdInfos', summary: 'Get external IDs' },
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
      'schema',
      'openapi',
      '--for-command',
      'media external-id-infos',
      '--read-only-ops',
      '--limit',
      '5',
    ]);
    expect(result.code).toBe(0);
    expect(result.stdout).toContain('command_matches:');
    expect(result.stdout).toContain('/Items/{itemId}/ExternalIdInfos');
    expect(result.stdout).not.toContain('/Library/Media/Updated');
  });

  it('returns error for invalid --limit', async () => {
    const result = await runCli(['schema', 'openapi', '--limit', '0']);
    expect(result.code).toBe(1);
    expect(result.stderr).toContain('Limit must be a positive integer');
  });

  it('honors global --format for schema subcommands', async () => {
    const result = await runCli(['--format', 'json', 'schema', 'tools', '--limit', '1']);
    expect(result.code).toBe(0);
    expect(() => JSON.parse(result.stdout)).not.toThrow();
    expect(result.stdout).toContain('"tool_count"');
  });
});

describe('schema coverage command', () => {
  it('returns coverage summary with unmatched operation sample', async () => {
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
              },
              '/Custom/Unmapped': {
                get: { tags: ['Custom'], operationId: 'GetCustomThing', summary: 'Unmapped operation' },
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
      'schema',
      'coverage',
      '--method',
      'GET',
      '--command-prefix',
      'system',
      '--limit',
      '5',
      '--min-score',
      '2',
    ]);
    expect(result.code).toBe(0);
    expect(result.stdout).toContain('type: openapi_coverage');
    expect(result.stdout).toContain('operation_scope_count: 3');
    expect(result.stdout).toContain('mapped_operation_count: 1');
    expect(result.stdout).toContain('unmapped_operation_count: 2');
    expect(result.stdout).toContain('unmatched_operations:');
    expect(result.stdout).toContain('unmatched_tools_total: 0');
    expect(result.stdout).toContain('unmapped_tool_count: 0');
    expect(result.stdout).toContain('local_only_tools_total: 0');
    expect(result.stdout).toContain('unmatched_by_tag:');
    expect(result.stdout).toContain('summary:');
    expect(result.stdout).toContain('coverage_percent:');
    expect(result.stdout).toContain('tag: Custom');
    expect(result.stdout).toContain('/Custom/Unmapped');
  });

  it('reports unmatched tools when command intents have no matching operations', async () => {
    mockServer = Bun.serve({
      port: 0,
      routes: {
        '/api-docs/openapi.json': new Response(
          JSON.stringify({
            info: { version: '10.11.6' },
            paths: {
              '/Custom/Unmapped': {
                get: { tags: ['Custom'], operationId: 'GetCustomThing', summary: 'Unmapped operation' },
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
      'schema',
      'coverage',
      '--command-prefix',
      'users',
      '--min-score',
      '10',
      '--limit',
      '5',
    ]);
    expect(result.code).toBe(0);
    expect(result.stdout).toContain('unmatched_tools:');
    expect(result.stdout).toContain('reason: no_openapi_match_above_min_score');
    expect(result.stdout).toContain('unmapped_tool_count:');
    expect(result.stdout).toContain('local_only_tools_total: 0');
  });

  it('classifies local-only utility commands separately from unmatched API tools', async () => {
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

    const result = await runCli(['schema', 'coverage', '--command-prefix', 'config', '--limit', '5']);
    expect(result.code).toBe(0);
    expect(result.stdout).toContain('unmatched_tools_total: 0');
    expect(result.stdout).toContain('local_only_tools_total:');
    expect(result.stdout).toContain('reason: local_only_command');
  });

  it('returns error for invalid --min-score', async () => {
    const result = await runCli(['schema', 'coverage', '--min-score', '0']);
    expect(result.code).toBe(1);
    expect(result.stderr).toContain('Min score must be a positive integer');
  });

  it('includes command suggestions for unmatched operations when requested', async () => {
    mockServer = Bun.serve({
      port: 0,
      routes: {
        '/api-docs/openapi.json': new Response(
          JSON.stringify({
            info: { version: '10.11.6' },
            paths: {
              '/Custom/Unmapped': {
                get: { tags: ['Custom'], operationId: 'GetCustomThing', summary: 'Get custom thing' },
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

    const result = await runCli(['schema', 'coverage', '--suggest-commands', '--limit', '5']);
    expect(result.code).toBe(0);
    expect(result.stdout).toContain('suggested_commands:');
    expect(result.stdout).toContain('suggested_command: custom list');
    expect(result.stdout).toContain('intent: list');
  });

  it('maps multiple operations to one command intent when all matches meet the score threshold', async () => {
    mockServer = Bun.serve({
      port: 0,
      routes: {
        '/api-docs/openapi.json': new Response(
          JSON.stringify({
            info: { version: '10.11.6' },
            paths: {
              '/Audio/{itemId}/stream': {
                get: { tags: ['Audio'], operationId: 'GetAudioStream', summary: 'Get audio stream' },
              },
              '/Audio/{itemId}/universal': {
                get: { tags: ['UniversalAudio'], operationId: 'GetUniversalAudioStream', summary: 'Universal audio stream' },
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
      'schema',
      'coverage',
      '--method',
      'GET',
      '--command-prefix',
      'media audio-stream-url',
      '--min-score',
      '3',
      '--limit',
      '5',
    ]);
    expect(result.code).toBe(0);
    expect(result.stdout).toContain('operation_scope_count: 2');
    expect(result.stdout).toContain('mapped_tool_count: 1');
    expect(result.stdout).toContain('mapped_operation_count: 2');
    expect(result.stdout).toContain('unmapped_operation_count: 0');
    expect(result.stdout).toContain('unmapped_tool_count:');
    expect(result.stdout).toContain('coverage_percent: 100');
  });

  it('supports a custom OpenAPI endpoint path override', async () => {
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

    const result = await runCli([
      'schema',
      'coverage',
      '--endpoint',
      '/custom/openapi.json',
      '--limit',
      '5',
    ]);
    expect(result.code).toBe(0);
    expect(result.stdout).toContain('source_path: /custom/openapi.json');
    expect(result.stdout).toContain('operation_scope_count: 1');
  });

  it('supports coverage requirement checks and exits with code 1 when unmet', async () => {
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
              '/Custom/Unmapped': {
                get: { tags: ['Custom'], operationId: 'GetCustomThing', summary: 'Unmapped operation' },
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
      'coverage',
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
      coverage_percent: number;
    };
    expect(parsed.required_coverage_percent).toBe(100);
    expect(parsed.coverage_requirement_met).toBe(false);
    expect(parsed.coverage_percent).toBeLessThan(100);
    expect(result.stderr).toContain('below required threshold');
  });

  it('returns error for invalid --require-coverage', async () => {
    const result = await runCli(['schema', 'coverage', '--require-coverage', '101']);
    expect(result.code).toBe(1);
    expect(result.stderr).toContain('Coverage requirement must be a number between 0 and 100');
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

  it('marks mutating commands as not read-only-safe', async () => {
    const result = await runCli(['schema', 'tools', '--command', 'backup restore', '--limit', '5']);
    expect(result.code).toBe(0);
    expect(result.stdout).toContain('command: jf backup restore');
    expect(result.stdout).toContain('read_only_safe: false');
  });

  it('returns error for invalid --limit', async () => {
    const result = await runCli(['schema', 'tools', '--limit', '0']);
    expect(result.code).toBe(1);
    expect(result.stderr).toContain('Limit must be a positive integer');
  });

  it('supports OpenAPI match enrichment for tool schemas', async () => {
    mockServer = Bun.serve({
      port: 0,
      routes: {
        '/api-docs/openapi.json': new Response(
          JSON.stringify({
            info: { version: '10.11.6' },
            paths: {
              '/System/Info': {
                get: { tags: ['System'], operationId: 'GetSystemInfo', summary: 'Get system info' },
              },
              '/System/Ping': {
                get: { tags: ['System'], operationId: 'GetPingSystem', summary: 'Ping' },
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
      'schema',
      'tools',
      '--command',
      'system info',
      '--limit',
      '1',
      '--openapi-match',
      '--openapi-match-limit',
      '2',
      '--min-score',
      '3',
    ]);
    expect(result.code).toBe(0);
    expect(result.stdout).toContain('type: tool_schemas');
    expect(result.stdout).toContain('openapi_matching:');
    expect(result.stdout).toContain('enabled: true');
    expect(result.stdout).toContain('openapi_matches:');
    expect(result.stdout).toContain('method: GET');
    expect(result.stdout).toContain('path: /System/Info');
  });

  it('returns error for --openapi-match when no server is configured', async () => {
    const result = await runCli(['schema', 'tools', '--openapi-match']);
    expect(result.code).toBe(1);
    expect(result.stderr).toContain('No server URL configured');
  });
});

describe('schema validate command', () => {
  it('validates payload by explicit type and returns success', async () => {
    const payload = JSON.stringify({
      type: 'user',
      data: { id: 'u1', name: 'steve' },
      meta: {
        timestamp: '2026-03-03T00:00:00.000Z',
        format: 'toon',
        version: '1.0.0',
      },
    });

    const result = await runCli(['schema', 'validate', 'user', '--from', 'json', '--input', payload]);
    expect(result.code).toBe(0);
    expect(result.stdout).toContain('type: schema_validation');
    expect(result.stdout).toContain('valid: true');
    expect(result.stdout).toContain('expected_type: user');
  });

  it('accepts payloads without meta envelope', async () => {
    const payload = JSON.stringify({
      type: 'items',
      data: [{ id: 'i1', name: 'Movie', type: 'Movie' }],
    });

    const result = await runCli(['schema', 'validate', 'items', '--from', 'json', '--input', payload]);
    expect(result.code).toBe(0);
    expect(result.stdout).toContain('valid: true');
  });

  it('auto-detects payload type when type argument is omitted', async () => {
    const payload = [
      'type: sessions',
      'data:',
      ' - id: s1',
      'meta:',
      ' timestamp: 2026-03-03T00:00:00.000Z',
      ' format: toon',
      ' version: 1.0.0',
    ].join('\n');

    const result = await runCli(['schema', 'validate', '--from', 'toon', '--input', payload]);
    expect(result.code).toBe(0);
    expect(result.stdout).toContain('valid: true');
    expect(result.stdout).toContain('detected_type: sessions');
  });

  it('returns validation errors for invalid payload', async () => {
    const payload = JSON.stringify({
      type: 'user',
      data: { id: 'u1' },
      meta: {
        timestamp: 'not-a-date',
        format: 'toon',
        version: '1.0.0',
      },
    });

    const result = await runCli(['schema', 'validate', 'user', '--from', 'json', '--input', payload]);
    expect(result.code).toBe(1);
    expect(result.stderr).toContain('type: schema_validation');
    expect(result.stderr).toContain('valid: false');
    expect(result.stderr).toContain('$.data.name: is required');
    expect(result.stderr).toContain('$.meta.timestamp: must be a valid date-time string');
  });

  it('returns error when no stdin or --input data is provided', async () => {
    const result = await runCli(['schema', 'validate', 'user']);
    expect(result.code).toBe(1);
    expect(result.stderr).toContain('Validation input is empty');
  });
});
