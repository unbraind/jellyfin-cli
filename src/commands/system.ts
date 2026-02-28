import { Command } from 'commander';
import { JellyfinApiError } from '../api/client.js';
import { formatSuccess, formatError, toon } from '../formatters/index.js';
import { createApiClient } from './utils.js';

export function createSystemCommand(): Command {
  const cmd = new Command('system');

  cmd
    .command('info')
    .description('Get system information')
    .option('-f, --format <format>', 'Output format')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const info = await client.getSystemInfo();
        console.log(toon.formatSystemInfo(info));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('health')
    .description('Check server health')
    .option('-f, --format <format>', 'Output format')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const health = await client.getHealth();
        console.log(formatSuccess(`Server health: ${health}`, format));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('restart')
    .description('Restart the Jellyfin server')
    .option('-f, --format <format>', 'Output format')
    .option('--force', 'Skip confirmation')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      if (!options.force) {
        console.error('Use --force to confirm restart');
        process.exit(1);
      }
      try {
        await client.restartServer();
        console.log(formatSuccess('Server restart initiated', format));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('shutdown')
    .description('Shutdown the Jellyfin server')
    .option('-f, --format <format>', 'Output format')
    .option('--force', 'Skip confirmation')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      if (!options.force) {
        console.error('Use --force to confirm shutdown');
        process.exit(1);
      }
      try {
        await client.shutdownServer();
        console.log(formatSuccess('Server shutdown initiated', format));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('activity')
    .description('Get activity log')
    .option('-f, --format <format>', 'Output format')
    .option('--limit <number>', 'Number of entries', '50')
    .option('--start <number>', 'Start index', '0')
    .option('--min-date <date>', 'Minimum date (ISO format)')
    .option('--has-user', 'Only show entries with user ID')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const result = await client.getActivityLog({
          limit: parseInt(options.limit, 10),
          startIndex: parseInt(options.start, 10),
          minDate: options.minDate,
          hasUserId: options.hasUser,
        });
        console.log(toon.formatActivityLog(result.Items ?? []));
      } catch (err) {
        handleError(err, format);
      }
    });

  return cmd;
}

function handleError(err: unknown, format: string): never {
  if (err instanceof JellyfinApiError) {
    console.error(formatError(err.message, format as 'toon' | 'json' | 'table' | 'raw', err.statusCode, err.details));
  } else {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(formatError(message, format as 'toon' | 'json' | 'table' | 'raw'));
  }
  process.exit(1);
}
