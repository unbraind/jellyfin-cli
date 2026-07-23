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
});
