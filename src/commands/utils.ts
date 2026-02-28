import { JellyfinApiClient, JellyfinApiError } from '../api/client.js';
import { getConfig } from '../utils/config.js';
import type { OutputFormat } from '../types/index.js';

interface ClientResult {
  client: JellyfinApiClient;
  format: OutputFormat;
  config: ReturnType<typeof getConfig>;
}

export async function createApiClient(options: { format?: string; server?: string }): Promise<ClientResult> {
  const config = getConfig(options.server);
  const format = (options.format as OutputFormat) ?? config.outputFormat ?? 'toon';

  if (!config.serverUrl) {
    console.error('No server URL configured. Use: jf config set --server <url>');
    process.exit(1);
  }

  if (!config.apiKey && !config.username) {
    console.error('No API key or username configured. Use: jf config set --api-key <key> or --username <user>');
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
      // Ignore errors when fetching users
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
  return `type: error
data:
  error: ${error}${code ? `\n  code: ${code}` : ''}${details ? `\n  details: ${JSON.stringify(details)}` : ''}
  success: false`;
}
