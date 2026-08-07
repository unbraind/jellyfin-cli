import { afterEach, describe, expect, it } from 'vitest';
import { decode } from '@toon-format/toon';
import YAML from 'yaml';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { runCliInProcess } from '../utils/run-cli-in-process.js';

const testConfigDir = join(tmpdir(), `jellyfin-cli-events-test-${Date.now()}`);
const isolatedEnv: Record<string, string> = {
  JELLYFIN_SERVER_URL: '',
  JELLYFIN_API_KEY: '',
  JELLYFIN_USERNAME: '',
  JELLYFIN_PASSWORD: '',
  JELLYFIN_USER_ID: '',
  JELLYFIN_TIMEOUT: '',
  JELLYFIN_OUTPUT_FORMAT: '',
  JELLYFIN_READ_ONLY: '1',
  JELLYFIN_EXPLAIN: '',
};
let mockServer: Bun.Server<undefined> | undefined;

async function runCli(args: string[]): Promise<{ code: number; stdout: string; stderr: string }> {
  return runCliInProcess(args, {
    ...isolatedEnv,
    JELLYFIN_CONFIG_DIR: testConfigDir,
  });
}

function writeSettings(serverUrl = 'http://127.0.0.1:1'): void {
  mkdirSync(testConfigDir, { recursive: true });
  writeFileSync(join(testConfigDir, 'settings.json'), JSON.stringify({
    defaultServer: {
      serverUrl,
      apiKey: 'synthetic-api-key',
      userId: 'synthetic-user-id',
      outputFormat: 'toon',
    },
  }));
}

afterEach(() => {
  mockServer?.stop(true);
  mockServer = undefined;
  rmSync(testConfigDir, { recursive: true, force: true });
});

describe('events command', () => {
  it('documents the complete bounded command surface and inherited globals', async () => {
    const root = await runCli(['events', '--help']);
    const watch = await runCli(['events', 'watch', '--help']);

    expect(root.code).toBe(0);
    expect(root.stdout).toContain('types');
    expect(root.stdout).toContain('watch');
    expect(watch.code).toBe(0);
    expect(watch.stdout).toContain('--subscribe <name...>');
    expect(watch.stdout).toContain('--max-message-bytes <bytes>');
    expect(watch.stdout).toContain('--read-only');
  });

  it('renders the local event catalog through every advertised output format', async () => {
    const toon = await runCli(['events', 'types']);
    const json = await runCli(['events', 'types', '--format', 'json']);
    const yaml = await runCli(['events', 'types', '--format', 'yaml']);
    const table = await runCli(['events', 'types', '--format', 'table']);
    const raw = await runCli(['events', 'types', '--format', 'raw']);
    const markdown = await runCli(['events', 'types', '--format', 'markdown']);

    expect(decode(toon.stdout)).toMatchObject({ type: 'event_types' });
    expect(JSON.parse(json.stdout)).toHaveLength(28);
    expect(YAML.parse(yaml.stdout)).toHaveLength(28);
    expect(table.stdout).toContain('message_type');
    expect(JSON.parse(raw.stdout)).toHaveLength(28);
    expect(markdown.stdout).toContain('| message_type |');
    for (const result of [toon, json, yaml, table, raw, markdown]) {
      expect(result.code).toBe(0);
      expect(result.stderr).toBe('');
    }
  }, 30_000);

  it('rejects unsafe bounds, unknown selectors, and non-JSON streaming before connecting', async () => {
    writeSettings();
    const cases = [
      [['events', 'watch', '--count', '1001'], '--count cannot exceed 1000'],
      [['events', 'watch', '--duration', '3601'], '--duration cannot exceed 3600 seconds'],
      [['events', 'watch', '--duration', '1.5'], '--duration must be a positive integer'],
      [['events', 'watch', '--interval', '499'], '--interval cannot be less than 500'],
      [['events', 'watch', '--count', '1oops'], '--count must be a positive integer'],
      [['events', 'watch', '--max-message-bytes', '16777217'], '--max-message-bytes cannot exceed 16777216'],
      [['events', 'watch', '--type', 'NotAnEvent'], 'Unknown event type'],
      [['events', 'watch', '--subscribe', 'unknown'], 'Unknown subscription'],
      [['events', 'watch', '--stream'], '--stream requires --format json'],
    ] as const;

    for (const [args, message] of cases) {
      const result = await runCli([...args]);
      expect(result.code).toBe(1);
      expect(result.stderr).toContain(message);
      expect(result.stderr).not.toContain('synthetic-api-key');
    }
  }, 30_000);
});

describe.skipIf(!('bun' in process.versions))('events command WebSocket integration', () => {
  it('authenticates, subscribes, filters, and emits aggregate and NDJSON contracts', async () => {
    let authenticated = false;
    mockServer = Bun.serve({
      port: 0,
      fetch(request, server) {
        const url = new URL(request.url);
        if (url.pathname === '/socket') {
          authenticated = url.searchParams.get('ApiKey') === 'synthetic-api-key';
          return server.upgrade(request) ? undefined : new Response('Upgrade failed', { status: 400 });
        }
        return new Response('Not Found', { status: 404 });
      },
      websocket: {
        open(socket) {
          socket.send(JSON.stringify({ MessageType: 'ForceKeepAlive', Data: 1000 }));
        },
        message(socket, raw) {
          const message = JSON.parse(String(raw)) as { MessageType?: string };
          if (message.MessageType === 'SessionsStart') {
            socket.send(JSON.stringify({ MessageType: 'Sessions', Data: [] }));
          }
        },
      },
    });
    writeSettings(`http://127.0.0.1:${mockServer.port}`);

    const aggregate = await runCli([
      'events', 'watch',
      '--subscribe', 'sessions',
      '--type', 'Sessions',
      '--count', '1',
      '--duration', '5',
      '--format', 'json',
    ]);
    expect(aggregate.code).toBe(0);
    expect(authenticated).toBe(true);
    expect(JSON.parse(aggregate.stdout)).toMatchObject({
      kind: 'summary',
      stop_reason: 'count_reached',
      event_count: 1,
      subscriptions: ['sessions'],
      events: [{ kind: 'event', sequence: 1, message_type: 'Sessions', data: [] }],
    });

    const stream = await runCli([
      'events', 'watch',
      '--include-control',
      '--count', '1',
      '--duration', '5',
      '--format', 'json',
      '--stream',
    ]);
    expect(stream.code).toBe(0);
    const records = stream.stdout.trim().split('\n').map((line) => JSON.parse(line) as {
      kind: string;
      message_type?: string;
      event_count?: number;
    });
    expect(records).toHaveLength(2);
    expect(records[0]).toMatchObject({ kind: 'event', message_type: 'ForceKeepAlive' });
    expect(records[1]).toMatchObject({ kind: 'summary', event_count: 1 });
  });
});
