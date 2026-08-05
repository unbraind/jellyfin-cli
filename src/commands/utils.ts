import { JellyfinApiClient, JellyfinApiError } from '../api/client.js';
import { formatOutput, toon } from '../formatters/index.js';
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
  formatter: CommandOutputFormatter;
  config: ReturnType<typeof getConfig>;
}

/**
 * Provides the legacy-named formatter methods used by command handlers while honoring the
 * resolved output format at the final serialization boundary.
 */
export type CommandOutputFormatter = Omit<typeof toon, 'toon'>;

/**
 * Performs the create api client operation through the typed Jellyfin API boundary.
 * @param options - Optional settings that refine the operation.
 * @param options.format - The requested machine-readable or human-readable output format.
 * @param options.server - The server value required by this operation.
 * @param options.explain - The explain value required by this operation.
 * @returns - The typed create api client result.
 */
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
    console.error(formatError('No server URL configured. Use: jf config set --server <url>', format));
    process.exit(1);
  }

  if (!config.apiKey && !config.username) {
    console.error(
      formatError(
        'No API key or username configured. Use: jf config set --api-key <key> or --username <user>',
        format,
      ),
    );
    process.exit(1);
  }

  const client = new JellyfinApiClient(config);

  if (!config.apiKey && config.username && config.password) {
    try {
      await client.authenticate(config.username, config.password);
    } catch (err) {
      const message = err instanceof JellyfinApiError ? err.message : 'Authentication failed';
      console.error(formatError(`Authentication failed: ${message}`, format));
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

  return { client, format, formatter: createCommandOutputFormatter(format), config };
}

/**
 * Binds every legacy-named command renderer to one resolved output format.
 * @param format - The requested machine-readable or human-readable output format.
 * @returns - A formatter compatible with existing command rendering calls.
 */
export function createCommandOutputFormatter(format: OutputFormat): CommandOutputFormatter {
  return {
    formatToon: (data, typeHint) => formatToon(data, format, typeHint),
    formatMessage: (message, success) => formatMessage(message, format, success),
    formatError: (error, code, details) => formatError(error, format, code, details),
    formatSystemInfo: (info) => formatSystemInfo(info, format),
    formatUsers: (users) => formatUsers(users, format),
    formatUser: (user) => formatUser(user, format),
    formatConfig: (resolvedConfig) => formatConfig(resolvedConfig, format),
    formatServers: (servers) => formatServers(servers, format),
    formatItems: (items) => formatItems(items, format),
    formatItem: (item) => formatItem(item, format),
    formatQueryResult: (result, itemFormatter) => format === 'toon'
      ? toon.formatQueryResult(result, itemFormatter)
      : formatOutput(result, format, 'query_result'),
    formatSearchResult: (result) => formatSearchResult(result, format),
    formatLibraries: (libraries) => formatLibraries(libraries, format),
    formatActivityLog: (log) => format === 'toon'
      ? toon.formatActivityLog(log)
      : formatOutput(log, format, 'activity_log'),
    formatLiveTvInfo: (info) => format === 'toon'
      ? toon.formatLiveTvInfo(info)
      : formatOutput(info, format, 'livetv'),
    formatSessions: (sessions) => formatSessions(sessions, format),
    formatSession: (session) => formatSession(session, format),
    formatTasks: (tasks) => formatTasks(tasks, format),
    formatTask: (task) => formatTask(task, format),
    formatTaskTriggers: (triggers) => format === 'toon'
      ? toon.formatTaskTriggers(triggers)
      : formatOutput(triggers, format, 'triggers'),
  };
}

/**
 * Implements handle error for the typed Jellyfin CLI runtime.
 * @param err - The err value required by this operation.
 * @param format - The requested machine-readable or human-readable output format.
 */
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
  if (format === 'toon') {
    return toon.formatError(error, code, details);
  }
  return formatOutput({ success: false, error, code, details }, format);
}

/**
 * Implements output for the typed Jellyfin CLI runtime.
 * @param data - The typed payload to format or submit.
 * @param format - The requested machine-readable or human-readable output format.
 * @param typeHint - The type hint value required by this operation.
 */
export function output(data: unknown, format: OutputFormat, typeHint?: string): void {
  console.log(formatOutput(data, format, typeHint));
}

/**
 * Produces the validated format users result used by CLI automation.
 * @param users - The users value required by this operation.
 * @param format - The requested machine-readable or human-readable output format.
 * @returns - The normalized string representation.
 */
export function formatUsers(users: UserDto[], format: OutputFormat): string {
  if (format === 'toon') {
    return toon.formatUsers(users);
  }
  return formatOutput(users, format, 'users');
}

/**
 * Produces the validated format user result used by CLI automation.
 * @param user - The user value required by this operation.
 * @param format - The requested machine-readable or human-readable output format.
 * @returns - The normalized string representation.
 */
export function formatUser(user: UserDto, format: OutputFormat): string {
  if (format === 'toon') {
    return toon.formatUser(user);
  }
  return formatOutput(user, format, 'user');
}

/**
 * Produces the validated format items result used by CLI automation.
 * @param items - The items value required by this operation.
 * @param format - The requested machine-readable or human-readable output format.
 * @returns - The normalized string representation.
 */
export function formatItems(items: BaseItemDto[], format: OutputFormat): string {
  if (format === 'toon') {
    return toon.formatItems(items);
  }
  return formatOutput(items, format, 'items');
}

/**
 * Produces the validated format item result used by CLI automation.
 * @param item - The item value required by this operation.
 * @param format - The requested machine-readable or human-readable output format.
 * @returns - The normalized string representation.
 */
