import { Command } from 'commander';
import { JellyfinApiClient, JellyfinApiError } from '../api/client.js';
import { getConfig, saveConfig, getSettingsPath, listServers, setCurrentServer, deleteServer, writeSettingsFile } from '../utils/config.js';
import { formatSuccess, formatError, toon } from '../formatters/index.js';
import type { OutputFormat } from '../types/index.js';
import { promptGithubStar } from '../utils/github-star.js';

export function createConfigCommand(): Command {
  const cmd = new Command('config');

  cmd
    .description('Manage CLI configuration')
    .command('set')
    .description('Set configuration values')
    .option('-s, --server <url>', 'Jellyfin server URL')
    .option('-k, --api-key <key>', 'API key')
    .option('-u, --username <username>', 'Username')
    .option('-p, --password <password>', 'Password')
    .option('--user-id <id>', 'User ID')
    .option('-o, --output-format <format>', 'Default output format (toon, json, table, raw)')
    .option('--timeout <ms>', 'Request timeout in milliseconds')
    .option('--name <name>', 'Server name for this config')
    .option('--default', 'Set as default server')
    .action(async (options) => {
      const config = getConfig(options.name);
      const format = config.outputFormat ?? 'toon';

      if (!options.server && !options.apiKey && !options.username && !options.password && !options.userId && !options.outputFormat && !options.timeout) {
        console.error(formatError('No configuration values provided', format));
        process.exit(1);
      }

      const newConfig = {
        serverUrl: options.server ?? config.serverUrl,
        apiKey: options.apiKey ?? config.apiKey,
        username: options.username ?? config.username,
        password: options.password ?? config.password,
        userId: options.userId ?? config.userId,
        outputFormat: (options.outputFormat as OutputFormat) ?? config.outputFormat,
        timeout: options.timeout ? parseInt(options.timeout, 10) : config.timeout,
      };

      if (!newConfig.serverUrl) {
        console.error(formatError('Server URL is required', format));
        process.exit(1);
      }

      if (options.username && options.password && !options.userId) {
        try {
          const client = new JellyfinApiClient(newConfig);
          const user = await client.authenticate(options.username, options.password);
          newConfig.userId = user.Id ?? undefined;
        } catch (err) {
          const message = err instanceof JellyfinApiError ? err.message : 'Authentication failed';
          console.error(formatError(message, format));
          process.exit(1);
        }
      }

      saveConfig(newConfig, options.name, options.default);
      console.log(formatSuccess(`Configuration saved to ${getSettingsPath()}`, format));
      await promptGithubStar();
    });

  cmd
    .command('get')
    .description('Display current configuration')
    .option('--name <name>', 'Server name')
    .action((options) => {
      const config = getConfig(options.name);
      console.log(toon.formatConfig(config));
    });

  cmd
    .command('path')
    .description('Show configuration file path')
    .action(() => {
      console.log(getSettingsPath());
    });

  cmd
    .command('list')
    .description('List all configured servers')
    .action(() => {
      const servers = listServers();
      console.log(toon.formatServers(servers));
    });

  cmd
    .command('use <name>')
    .description('Switch to a named server configuration')
    .action((name) => {
      const success = setCurrentServer(name);
      if (success) {
        console.log(toon.formatMessage(`Switched to server: ${name}`, true));
      } else {
        console.error(formatError(`Server '${name}' not found`, 'toon'));
        process.exit(1);
      }
    });

  cmd
    .command('delete <name>')
    .description('Delete a server configuration')
    .option('--force', 'Skip confirmation')
    .action((name, options) => {
      if (!options.force) {
        console.error('Use --force to confirm deletion');
        process.exit(1);
      }
      const success = deleteServer(name);
      if (success) {
        console.log(toon.formatMessage(`Server '${name}' deleted`, true));
      } else {
        console.error(formatError(`Server '${name}' not found`, 'toon'));
        process.exit(1);
      }
    });

  cmd
    .command('reset')
    .description('Reset all configuration (clear settings file)')
    .option('--force', 'Skip confirmation')
    .action((options) => {
      if (!options.force) {
        console.error('Use --force to confirm reset');
        process.exit(1);
      }
      writeSettingsFile({});
      console.log(toon.formatMessage('Configuration reset', true));
    });

  cmd
    .command('test')
    .description('Test connection to Jellyfin server')
    .option('--name <name>', 'Server name')
    .action(async (options) => {
      const config = getConfig(options.name);
      const format = config.outputFormat ?? 'toon';

      if (!config.serverUrl) {
        console.error(formatError('No server URL configured', format));
        process.exit(1);
      }

      try {
        const client = new JellyfinApiClient(config);
        const info = await client.getPublicSystemInfo();
        console.log(toon.formatSystemInfo(info));
        await promptGithubStar();
      } catch (err) {
        const message = err instanceof JellyfinApiError ? err.message : 'Connection failed';
        console.error(formatError(message, format));
        process.exit(1);
      }
    });

  return cmd;
}
