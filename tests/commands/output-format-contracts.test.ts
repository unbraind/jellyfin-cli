import { decode } from '@toon-format/toon';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse as parseYaml } from 'yaml';
import { createCommandOutputFormatter } from '../../src/commands/utils.js';
import type { OutputFormat } from '../../src/types/index.js';

const formats: OutputFormat[] = ['toon', 'json', 'table', 'raw', 'yaml', 'markdown'];

function representativeOutputs(format: OutputFormat): string[] {
  const formatter = createCommandOutputFormatter(format);
  const item = { Id: 'item-1', Name: 'Example', Type: 'Movie', ProductionYear: 2026 };
  const user = { Id: 'user-1', Name: 'Agent', HasPassword: true };
  const session = { Id: 'session-1', UserId: 'user-1', UserName: 'Agent' };
  const task = { Id: 'task-1', Name: 'Scan', Key: 'scan', State: 'Idle', Category: 'Library' };
  const config = { serverUrl: 'http://localhost:8096', username: 'agent', userId: 'user-1' };

  return [
    formatter.formatToon({ available: true }, 'capability'),
    formatter.formatMessage('Complete', true),
    formatter.formatError('Failed', 500, { retryable: false }),
    formatter.formatSystemInfo({
      ServerName: 'Test Server', Version: '10.11.11', Id: 'server-1',
      HasPendingRestart: false, CanSelfRestart: true,
    }),
    formatter.formatUsers([user]),
    formatter.formatUser(user),
    formatter.formatConfig(config),
    formatter.formatServers([{ name: 'default', config, isDefault: true }]),
    formatter.formatItems([item]),
    formatter.formatItem(item),
    formatter.formatQueryResult({ TotalRecordCount: 1, StartIndex: 0, Items: [item] }),
    formatter.formatSearchResult({ TotalRecordCount: 1, SearchHints: [item] }),
    formatter.formatLibraries([{ ItemId: 'library-1', Name: 'Movies', CollectionType: 'movies' }]),
    formatter.formatActivityLog([{
      Id: 1, Name: 'Example', Type: 'System', Date: '2026-08-05T00:00:00.000Z',
      Severity: 'Information',
    }]),
    formatter.formatLiveTvInfo({ IsEnabled: false, Services: [] }),
    formatter.formatSessions([session]),
    formatter.formatSession(session),
    formatter.formatTasks([task]),
    formatter.formatTask(task),
    formatter.formatTaskTriggers([{ Id: 'trigger-1', Type: 'StartupTrigger' }]),
  ];
}

describe('dedicated command output format contracts', () => {
  it.each(formats)('renders every command formatter method as valid %s', (format) => {
    for (const rendered of representativeOutputs(format)) {
      expect(rendered.length).toBeGreaterThan(0);
      if (format === 'json') expect(() => JSON.parse(rendered)).not.toThrow();
      if (format === 'yaml') expect(() => parseYaml(rendered)).not.toThrow();
      if (format === 'toon') expect(() => decode(rendered)).not.toThrow();
    }
  });

  it('prevents command handlers from bypassing the resolved formatter with TOON-only calls', () => {
    const commandsDirectory = join(process.cwd(), 'src', 'commands');
    const bypasses = readdirSync(commandsDirectory)
      .filter((name) => name.endsWith('.ts') && name !== 'utils.ts')
      .flatMap((name) => {
        const source = readFileSync(join(commandsDirectory, name), 'utf8');
        return /\btoon\.format[A-Z]/.test(source) || /import\s+\{[^}]*\btoon\b/.test(source)
          ? [name]
          : [];
      });

    expect(bypasses).toEqual([]);
  });
});
