import { Command } from 'commander';
import { JellyfinApiClient, JellyfinApiError } from '../api/client.js';
import { getConfig, saveConfig, getSettingsPath, listServers, setCurrentServer, deleteServer, writeSettingsFile } from '../utils/config.js';
import { formatSuccess, formatError, formatOutput, toon } from '../formatters/index.js';
import { outputFormatChoices, parseOutputFormat } from '../utils/output-format.js';
import { promptGithubStar } from '../utils/github-star.js';
import { addConfigDoctorCommand } from './config-doctor.js';
import { resolveOutputFormat, type FormatOptions } from './schema-utils.js';
import type { JellyfinConfig, OutputFormat } from '../types/index.js';

function resolveConfigSaveServerName(explicitName: string | undefined): string | undefined {
  if (explicitName && explicitName.trim().length > 0) {
    return explicitName;
  }

  const activeNamed = listServers().find((server) => server.isDefault && server.name !== 'default');
  return activeNamed?.name;
}

type ConfigCommandOptions = FormatOptions & {
  name?: string | undefined;
};

function resolveConfigRuntimeFormat(thisCommand: Command, options: ConfigCommandOptions): OutputFormat {
  const fallback = getConfig(options.name).outputFormat ?? 'toon';
  return resolveOutputFormat(thisCommand, { format: options.format ?? fallback });
}

function toSafeConfig(config: JellyfinConfig): Record<string, unknown> {
  return {
    server_url: config.serverUrl,
    username: config.username ?? null,
    user_id: config.userId ?? null,
    output_format: config.outputFormat,
    timeout: config.timeout,
  };
}

function printConfigPayload(data: Record<string, unknown>, format: OutputFormat, typeHint: string): void {
  if (format === 'toon') {
    console.log(toon.formatToon(data, typeHint));
    return;
  }
  console.log(formatOutput(data, format, typeHint));
}

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
    .option('-o, --output-format <format>', `Default output format (${outputFormatChoices()})`)
    .option('--timeout <ms>', 'Request timeout in milliseconds')
    .option('--name <name>', 'Server name for this config')
    .option('--default', 'Set as default server')
    .option('-f, --format <format>', 'Output format')
    .action(async function (this: Command, options: ConfigCommandOptions & {
      server?: string | undefined;
      apiKey?: string | undefined;
      username?: string | undefined;
      password?: string | undefined;
      userId?: string | undefined;
      outputFormat?: string | undefined;
      timeout?: string | undefined;
      default?: boolean | undefined;
    }) {
      const config = getConfig(options.name);
      const format = resolveConfigRuntimeFormat(this, options);
      const providedTimeout = options.timeout ? parseInt(options.timeout, 10) : undefined;
      const timeout = providedTimeout ?? config.timeout;
      const outputFormat = parseOutputFormat(options.outputFormat, config.outputFormat ?? 'toon');

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
        outputFormat,
        timeout,
      };

      if (!newConfig.serverUrl) {
        console.error(formatError('Server URL is required', format));
        process.exit(1);
      }
      if (options.outputFormat && outputFormat !== options.outputFormat) {
        console.error(formatError(`Invalid output format: ${options.outputFormat}. Use one of: ${outputFormatChoices()}`, format));
        process.exit(1);
      }
      if (
        options.timeout &&
        (providedTimeout === undefined || !Number.isFinite(providedTimeout) || providedTimeout <= 0)
      ) {
        console.error(formatError('Timeout must be a positive integer', format));
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

      const targetServerName = resolveConfigSaveServerName(options.name);
      saveConfig(newConfig, targetServerName, options.default);
      console.log(formatSuccess(`Configuration saved to ${getSettingsPath()}`, format));
      await promptGithubStar();
    });

  cmd
    .command('get')
    .description('Display current configuration')
    .option('--name <name>', 'Server name')
    .option('-f, --format <format>', 'Output format')
    .action(function (this: Command, options: ConfigCommandOptions) {
      const config = getConfig(options.name);
      const format = resolveConfigRuntimeFormat(this, options);
      if (format === 'toon') {
        console.log(toon.formatConfig(config));
        return;
      }
      printConfigPayload(toSafeConfig(config), format, 'config');
    });

  cmd
    .command('path')
    .description('Show configuration file path')
    .option('-f, --format <format>', 'Output format')
    .action(function (this: Command, options: ConfigCommandOptions) {
      const path = getSettingsPath();
      const format = resolveConfigRuntimeFormat(this, options);
      if (format === 'toon') {
        console.log(path);
        return;
      }
      printConfigPayload({ config_path: path }, format, 'config_path');
    });

  cmd
    .command('list')
    .description('List all configured servers')
    .option('-f, --format <format>', 'Output format')
    .action(function (this: Command, options: ConfigCommandOptions) {
      const servers = listServers();
      const format = resolveConfigRuntimeFormat(this, options);
      if (format === 'toon') {
        console.log(toon.formatServers(servers));
        return;
      }
      printConfigPayload(
        {
          servers: servers.map((server) => ({
            name: server.name,
            server_url: server.config.serverUrl,
            username: server.config.username ?? null,
            is_default: server.isDefault,
          })),
        },
        format,
        'servers',
      );
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
    .option('-f, --format <format>', 'Output format')
    .action(async function (this: Command, options: ConfigCommandOptions) {
      const config = getConfig(options.name);
      const format = resolveConfigRuntimeFormat(this, options);

      if (!config.serverUrl) {
        console.error(formatError('No server URL configured', format));
        process.exit(1);
      }

      try {
        const client = new JellyfinApiClient(config);
        const info = await client.getPublicSystemInfo();
        if (format === 'toon') {
          console.log(toon.formatSystemInfo(info));
        } else {
          printConfigPayload(
            {
              server_name: info.ServerName,
              version: info.Version,
              server_id: info.Id,
              local_address: info.LocalAddress ?? null,
            },
            format,
            'system_info',
          );
        }
        await promptGithubStar();
      } catch (err) {
        const message = err instanceof JellyfinApiError ? err.message : 'Connection failed';
        console.error(formatError(message, format));
        process.exit(1);
      }
    });

  addConfigDoctorCommand(cmd);

  return cmd;
}
