import { Command } from 'commander';
import type {
  JellyfinEventSubscription,
  JellyfinEventTypeInfo,
} from '../types/events.js';
import {
  JELLYFIN_EVENT_SUBSCRIPTIONS,
  JELLYFIN_EVENT_TYPES,
} from '../types/events.js';
import { watchJellyfinEvents } from '../utils/websocket-events.js';
import { createApiClient, handleError, output } from './utils.js';
import { parsePositiveInt } from './number-options.js';
import { resolveOutputFormat, type FormatOptions } from './schema-utils.js';

const DEFAULT_COUNT = '10';
const DEFAULT_DURATION_SECONDS = '30';
const DEFAULT_CONNECT_TIMEOUT_SECONDS = '10';
const DEFAULT_MAX_MESSAGE_BYTES = '1048576';
const DEFAULT_INTERVAL_MS = '1000';
const MAX_COUNT = 1000;
const MAX_DURATION_SECONDS = 3600;
const MAX_MESSAGE_BYTES = 16 * 1024 * 1024;
const MIN_INTERVAL_MS = 500;

type EventsWatchOptions = {
  format?: string;
  server?: string;
  type?: string[];
  subscribe?: string[];
  includeControl?: boolean;
  stream?: boolean;
  count?: string;
  duration?: string;
  connectTimeout?: string;
  maxMessageBytes?: string;
  interval?: string;
};

const TYPE_CATEGORIES: Record<string, JellyfinEventTypeInfo['category']> = {
  ActivityLogEntry: 'server',
  ForceKeepAlive: 'control',
  GeneralCommand: 'playback',
  KeepAlive: 'control',
  LibraryChanged: 'library',
  Play: 'playback',
  Playstate: 'playback',
  RefreshProgress: 'library',
  RestartRequired: 'server',
  ScheduledTaskEnded: 'server',
  ScheduledTasksInfo: 'server',
  ServerRestarting: 'server',
  ServerShuttingDown: 'server',
  Sessions: 'session',
  SyncPlayCommand: 'syncplay',
  SyncPlayGroupUpdate: 'syncplay',
  UserDataChanged: 'user',
  UserDeleted: 'user',
  UserUpdated: 'user',
};

function splitValues(values: string[] | undefined): string[] {
  return [...new Set((values ?? []).flatMap((value) => value.split(',')).map((value) => value.trim()).filter(Boolean))];
}

function validateTypes(values: string[]): string[] {
  const valid = new Set<string>(JELLYFIN_EVENT_TYPES);
  const invalid = values.filter((value) => !valid.has(value));
  if (invalid.length > 0) {
    throw new Error(`Unknown event type(s): ${invalid.join(', ')}. Use jf events types.`);
  }
  return values;
}

function validateSubscriptions(values: string[]): JellyfinEventSubscription[] {
  const valid = new Set<string>(JELLYFIN_EVENT_SUBSCRIPTIONS);
  const invalid = values.filter((value) => !valid.has(value));
  if (invalid.length > 0) {
    throw new Error(`Unknown subscription(s): ${invalid.join(', ')}. Use: activity, sessions, tasks.`);
  }
  return values as JellyfinEventSubscription[];
}

function eventCatalog(): JellyfinEventTypeInfo[] {
  return JELLYFIN_EVENT_TYPES.map((messageType) => ({
    message_type: messageType,
    category: TYPE_CATEGORIES[messageType] ?? (messageType.startsWith('Package') ? 'plugin' : 'server'),
    periodic_subscription: messageType === 'ActivityLogEntry'
      ? 'activity'
      : messageType === 'Sessions'
        ? 'sessions'
        : messageType === 'ScheduledTasksInfo'
          ? 'tasks'
          : null,
    read_only_safe: true,
  }));
}

/**
 * Builds the bounded Jellyfin WebSocket event command tree.
 * @returns The configured `jf events` command family.
 */
