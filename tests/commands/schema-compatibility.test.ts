import { afterEach, describe, expect, it } from 'vitest';
import { decode } from '@toon-format/toon';
import { parse as parseYaml } from 'yaml';
import { chmodSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { getSchema } from '../../src/commands/schema-defs.js';
import { validateJsonSchema } from '../../src/utils/schema-validate.js';
import { runCliInProcess } from '../utils/run-cli-in-process.js';

const testConfigDir = join(tmpdir(), `jellyfin-cli-schema-compatibility-${Date.now()}`);
let mockServer: Bun.Server | undefined;

async function runCli(args: string[]): Promise<{ code: number; stdout: string; stderr: string }> {
  return runCliInProcess(args, {
    JELLYFIN_CONFIG_DIR: testConfigDir,
    JELLYFIN_SERVER_URL: '',
    JELLYFIN_API_KEY: '',
    JELLYFIN_USERNAME: '',
    JELLYFIN_PASSWORD: '',
    JELLYFIN_USER_ID: '',
    JELLYFIN_READ_ONLY: '1',
  });
}

function writeFixture(
  artifactVersion: string,
  apiVersion: string,
  targetPaths: Record<string, unknown>,
): void {
  mkdirSync(join(testConfigDir, 'cache', 'openapi'), { recursive: true, mode: 0o700 });
  writeFileSync(
    join(testConfigDir, 'cache', 'openapi', `jellyfin-openapi-${artifactVersion}.json`),
    JSON.stringify({
      info: { title: 'Jellyfin API', version: apiVersion },
      paths: targetPaths,
      components: { schemas: { PublicSystemInfo: { type: 'object' } } },
    }),
    { encoding: 'utf-8', mode: 0o600 },
  );
  chmodSync(join(testConfigDir, 'cache', 'openapi', `jellyfin-openapi-${artifactVersion}.json`), 0o600);
}

function configureServer(): void {
  mockServer = Bun.serve({
    port: 0,
    routes: {
      '/api-docs/openapi.json': new Response(JSON.stringify({
        info: { title: 'Jellyfin API', version: '10.11.11' },
        paths: {
          '/System/Info/Public': {
            get: { operationId: 'GetPublicSystemInfo', responses: { 200: {} } },
          },
          '/LiveOnly': {
            get: { operationId: 'GetLiveOnly', responses: { 200: {} } },
          },
        },
        components: { schemas: { PublicSystemInfo: { type: 'object' } } },
      }), { headers: { 'content-type': 'application/json' } }),
    },
    fetch() {
      return new Response('Not Found', { status: 404 });
    },
  });
  mkdirSync(testConfigDir, { recursive: true, mode: 0o700 });
  writeFileSync(join(testConfigDir, 'settings.json'), JSON.stringify({
    defaultServer: {
      serverUrl: `http://127.0.0.1:${mockServer.port}`,
      apiKey: 'test-api-key',
      outputFormat: 'toon',
    },
  }), { encoding: 'utf-8', mode: 0o600 });
}

afterEach(() => {
  mockServer?.stop(true);
  mockServer = undefined;
  rmSync(testConfigDir, { recursive: true, force: true });
});

describe('schema compatibility command', () => {
  it('emits schema-valid TOON and fails only when requested', async () => {
    configureServer();
    writeFixture('10.11.11', '10.11.11', {
      '/System/Info/Public': {
        get: { operationId: 'GetPublicSystemInfo', responses: { 200: {} } },
      },
    });

    const defaultReport = await runCli(['schema', 'compatibility']);
    expect(defaultReport.code).toBe(0);
    expect(decode(defaultReport.stdout)).toMatchObject({
      data: {
        compatible: true,
        baseline: { source_kind: 'official', artifact_version: '10.11.11' },
      },
    });

    const report = await runCli(['schema', 'compatibility', '--baseline', 'live', '--limit', '1']);
    expect(report.code).toBe(0);
    const decoded = decode(report.stdout);
    expect(validateJsonSchema(decoded, getSchema('openapi_compatibility'))).toMatchObject({
      valid: true,
      errors: [],
    });
    expect(decoded).toMatchObject({
      type: 'openapi_compatibility',
      data: {
        compatible: false,
        summary: { breaking: 1, total: 1 },
        changes_truncated: false,
      },
    });

    const gated = await runCli([
      'schema',
      'diff',
      '--baseline',
      'live',
      '--fail-on-breaking',
      '--format',
      'json',
    ]);
    expect(gated.code).toBe(1);
    expect(JSON.parse(gated.stdout)).toMatchObject({
      compatible: false,
      summary: { breaking: 1 },
    });
    expect(validateJsonSchema(
      { type: 'openapi_compatibility', data: JSON.parse(gated.stdout) },
      getSchema('openapi_compatibility'),
    )).toMatchObject({ valid: true, errors: [] });
  }, 15_000);

  it('requires explicit prerelease opt-in and keeps target identity separate', async () => {
    configureServer();
    writeFixture('10.11.11', '10.11.11', {
      '/System/Info/Public': {
        get: { operationId: 'GetPublicSystemInfo', responses: { 200: {} } },
      },
    });
    writeFixture('12.0-rc3', '12.0.0', {
      '/System/Info/Public': {
        get: { operationId: 'GetPublicSystemInfo', responses: { 200: {} } },
      },
    });

    const refused = await runCli(['schema', 'compatibility', '--target-version', '12.0-rc3']);
    expect(refused.code).toBe(1);
    expect(refused.stderr).toContain('Prerelease OpenAPI artifacts require --allow-prerelease');

    const allowed = await runCli([
      'schema',
      'compatibility',
      '--target-version',
      '12.0-rc3',
      '--allow-prerelease',
      '--format',
      'json',
    ]);
    expect(allowed.code).toBe(0);
    expect(JSON.parse(allowed.stdout)).toMatchObject({
      target: {
        artifact_version: '12.0-rc3',
        api_version: '12.0.0',
        prerelease: true,
      },
    });
  }, 15_000);

  it('rejects unsafe artifact identifiers before network access', async () => {
    configureServer();
    const result = await runCli([
      'schema',
      'compatibility',
      '--target-version',
      '../private',
      '--allow-prerelease',
    ]);
    expect(result.code).toBe(1);
    expect(result.stderr).toContain('Invalid official OpenAPI artifact version');
  }, 15_000);

  it('rejects unknown baseline modes', async () => {
    configureServer();
    const result = await runCli(['schema', 'compatibility', '--baseline', 'guess']);
    expect(result.code).toBe(1);
    expect(result.stderr).toContain('Baseline must be official or live');
  }, 15_000);

  it('preserves the compatibility payload across every supported formatter', async () => {
    configureServer();
    writeFixture('10.11.11', '10.11.11', {
      '/System/Info/Public': {
        get: { operationId: 'GetPublicSystemInfo', responses: { 200: {} } },
      },
    });

    const [yaml, raw, markdown, table] = await Promise.all([
      runCli(['schema', 'compatibility', '--format', 'yaml']),
      runCli(['schema', 'compatibility', '--format', 'raw']),
      runCli(['schema', 'compatibility', '--format', 'markdown']),
      runCli(['schema', 'compatibility', '--format', 'table']),
    ]);
    expect(yaml.code).toBe(0);
    expect(parseYaml(yaml.stdout)).toMatchObject({ compatible: true });

    expect(raw.code).toBe(0);
    expect(JSON.parse(raw.stdout)).toMatchObject({ compatible: true });

    expect(markdown.code).toBe(0);
    expect(markdown.stdout).toContain('**compatible**');
    expect(markdown.stdout).toContain('**summary**');

    expect(table.code).toBe(0);
    expect(table.stdout).toContain('compatible: Yes');
    expect(table.stdout).toContain('summary: [Object]');
  }, 15_000);

  it('exports a complete read-only agent tool contract', async () => {
    const result = await runCli([
      'schema',
      'tools',
      '--command',
      'schema compatibility',
      '--format',
      'json',
    ]);
    expect(result.code).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({
      tool_count: 1,
      tools: [{
        command: 'jf schema compatibility',
        read_only_safe: true,
        input_schema: {
          properties: {
            baseline: { type: 'string' },
            targetVersion: { type: 'string' },
            allowPrerelease: { type: 'boolean' },
            failOnBreaking: { type: 'boolean' },
          },
        },
      }],
    });
  }, 15_000);
});
