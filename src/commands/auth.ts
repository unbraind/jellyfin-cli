import { Command } from 'commander';
import { createApiClient, handleError } from './utils.js';
import { toon } from '../formatters/index.js';

export function createAuthCommand(): Command {
  const cmd = new Command('auth');
  cmd.description('Authentication provider management');

  cmd.command('providers')
    .description('List authentication providers')
    .option('-f, --format <format>', 'Output format')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const providers = await client.getAuthProviders();
        console.log(toon.formatToon(providers.map((p) => ({
          id: p.Id,
          name: p.Name,
        })), 'auth_providers'));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('password-reset-providers')
    .description('List password reset providers')
    .option('-f, --format <format>', 'Output format')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const providers = await client.getPasswordResetProviders();
        console.log(toon.formatToon(providers.map((p) => ({
          id: p.Id,
          name: p.Name,
        })), 'password_reset_providers'));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('keys')
    .description('List API keys (read-only alias for auth key inventory)')
    .option('-f, --format <format>', 'Output format')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const result = await client.getApiKeys();
        console.log(toon.formatToon((result.Items ?? []).map((entry) => ({
          app_name: entry.AppName,
          key: entry.AccessToken,
          created: entry.DateCreated,
          last_activity: entry.DateLastActivity,
          is_active: entry.IsActive,
        })), 'api_keys'));
      } catch (err) { handleError(err, format); }
    });

  return cmd;
}