export function createEventsCommand(): Command {
  const command = new Command('events')
    .description('Inspect and watch authenticated Jellyfin real-time server events');

  command
    .command('types')
    .description('List supported Jellyfin WebSocket message types and subscriptions')
    .option('-f, --format <format>', 'Output format (toon, json, table, raw, yaml, markdown)', 'toon')
    .action(function (this: Command, options: FormatOptions) {
      const format = resolveOutputFormat(this, options);
      output(eventCatalog(), format, 'event_types');
    });

  command
    .command('watch')
    .description('Watch a bounded, read-only stream of authenticated Jellyfin events')
    .option('-f, --format <format>', 'Output format (toon, json, table, raw, yaml, markdown)', 'toon')
    .option('--server <name>', 'Server name from config')
    .option('--type <messageType...>', 'Include only exact message types (repeatable or comma-separated)')
    .option('--subscribe <name...>', 'Request periodic reads: activity, sessions, tasks')
    .option('--include-control', 'Include KeepAlive and ForceKeepAlive records')
    .option('--stream', 'Emit each record plus the summary as newline-delimited JSON (requires JSON)')
    .option('--count <number>', 'Maximum emitted event records', DEFAULT_COUNT)
    .option('--duration <seconds>', 'Maximum watch duration in seconds', DEFAULT_DURATION_SECONDS)
    .option(
      '--connect-timeout <seconds>',
      'Maximum WebSocket connection wait in seconds',
      DEFAULT_CONNECT_TIMEOUT_SECONDS,
    )
    .option('--max-message-bytes <bytes>', 'Maximum accepted message size', DEFAULT_MAX_MESSAGE_BYTES)
    .option('--interval <milliseconds>', 'Periodic subscription interval', DEFAULT_INTERVAL_MS)
    .action(async (options: EventsWatchOptions) => {
      const { client, config, format } = await createApiClient(options);
      try {
        if (options.stream && format !== 'json') {
          throw new Error('--stream requires --format json');
        }
        const count = parsePositiveInt(options.count ?? DEFAULT_COUNT, '--count');
        const durationSeconds = parsePositiveInt(
          options.duration ?? DEFAULT_DURATION_SECONDS,
          '--duration',
        );
        const connectTimeoutSeconds = parsePositiveInt(
          options.connectTimeout ?? DEFAULT_CONNECT_TIMEOUT_SECONDS,
          '--connect-timeout',
        );
        const maxMessageBytes = parsePositiveInt(
          options.maxMessageBytes ?? DEFAULT_MAX_MESSAGE_BYTES,
          '--max-message-bytes',
        );
        const intervalMs = parsePositiveInt(options.interval ?? DEFAULT_INTERVAL_MS, '--interval');
        if (count > MAX_COUNT) throw new Error(`--count cannot exceed ${MAX_COUNT}`);
        if (durationSeconds > MAX_DURATION_SECONDS) {
          throw new Error(`--duration cannot exceed ${MAX_DURATION_SECONDS} seconds`);
        }
        if (maxMessageBytes > MAX_MESSAGE_BYTES) {
          throw new Error(`--max-message-bytes cannot exceed ${MAX_MESSAGE_BYTES}`);
        }
        if (intervalMs < MIN_INTERVAL_MS) {
          throw new Error(`--interval cannot be less than ${MIN_INTERVAL_MS} milliseconds`);
        }
        const accessToken = client.getAccessToken();
        if (!accessToken) throw new Error('Authenticated Jellyfin access token is required');
        const eventTypes = validateTypes(splitValues(options.type));
        const subscriptions = validateSubscriptions(splitValues(options.subscribe));
        const result = await watchJellyfinEvents({
          serverUrl: config.serverUrl,
          accessToken,
          eventTypes,
          subscriptions,
          includeControl: options.includeControl === true,
          count,
          durationMs: durationSeconds * 1000,
          connectTimeoutMs: connectTimeoutSeconds * 1000,
          maxMessageBytes,
          intervalMs,
          onEvent: options.stream
            ? (event) => process.stdout.write(`${JSON.stringify(event)}\n`)
            : undefined,
        });
        if (options.stream) {
          process.stdout.write(`${JSON.stringify({ ...result, events: undefined })}\n`);
        } else {
          output(result, format, 'event_watch');
        }
      } catch (error) {
        handleError(error, format);
      }
    });

  return command;
}
