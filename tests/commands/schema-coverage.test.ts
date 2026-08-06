import { describe, expect, it } from 'vitest';
import { mapOpenApiCoverageToTools } from '../../src/commands/schema-coverage.js';
import type { OpenApiOperationEntry } from '../../src/utils/openapi.js';
import type { CliToolSchema } from '../../src/utils/tool-schema.js';

const SYSTEM_INFO_OPERATION: OpenApiOperationEntry = {
  method: 'GET',
  path: '/System/Info',
  operationId: 'GetSystemInfo',
  summary: 'Gets information about the server',
  tags: ['System'],
  deprecated: false,
  readOnlySafe: true,
};

function tool(command: string, readOnlySafe = true): CliToolSchema {
  return {
    name: command.replaceAll(' ', '_'),
    command,
    description: command,
    read_only_safe: readOnlySafe,
    input_schema: { type: 'object', properties: {}, additionalProperties: false },
    args: [],
    options: [],
  };
}

describe('OpenAPI coverage tool classification', () => {
  it('separates direct mappings, local commands, and non-endpoint transports', () => {
    const result = mapOpenApiCoverageToTools(
      [SYSTEM_INFO_OPERATION],
      [
        tool('jf system info'),
        tool('jf config get'),
        tool('jf api get'),
        tool('jf api batch'),
        tool('jf events watch'),
        tool('jf notifications list'),
        tool('jf schema compatibility'),
      ],
      3,
    );

    expect(result.mappedToolCount).toBe(1);
    expect(result.toolScopeCount).toBe(7);
    expect(result.mappedOperationKeys).toEqual(new Set(['GET /System/Info']));
    expect(result.unmatchedTools).toEqual([]);
    expect(result.localOnlyTools).toEqual([{
      command: 'jf config get',
      read_only_safe: true,
      reason: 'local_only_command',
    }]);
    expect(result.nonEndpointTools).toEqual([
      { command: 'jf api get', read_only_safe: true, reason: 'openapi_orchestration' },
      { command: 'jf api batch', read_only_safe: true, reason: 'openapi_orchestration' },
      { command: 'jf events watch', read_only_safe: true, reason: 'websocket_transport' },
      { command: 'jf notifications list', read_only_safe: true, reason: 'optional_plugin_api' },
      {
        command: 'jf schema compatibility',
        read_only_safe: true,
        reason: 'openapi_orchestration',
      },
    ]);
  });

  it('aligns a read-only operation scope with read-only-safe tools', () => {
    const result = mapOpenApiCoverageToTools(
      [SYSTEM_INFO_OPERATION],
      [
        tool('jf system info'),
        tool('jf system restart', false),
        tool('jf config get'),
        tool('jf config set', false),
        tool('jf api get'),
        tool('jf api mutate', false),
      ],
      3,
      true,
    );

    expect(result.toolScopeCount).toBe(3);
    expect(result.mappedToolCount).toBe(1);
    expect(result.unmatchedTools).toEqual([]);
    expect(result.localOnlyTools.map(({ command }) => command)).toEqual(['jf config get']);
    expect(result.nonEndpointTools.map(({ command }) => command)).toEqual(['jf api get']);
    expect([
      ...result.unmatchedTools,
      ...result.localOnlyTools,
      ...result.nonEndpointTools,
    ].every((entry) => entry.read_only_safe)).toBe(true);
  });

  it('keeps explicitly denied command exceptions outside read-only tool scope', () => {
    const result = mapOpenApiCoverageToTools([], [
      tool('jf sessions logout', false),
      tool('jf sessions list', true),
    ], 3, true);

    expect(result.toolScopeCount).toBe(1);
    expect(result.unmatchedTools).toEqual([
      { command: 'jf sessions list', read_only_safe: true, reason: 'no_openapi_match_above_min_score' },
    ]);
  });

  it('retains genuine unmatched direct endpoint tools', () => {
    const result = mapOpenApiCoverageToTools(
      [SYSTEM_INFO_OPERATION],
      [tool('jf quantum flux')],
      3,
    );

    expect(result.mappedToolCount).toBe(0);
    expect(result.nonEndpointTools).toEqual([]);
    expect(result.unmatchedTools).toEqual([{
      command: 'jf quantum flux',
      read_only_safe: true,
      reason: 'no_openapi_match_above_min_score',
    }]);
  });
});
