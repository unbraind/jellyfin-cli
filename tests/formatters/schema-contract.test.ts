import { decode } from '@toon-format/toon';
import { describe, expect, it } from 'vitest';
import { getSchema } from '../../src/commands/schema-defs.js';
import {
  formatActivityLog,
  formatConfig,
  formatError,
  formatItems,
  formatLibraries,
  formatMessage,
  formatQueryResult,
  formatSearchResult,
  formatSessions,
  formatSystemInfo,
  formatTasks,
  formatToon,
  formatUsers,
} from '../../src/formatters/toon.js';
import { validateJsonSchema } from '../../src/utils/schema-validate.js';

const representativeOutputs = {
  system_info: formatSystemInfo({
    ServerName: 'Test Server',
    Version: '10.11.11',
    Id: 'server-1',
    LocalAddress: 'http://localhost:8096',
    OperatingSystem: 'Linux',
    HasPendingRestart: false,
    CanSelfRestart: true,
  }),
  users: formatUsers([{
    Id: 'user-1',
    Name: 'Agent',
    HasPassword: true,
    Policy: { IsAdministrator: false, IsDisabled: false, IsHidden: false },
  }]),
  items: formatItems([{
    Id: 'item-1',
    Name: 'Example',
    Type: 'Movie',
    ProductionYear: 2026,
  }]),
  query_result: formatQueryResult({
    TotalRecordCount: 1,
    StartIndex: 0,
    Items: [{ Id: 'item-1' }],
  }),
  sessions: formatSessions([{
    Id: 'session-1',
    UserId: 'user-1',
    UserName: 'Agent',
    NowPlayingItem: { Id: 'item-1', Name: 'Example', Type: 'Movie' },
  }]),
  libraries: formatLibraries([{
    ItemId: 'library-1',
    Name: 'Movies',
    CollectionType: 'movies',
  }]),
  tasks: formatTasks([{
    Id: 'task-1',
    Name: 'Scan',
    Key: 'scan',
    State: 'Idle',
    Category: 'Library',
  }]),
  search_result: formatSearchResult({
    TotalRecordCount: 1,
    SearchHints: [{ Id: 'item-1', Name: 'Example', Type: 'Movie' }],
  }),
  config: formatConfig({
    serverUrl: 'http://localhost:8096',
    username: 'agent',
    userId: 'user-1',
  }),
  activity_log: formatActivityLog([{
    Id: 1,
    Name: 'Example',
    Type: 'System',
    Date: '2026-07-23T00:00:00.000Z',
    Severity: 'Information',
  }]),
  message: formatMessage('Complete'),
  error: formatError('Failed', 500, { retryable: false }),
  event_types: formatToon([{
    message_type: 'Sessions',
    category: 'session',
    periodic_subscription: 'sessions',
    read_only_safe: true,
  }], 'event_types'),
  event_watch: formatToon({
    kind: 'summary',
    stop_reason: 'count_reached',
    event_count: 1,
    duration_ms: 25,
    subscriptions: ['sessions'],
    event_types: ['Sessions'],
    events: [{
      kind: 'event',
      sequence: 1,
      received_at: '2026-07-27T20:00:00.000Z',
      message_type: 'Sessions',
      data: [],
    }],
  }, 'event_watch'),
  openapi_coverage: formatToon({
    source_path: '/api-docs/openapi.json',
    source_kind: 'server',
    server_version: '10.11.11',
    path_count: 1,
    operation_count: 1,
    operation_scope_count: 1,
    mapped_operation_count: 1,
    unmapped_operation_count: 0,
    unmapped_tool_count: 0,
    coverage_percent: 100,
    tool_scope_count: 3,
    mapped_tool_count: 1,
    unmatched_operations_total: 0,
    unmatched_operations_truncated: false,
    unmatched_tools_total: 0,
    unmatched_tools_truncated: false,
    local_only_tools_total: 1,
    local_only_tools_truncated: false,
    non_endpoint_tools_total: 1,
    non_endpoint_tools_truncated: false,
    min_score: 3,
    unmatched_operations: [],
    unmatched_tools: [],
    local_only_tools: [],
    non_endpoint_tools: [],
    unmatched_by_tag_total: 0,
    unmatched_by_tag: [],
  }, 'openapi_coverage'),
  openapi_research: formatToon({
    source_path: '/api-docs/openapi.json',
    source_kind: 'server',
    server_version: '10.11.11',
    path_count: 1,
    operation_count: 1,
    min_score: 3,
    full_scope: {
      operation_scope_count: 1,
      mapped_operation_count: 1,
      unmapped_operation_count: 0,
      unmapped_tool_count: 0,
      coverage_percent: 100,
      tool_scope_count: 3,
      mapped_tool_count: 1,
      unmatched_operations_total: 0,
      unmatched_tools_total: 0,
      unmatched_tools_truncated: false,
      local_only_tools_total: 1,
      local_only_tools_truncated: false,
      non_endpoint_tools_total: 1,
      non_endpoint_tools_truncated: false,
      unmatched_tools: [],
      local_only_tools: [],
      non_endpoint_tools: [],
      unmatched_by_tag_total: 0,
      unmatched_by_tag: [],
    },
    read_only_scope: {
      operation_scope_count: 1,
      mapped_operation_count: 1,
      unmapped_operation_count: 0,
      unmapped_tool_count: 0,
      coverage_percent: 100,
      tool_scope_count: 3,
      mapped_tool_count: 1,
      unmatched_operations_total: 0,
      unmatched_tools_total: 0,
      unmatched_tools_truncated: false,
      local_only_tools_total: 1,
      local_only_tools_truncated: false,
      non_endpoint_tools_total: 1,
      non_endpoint_tools_truncated: false,
      unmatched_tools: [],
      local_only_tools: [],
      non_endpoint_tools: [],
      unmatched_by_tag_total: 0,
      unmatched_by_tag: [],
    },
  }, 'openapi_research'),
  jellyfin_versions: formatToon({
    live_version: '10.11.11',
    stable: {
      version: '10.11.11',
      tag: 'v10.11.11',
      name: '10.11.11',
      release_url: 'https://github.com/jellyfin/jellyfin/releases/tag/v10.11.11',
      published_at: '2026-06-06T00:00:00Z',
      prerelease: false,
      openapi_available: true,
      openapi_source_kind: 'official',
    },
    preview: {
      version: '12.0-rc4',
      tag: 'v12.0-rc4',
      name: '12.0-rc4',
      release_url: 'https://github.com/jellyfin/jellyfin/releases/tag/v12.0-rc4',
      published_at: '2026-08-02T00:00:00Z',
      prerelease: true,
      openapi_available: true,
      openapi_source_kind: 'cache',
    },
    aliases: {
      latest_stable: '10.11.11',
      latest_preview: '12.0-rc4',
    },
    compatibility_commands: {
      stable: ['jf', 'schema', 'compatibility', '--target-version', 'latest-stable'],
      preview: [
        'jf', 'schema', 'compatibility', '--target-version', 'latest-preview', '--allow-prerelease',
      ],
    },
  }, 'jellyfin_versions'),
} as const;

describe('TOON formatter schema contracts', () => {
  for (const [type, encoded] of Object.entries(representativeOutputs)) {
    it(`decodes and validates ${type}`, () => {
      const decoded = decode(encoded);
      const validation = validateJsonSchema(decoded, getSchema(type));

      expect(validation.errors).toEqual([]);
      expect(validation.valid).toBe(true);
    });
  }

  it('validates raw NDJSON event and summary records', () => {
    const schema = getSchema('event_stream_record');
    const event = validateJsonSchema({
      kind: 'event',
      sequence: 1,
      received_at: '2026-07-27T20:00:00.000Z',
      message_type: 'LibraryChanged',
      data: {},
    }, schema);
    const summary = validateJsonSchema({
      kind: 'summary',
      stop_reason: 'duration_reached',
      event_count: 0,
      duration_ms: 1000,
      subscriptions: [],
      event_types: [],
    }, schema);

    expect(event.valid).toBe(true);
    expect(summary.valid).toBe(true);
  });
});
