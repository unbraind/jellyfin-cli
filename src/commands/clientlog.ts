import { Command } from 'commander';
import { createApiClient, handleError } from './utils.js';
import { toon } from '../formatters/index.js';

export function createClientlogCommand(): Command {
  const cmd = new Command('clientlog');
  cmd.description('Send client-side log entries to the Jellyfin server');

  cmd
    .command('send')
    .description('Send a log entry to the server')
    .option('-f, --format <format>', 'Output format')
    .option('--message <text>', 'Log message', 'jellyfin-cli log entry')
    .option('--level <level>', 'Log level (Debug, Information, Warning, Error)', 'Information')
    .option('--name <name>', 'Logger name', 'jellyfin-cli')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        await client.logClientDocument([{
          Name: options.name,
          Timestamp: new Date().toISOString(),
          Message: options.message,
          Level: options.level,
        }]);
        console.log(toon.formatMessage('Log entry sent to server', true));
      } catch (err) { handleError(err, format); }
    });

  return cmd;
}
