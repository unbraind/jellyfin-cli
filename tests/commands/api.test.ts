import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { decode } from '@toon-format/toon';
import YAML from 'yaml';
import { getSchema } from '../../src/commands/schema-defs.js';
import { validateJsonSchema } from '../../src/utils/schema-validate.js';
import { apiOperationDocument } from '../fixtures/api-operation.js';

const configDir = join(tmpdir(), `jellyfin-cli-api-test-${process.pid}`);
const cli = ['bun', 'run', 'src/cli.ts'];
let server: Bun.Server;
let mutationCount = 0;
let lastMutationBody = '';
let lastMutationContentType = '';

async function runCli(
  args: string[],
  env: Record<string, string> = {},
): Promise<{ code: number; stdout: string; stderr: string }> {
  const process = Bun.spawn([...cli, ...args], {
    env: {
      ...globalThis.process.env,
      JELLYFIN_CONFIG_DIR: configDir,
      JELLYFIN_SERVER_URL: '',
      JELLYFIN_API_KEY: '',
      JELLYFIN_USERNAME: '',
      JELLYFIN_PASSWORD: '',
      JELLYFIN_USER_ID: '',
      JELLYFIN_READ_ONLY: '',
      ...env,
    },
    stdout: 'pipe',
    stderr: 'pipe',
  });
  const [stdout, stderr, code] = await Promise.all([
    new Response(process.stdout).text(),
    new Response(process.stderr).text(),
    process.exited,
  ]);
  return { code, stdout, stderr };
}

beforeEach(() => {
  mutationCount = 0;
  lastMutationBody = '';
  lastMutationContentType = '';
  server = Bun.serve({
    port: 0,
    routes: {
      '/api-docs/openapi.json': Response.json(apiOperationDocument),
      '/Users/user-1': Response.json({ Id: 'user-1', Name: 'Test user' }),
      '/Binary': new Response(Uint8Array.from([0, 1, 2, 3]), {
        headers: { 'content-type': 'application/octet-stream' },
      }),
    },
    async fetch(request) {
      const url = new URL(request.url);
      if (url.pathname === '/Users') {
        return Response.json([{ Id: 'user-1', Name: 'Test user' }]);
      }
      if (url.pathname === '/Users/New' && request.method === 'POST') {
        mutationCount += 1;
        lastMutationBody = await request.text();
        lastMutationContentType = request.headers.get('content-type') ?? '';
        return new Response(null, { status: 204 });
      }
      if (
        request.method === 'POST' &&
        (url.pathname === '/Audio/item-1/Lyrics' ||
          url.pathname === '/Items/item-1/Images/Primary')
      ) {
        mutationCount += 1;
        lastMutationBody = await request.text();
        lastMutationContentType = request.headers.get('content-type') ?? '';
        return new Response(null, { status: 204 });
      }
      return new Response('Not Found', { status: 404 });
    },
  });
  mkdirSync(configDir, { recursive: true });
  writeFileSync(join(configDir, 'settings.json'), JSON.stringify({
    defaultServer: {
      serverUrl: `http://127.0.0.1:${server.port}`,
      apiKey: 'test-key',
      outputFormat: 'toon',
    },
  }));
});

afterEach(() => {
  server.stop(true);
  rmSync(configDir, { recursive: true, force: true });
});