export function formatItem(item: BaseItemDto, format: OutputFormat): string {
  if (format === 'toon') {
    return toon.formatItem(item);
  }
  return formatOutput(item, format, 'item');
}

/**
 * Produces the validated format sessions result used by CLI automation.
 * @param sessions - The sessions value required by this operation.
 * @param format - The requested machine-readable or human-readable output format.
 * @returns - The normalized string representation.
 */
export function formatSessions(sessions: SessionInfo[], format: OutputFormat): string {
  if (format === 'toon') {
    return toon.formatSessions(sessions);
  }
  return formatOutput(sessions.map(withPlaybackIndicator), format, 'sessions');
}

/**
 * Produces the validated format session result used by CLI automation.
 * @param session - The session value required by this operation.
 * @param format - The requested machine-readable or human-readable output format.
 * @returns - The normalized string representation.
 */
export function formatSession(session: SessionInfo, format: OutputFormat): string {
  if (format === 'toon') {
    return toon.formatSession(session);
  }
  return formatOutput(withPlaybackIndicator(session), format, 'session');
}

function withPlaybackIndicator(session: SessionInfo): SessionInfo & { isPlaying: boolean } {
  return {
    ...session,
    isPlaying: session.NowPlayingItem !== undefined && session.NowPlayingItem !== null,
  };
}

/**
 * Produces the validated format libraries result used by CLI automation.
 * @param libraries - The libraries value required by this operation.
 * @param format - The requested machine-readable or human-readable output format.
 * @returns - The normalized string representation.
 */
export function formatLibraries(libraries: LibraryVirtualFolder[], format: OutputFormat): string {
  if (format === 'toon') {
    return toon.formatLibraries(libraries);
  }
  return formatOutput(libraries, format, 'libraries');
}

/**
 * Produces the validated format tasks result used by CLI automation.
 * @param tasks - The tasks value required by this operation.
 * @param format - The requested machine-readable or human-readable output format.
 * @returns - The normalized string representation.
 */
export function formatTasks(tasks: ScheduledTaskInfo[], format: OutputFormat): string {
  if (format === 'toon') {
    return toon.formatTasks(tasks);
  }
  return formatOutput(tasks, format, 'tasks');
}

/**
 * Produces the validated format task result used by CLI automation.
 * @param task - The task value required by this operation.
 * @param format - The requested machine-readable or human-readable output format.
 * @returns - The normalized string representation.
 */
export function formatTask(task: ScheduledTaskInfo, format: OutputFormat): string {
  if (format === 'toon') {
    return toon.formatTask(task);
  }
  return formatOutput(task, format, 'task');
}

/**
 * Produces the validated format system info result used by CLI automation.
 * @param info - The info value required by this operation.
 * @param format - The requested machine-readable or human-readable output format.
 * @returns - The normalized string representation.
 */
export function formatSystemInfo(info: SystemInfo, format: OutputFormat): string {
  if (format === 'toon') {
    return toon.formatSystemInfo(info);
  }
  return formatOutput({
    name: info.ServerName,
    version: info.Version,
    id: info.Id,
    local_address: info.LocalAddress,
    operating_system: info.OperatingSystem,
    has_pending_restart: info.HasPendingRestart,
    can_self_restart: info.CanSelfRestart,
  }, format, 'system_info');
}

/**
 * Produces the validated format config result used by CLI automation.
 * @param config - The resolved Jellyfin client configuration.
 * @param format - The requested machine-readable or human-readable output format.
 * @returns - The normalized string representation.
 */
export function formatConfig(config: JellyfinConfig, format: OutputFormat): string {
  if (format === 'toon') {
    return toon.formatConfig(config);
  }
  return formatOutput({
    server_url: config.serverUrl ?? null,
    username: config.username ?? null,
    user_id: config.userId ?? null,
    output_format: config.outputFormat ?? 'toon',
    timeout: config.timeout ?? 30_000,
  }, format, 'config');
}

/**
 * Produces the validated format servers result used by CLI automation.
 * @param servers - The servers value required by this operation.
 * @param format - The requested machine-readable or human-readable output format.
 * @returns - The typed format servers result.
 */
export function formatServers(
  servers: { name: string; config: JellyfinConfig; isDefault: boolean }[],
  format: OutputFormat,
): string {
  if (format === 'toon') {
    return toon.formatServers(servers);
  }
  return formatOutput(servers.map((server) => ({
    name: server.name,
    server_url: server.config.serverUrl,
    username: server.config.username ?? null,
    is_default: server.isDefault,
  })), format, 'servers');
}

/**
 * Produces the validated format search result result used by CLI automation.
 * @param result - The result value required by this operation.
 * @param format - The requested machine-readable or human-readable output format.
 * @returns - The normalized string representation.
 */
export function formatSearchResult(result: SearchResult, format: OutputFormat): string {
  if (format === 'toon') {
    return toon.formatSearchResult(result);
  }
  return formatOutput(result, format, 'search_result');
}

/**
 * Produces the validated format message result used by CLI automation.
 * @param message - The message value required by this operation.
 * @param format - The requested machine-readable or human-readable output format.
 * @param success - The success value required by this operation.
 * @returns - The normalized string representation.
 */
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

/**
 * Produces the validated format toon result used by CLI automation.
 * @param data - The typed payload to format or submit.
 * @param format - The requested machine-readable or human-readable output format.
 * @param typeHint - The type hint value required by this operation.
 * @returns - The normalized string representation.
 */
export function formatToon(data: unknown, format: OutputFormat, typeHint?: string): string {
  if (format === 'toon') {
    return toon.formatToon(data, typeHint);
  }
  return formatOutput(data, format, typeHint);
}
