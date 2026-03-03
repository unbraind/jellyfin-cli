import { JellyfinApiClient, JellyfinApiError } from '../api/client.js';
import { toon } from '../formatters/index.js';
import { formatOutput } from '../formatters/index.js';
import type {
  BaseItemDto,
  JellyfinConfig,
  LibraryVirtualFolder,
  OutputFormat,
  ScheduledTaskInfo,
  SearchResult,
  SessionInfo,
  SystemInfo,
  UserDto,
} from '../types/index.js';
import { getConfig } from '../utils/config.js';
import { isOutputFormat, parseOutputFormat } from '../utils/output-format.js';
import { EXPLAIN_ENV_KEY, isExplainModeEnabled } from '../utils/explain.js';

interface ClientResult {
  client: JellyfinApiClient;
  format: OutputFormat;
  config: ReturnType<typeof getConfig>;
}

export async function createApiClient(options: {
  format?: string;
  server?: string;
  explain?: boolean | string;
}): Promise<ClientResult> {
  if (isExplainModeEnabled(options.explain, process.env[EXPLAIN_ENV_KEY])) {
    process.env[EXPLAIN_ENV_KEY] = '1';
  }

  const config = getConfig(options.server);
  if (options.format && !isOutputFormat(options.format)) {
    console.error(
      `Invalid format '${options.format}'. Use one of: toon, json, table, raw, yaml, markdown`,
    );
    process.exit(1);
  }
  const format = parseOutputFormat(options.format, config.outputFormat ?? 'toon');

  if (!config.serverUrl) {
    console.error('No server URL configured. Use: jf config set --server <url>');
    process.exit(1);
  }

  if (!config.apiKey && !config.username) {
    console.error(
      'No API key or username configured. Use: jf config set --api-key <key> or --username <user>',
    );
    process.exit(1);
  }

  const client = new JellyfinApiClient(config);

  if (!config.apiKey && config.username && config.password) {
    try {
      await client.authenticate(config.username, config.password);
    } catch (err) {
      const message = err instanceof JellyfinApiError ? err.message : 'Authentication failed';
      console.error(`Authentication failed: ${message}`);
      process.exit(1);
    }
  } else if (config.apiKey && !config.userId) {
    try {
      const users = await client.getUsers();
      const adminUser = users.find((u) => u.Policy?.IsAdministrator);
      const userId = adminUser?.Id ?? users[0]?.Id;
      if (userId) {
        client.setUserId(userId);
      }
    } catch {
      // Ignore errors when fetching users.
    }
  }

  return { client, format, config };
}

export function handleError(err: unknown, format: OutputFormat): never {
  if (err instanceof JellyfinApiError) {
    console.error(formatError(err.message, format, err.statusCode, err.details));
  } else {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(formatError(message, format));
  }
  process.exit(1);
}

function formatError(error: string, format: OutputFormat, code?: number, details?: unknown): string {
  if (format === 'json') {
    return JSON.stringify({ success: false, error, code, details });
  }
  if (format === 'raw') {
    return `Error: ${error}`;
  }
  return `type: error\ndata:\n  error: ${error}${code ? `\n  code: ${code}` : ''}${details ? `\n  details: ${JSON.stringify(details)}` : ''}\n  success: false`;
}

export function output(data: unknown, format: OutputFormat, typeHint?: string): void {
  console.log(formatOutput(data, format, typeHint));
}

export function formatUsers(users: UserDto[], format: OutputFormat): string {
  if (format === 'toon') {
    return toon.formatUsers(users);
  }
  return formatOutput(users, format, 'users');
}

export function formatUser(user: UserDto, format: OutputFormat): string {
  if (format === 'toon') {
    return toon.formatUser(user);
  }
  return formatOutput(user, format, 'user');
}

export function formatItems(items: BaseItemDto[], format: OutputFormat): string {
  if (format === 'toon') {
    return toon.formatItems(items);
  }
  return formatOutput(items, format, 'items');
}

export function formatItem(item: BaseItemDto, format: OutputFormat): string {
  if (format === 'toon') {
    return toon.formatItem(item);
  }
  return formatOutput(item, format, 'item');
}

export function formatSessions(sessions: SessionInfo[], format: OutputFormat): string {
  if (format === 'toon') {
    return toon.formatSessions(sessions);
  }
  return formatOutput(sessions, format, 'sessions');
}

export function formatSession(session: SessionInfo, format: OutputFormat): string {
  if (format === 'toon') {
    return toon.formatSession(session);
  }
  return formatOutput(session, format, 'session');
}

export function formatLibraries(libraries: LibraryVirtualFolder[], format: OutputFormat): string {
  if (format === 'toon') {
    return toon.formatLibraries(libraries);
  }
  return formatOutput(libraries, format, 'libraries');
}

export function formatTasks(tasks: ScheduledTaskInfo[], format: OutputFormat): string {
  if (format === 'toon') {
    return toon.formatTasks(tasks);
  }
  return formatOutput(tasks, format, 'tasks');
}

export function formatTask(task: ScheduledTaskInfo, format: OutputFormat): string {
  if (format === 'toon') {
    return toon.formatTask(task);
  }
  return formatOutput(task, format, 'task');
}

export function formatSystemInfo(info: SystemInfo, format: OutputFormat): string {
  if (format === 'toon') {
    return toon.formatSystemInfo(info);
  }
  return formatOutput(info, format, 'system_info');
}

export function formatConfig(config: JellyfinConfig, format: OutputFormat): string {
  if (format === 'toon') {
    return toon.formatConfig(config);
  }
  return formatOutput(config, format, 'config');
}

export function formatServers(
  servers: { name: string; config: JellyfinConfig; isDefault: boolean }[],
  format: OutputFormat,
): string {
  if (format === 'toon') {
    return toon.formatServers(servers);
  }
  return formatOutput(servers, format, 'servers');
}

export function formatSearchResult(result: SearchResult, format: OutputFormat): string {
  if (format === 'toon') {
    return toon.formatSearchResult(result);
  }
  return formatOutput(result, format, 'search_result');
}

export function formatMessage(message: string, format: OutputFormat, success = true): string {
  if (format === 'toon') {
    return toon.formatMessage(message, success);
  }
  if (format === 'json') {
    return JSON.stringify({ success, message });
  }
  if (format === 'raw') {
    return message;
  }
  return formatOutput({ message, success }, format, success ? 'message' : 'error');
}

export function formatToon(data: unknown, format: OutputFormat, typeHint?: string): string {
  if (format === 'toon') {
    return toon.formatToon(data, typeHint);
  }
  return formatOutput(data, format, typeHint);
}