describe('api command', () => {
  it('inspects exact operation contracts without executing requests', async () => {
    const result = await runCli(['--format', 'json', 'api', 'inspect', 'GetUserById']);
    expect(result.code).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({
      operation_id: 'GetUserById',
      method: 'GET',
      path_template: '/Users/{userId}',
      read_only_safe: true,
      request_body_allowed: false,
      parameters: [
        {
          name: 'userId',
          in: 'path',
          required: true,
            description: 'Operation-specific user identifier.',
          schema: { type: 'string', format: 'uuid' },
        },
        {
          name: 'includeDisabled',
          in: 'query',
          required: false,
          schema: { type: 'boolean', default: false },
        },
      ],
    });

    const toon = await runCli(['api', 'inspect', 'GetUserById']);
    expect(toon.code).toBe(0);
    expect(validateJsonSchema(
      decode(toon.stdout),
      getSchema('api_operation'),
    ).errors).toEqual([]);
  });

  it('describes required request bodies and confirmed mutation templates', async () => {
    const [result, yaml, raw, table, markdown] = await Promise.all([
      runCli(['--format', 'json', 'api', 'inspect', 'CreateUser']),
      runCli(['--format', 'yaml', 'api', 'inspect', 'CreateUser']),
      runCli(['--format', 'raw', 'api', 'inspect', 'CreateUser']),
      runCli(['--format', 'table', 'api', 'inspect', 'CreateUser']),
      runCli(['--format', 'markdown', 'api', 'inspect', 'CreateUser']),
    ]);
    expect(result.code).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({
      request_bodies: [{
        content_type: 'application/json',
        schema: {
          ref: '#/components/schemas/CreateUserByName',
          type: 'object',
          required: ['Name'],
          properties: { Name: { type: 'string', minLength: 1, example: 'New user' } },
        },
      }],
      invocation: {
        command: 'mutate',
        argv_template: ['jf', 'api', 'mutate', 'CreateUser', '--confirm', '--body-json', '<json>'],
        requires_confirmation: true,
      },
    });
    expect(() => YAML.parse(yaml.stdout)).not.toThrow();
    expect(() => JSON.parse(raw.stdout)).not.toThrow();
    expect(table.stdout).toContain('invocation: [Object]');
    expect(markdown.stdout).toContain('**invocation**');
  });

  it('executes validated read-only operations with structured output', async () => {
    const result = await runCli([
      '--format',
      'json',
      'api',
      'get',
      'GetUserById',
      '--path-param',
      'userId=user-1',
      '--query',
      'includeDisabled=true',
    ]);
    expect(result.code).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({
      operation_id: 'GetUserById',
      method: 'GET',
      status: 200,
      encoding: 'json',
      data: { Id: 'user-1', Name: 'Test user' },
    });

    const toon = await runCli([
      'api',
      'get',
      'GetUserById',
      '--path-param',
      'userId=user-1',
    ]);
    expect(toon.code).toBe(0);
    expect(validateJsonSchema(
      decode(toon.stdout),
      getSchema('api_operation_response'),
    ).errors).toEqual([]);
  });

  it('preserves binary response data as bounded base64', async () => {
    const result = await runCli([
      '--format',
      'json',
      'api',
      'get',
      'GetBinary',
      '--max-bytes',
      '4',
    ]);
    expect(result.code).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({
      encoding: 'base64',
      data: 'AAECAw==',
    });
  });

  it('emits valid structured and human-readable formats', async () => {
    const args = ['api', 'get', 'GetUserById', '--path-param', 'userId=user-1'];
    const [json, yaml, raw, table, markdown] = await Promise.all([
      runCli(['--format', 'json', ...args]),
      runCli(['--format', 'yaml', ...args]),
      runCli(['--format', 'raw', ...args]),
      runCli(['--format', 'table', ...args]),
      runCli(['--format', 'markdown', ...args]),
    ]);

    expect(() => JSON.parse(json.stdout)).not.toThrow();
    expect(() => YAML.parse(yaml.stdout)).not.toThrow();
    expect(() => JSON.parse(raw.stdout)).not.toThrow();
    expect(table.stdout).toContain('operation_id: GetUserById');
    expect(markdown.stdout).toContain('**operation_id**: GetUserById');
  }, 15_000);

  it('rejects unsafe method routing, invalid bodies, and response overflow', async () => {
    const unsafe = await runCli(['api', 'get', 'CreateUser']);
    expect(unsafe.code).toBe(1);
    expect(unsafe.stderr).toContain('expected GET, HEAD, or OPTIONS');

    const invalidBody = await runCli([
      'api',
      'mutate',
      'CreateUser',
      '--confirm',
      '--body-json',
      '{',
    ]);
    expect(invalidBody.code).toBe(1);
    expect(invalidBody.stderr).toContain('valid JSON');

    const overflow = await runCli([
      'api',
      'get',
      'GetBinary',
      '--max-bytes',
      '3',
    ]);
    expect(overflow.code).toBe(1);
    expect(overflow.stderr).toContain('exceeds --max-bytes');
  });

  it('requires confirmation and honors global read-only mode for mutations', async () => {
    const missingConfirmation = await runCli(['api', 'mutate', 'CreateUser']);
    expect(missingConfirmation.code).toBe(1);
    expect(mutationCount).toBe(0);

    const blocked = await runCli([
      '--read-only',
      'api',
      'mutate',
      'CreateUser',
      '--confirm',
      '--body-json',
      '{"Name":"New user"}',
    ]);
    expect(blocked.code).toBe(1);
    expect(blocked.stderr).toContain('blocked by read-only mode');
    expect(mutationCount).toBe(0);
  });

  it('executes confirmed mutations against an isolated test server only', async () => {
    const result = await runCli([
      '--format',
      'json',
      'api',
      'mutate',
      'CreateUser',
      '--confirm',
      '--body-json',
      '{"Name":"New user"}',
    ]);
    expect(result.code).toBe(0);
    expect(mutationCount).toBe(1);
    expect(lastMutationBody).toBe('{"Name":"New user"}');
    expect(lastMutationContentType).toBe('application/json');
    expect(JSON.parse(result.stdout)).toMatchObject({
      operation_id: 'CreateUser',
      method: 'POST',
      status: 204,
      encoding: 'empty',
      data: null,
    });
  });

  it('supports only OpenAPI-declared text and binary request bodies', async () => {
    const textResult = await runCli([
      'api',
      'mutate',
      'UploadLyrics',
      '--confirm',
      '--path-param',
      'itemId=item-1',
      '--body-text',
      'lyrics',
    ]);
    expect(textResult.code).toBe(0);
    expect(lastMutationBody).toBe('lyrics');
    expect(lastMutationContentType).toBe('text/plain');

    const imagePath = join(configDir, 'image.bin');
    writeFileSync(imagePath, Uint8Array.from([0, 1, 2]));
    const imageResult = await runCli([
      'api',
      'mutate',
      'SetItemImage',
      '--confirm',
      '--path-param',
      'itemId=item-1',
      'imageType=Primary',
      '--body-file',
      imagePath,
      '--content-type',
      'image/png',
    ]);
    expect(imageResult.code).toBe(0);
    expect(lastMutationContentType).toBe('image/png');

    const rejected = await runCli([
      'api',
      'mutate',
      'UploadLyrics',
      '--confirm',
      '--path-param',
      'itemId=item-1',
      '--body-json',
      '{}',
    ]);
    expect(rejected.code).toBe(1);
    expect(rejected.stderr).toContain('not declared');
  });
});
