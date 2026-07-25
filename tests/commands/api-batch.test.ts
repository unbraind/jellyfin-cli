import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { decode } from '@toon-format/toon';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import YAML from 'yaml';
import { getSchema } from '../../src/commands/schema-defs.js';
import { validateJsonSchema } from '../../src/utils/schema-validate.js';
import { apiOperationDocument } from '../fixtures/api-operation.js';

const configDir = join(tmpdir(), `jellyfin-cli-api-batch-${process.pid}`);
const manifestPath = join(configDir, 'batch.json');
const cli = ['bun', 'run', 'src/cli.ts'];
let server: Bun.Server;
let operationRequests = 0;

async function runCli(
  args: string[],
  stdin?: string,
): Promise<{ code: number; stdout: string; stderr: string }> {
  const child = Bun.spawn([...cli, ...args], {
    env: {
      ...process.env,
      JELLYFIN_CONFIG_DIR: configDir,
      JELLYFIN_SERVER_URL: '',
      JELLYFIN_API_KEY: '',
      JELLYFIN_READ_ONLY: '1',
    },
    stdin: stdin === undefined ? undefined : new Blob([stdin]),
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

beforeEach(() => {
  operationRequests = 0;
  server = Bun.serve({
    port: 0,
    routes: {
      '/api-docs/openapi.json': Response.json(apiOperationDocument),
      '/Users/user-1': Response.json({ Id: 'user-1', Name: 'Test user' }),
      '/Binary': () => {
        operationRequests += 1;
        return new Response(Uint8Array.from([0, 1, 2, 3]), {
          headers: { 'content-type': 'application/octet-stream' },
        });
      },
    },
  });
  mkdirSync(configDir, { recursive: true });
  writeFileSync(join(configDir, 'settings.json'), JSON.stringify({
    defaultServer: {
      serverUrl: `http://127.0.0.1:${server.port}`,
      apiKey: 'synthetic-key',
      outputFormat: 'toon',
    },
  }));
  writeFileSync(manifestPath, JSON.stringify({
    version: 1,
    requests: [
      { id: 'user', operation_id: 'GetUserById', path_params: { userId: 'user-1' } },
      { id: 'binary', operation_id: 'GetBinary' },
    ],
  }));
});

afterEach(() => {
  server.stop(true);
  rmSync(configDir, { recursive: true, force: true });
});

describe('api batch command', () => {
  it('preflights every request without executing operations', async () => {
    const result = await runCli([
      'api',
      'batch',
      '--file',
      manifestPath,
      '--dry-run',
    ]);
    expect(result.code).toBe(0);
    expect(operationRequests).toBe(0);
    const envelope = decode(result.stdout);
    expect(validateJsonSchema(envelope, getSchema('api_batch_plan')).errors).toEqual([]);
    expect(envelope).toMatchObject({
      type: 'api_batch_plan',
      data: {
        dry_run: true,
        request_count: 2,
        requests: [
          { id: 'user', operation_id: 'GetUserById', method: 'GET' },
          { id: 'binary', operation_id: 'GetBinary', method: 'GET' },
        ],
      },
    });
  });

  it('executes in order and emits a schema-valid TOON envelope', async () => {
    const result = await runCli(['api', 'batch', '--file', manifestPath]);
    expect(result.code).toBe(0);
    expect(operationRequests).toBe(1);
    const envelope = decode(result.stdout);
    expect(validateJsonSchema(envelope, getSchema('api_batch_response')).errors).toEqual([]);
    expect(envelope).toMatchObject({
      type: 'api_batch_response',
      data: {
        request_count: 2,
        success_count: 2,
        failure_count: 0,
        results: [
          { id: 'user', ok: true, encoding: 'json' },
          { id: 'binary', ok: true, encoding: 'base64', response_bytes: 4 },
        ],
      },
    });
  });

  it('supports stdin and all documented output formats', async () => {
    const manifest = JSON.stringify({
      version: 1,
      requests: [{ id: 'binary', operation_id: 'GetBinary' }],
    });
    const json = await runCli(['--format', 'json', 'api', 'batch', '--stdin'], manifest);
    const yaml = await runCli(['--format', 'yaml', 'api', 'batch', '--stdin'], manifest);
    const raw = await runCli(['--format', 'raw', 'api', 'batch', '--stdin'], manifest);
    const table = await runCli(['--format', 'table', 'api', 'batch', '--stdin'], manifest);
    const markdown = await runCli(
      ['--format', 'markdown', 'api', 'batch', '--stdin'],
      manifest,
    );
    expect(() => JSON.parse(json.stdout)).not.toThrow();
    expect(() => YAML.parse(yaml.stdout)).not.toThrow();
    expect(() => JSON.parse(raw.stdout)).not.toThrow();
    expect(table.stdout).toContain('request_count: 1');
    expect(markdown.stdout).toContain('**request_count**: 1');
  }, 30_000);

  it('returns ordered structured failures and a nonzero exit code', async () => {
    const result = await runCli([
      '--format',
      'json',
      'api',
      'batch',
      '--file',
      manifestPath,
      '--max-total-bytes',
      '35',
    ]);
    expect(result.code).toBe(1);
    expect(JSON.parse(result.stdout)).toMatchObject({
      request_count: 2,
      success_count: 1,
      failure_count: 1,
      results: [
        { id: 'user', ok: true },
        { id: 'binary', ok: false, status: 200 },
      ],
    });
  });

  it('rejects mutations and ambiguous input before operation execution', async () => {
    writeFileSync(manifestPath, JSON.stringify({
      version: 1,
      requests: [{ id: 'mutation', operation_id: 'CreateUser' }],
    }));
    const mutation = await runCli(['api', 'batch', '--file', manifestPath]);
    expect(mutation.code).toBe(1);
    expect(mutation.stderr).toContain('only GET, HEAD, and OPTIONS are allowed');
    expect(operationRequests).toBe(0);

    const ambiguous = await runCli([
      'api',
      'batch',
      '--file',
      manifestPath,
      '--stdin',
    ], '{}');
    expect(ambiguous.code).toBe(1);
    expect(ambiguous.stderr).toContain('exactly one of --file or --stdin');
  });
});
