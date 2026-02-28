import { Command } from 'commander';
import { createApiClient, handleError } from './utils.js';
import { toon } from '../formatters/index.js';

export function createApikeysCommand(): Command {
  const cmd = new Command('apikeys');

  cmd
    .command('list')
    .description('List all API keys')
    .option('-f, --format <format>', 'Output format')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const keys = await client.getApiKeys();
        const simplified = keys.map((k) => ({
          name: k.Name,
          app_name: k.AppName,
          app_version: k.AppVersion,
          date_created: k.DateCreated,
          last_activity: k.DateLastActivity,
          access_token: k.AccessToken ? `${k.AccessToken.slice(0, 8)}...` : null,
        }));
        console.log(toon.formatToon(simplified, 'api_keys'));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('create <app>')
    .description('Create a new API key')
    .option('-f, --format <format>', 'Output format')
    .action(async (app, options) => {
      const { client, format } = await createApiClient(options);
      try {
        const key = await client.createApiKey(app);
        console.log(toon.formatToon({
          name: key.Name,
          access_token: key.AccessToken,
          app_name: key.AppName,
          date_created: key.DateCreated,
        }, 'api_key'));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('delete <key>')
    .description('Delete an API key')
    .option('-f, --format <format>', 'Output format')
    .option('--force', 'Skip confirmation')
    .action(async (key, options) => {
      const { client, format } = await createApiClient(options);
      if (!options.force) {
        console.error('Use --force to confirm deletion');
        process.exit(1);
      }
      try {
        await client.deleteApiKey(key);
        console.log(toon.formatMessage('API key deleted', true));
      } catch (err) {
        handleError(err, format);
      }
    });

  return cmd;
}
