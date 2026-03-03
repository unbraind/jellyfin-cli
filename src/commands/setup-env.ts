import { Command } from 'commander';
import { formatOutput } from '../formatters/index.js';
import { getConfig } from '../utils/config.js';
import { maskSecret, quoteShellValue } from './setup-utils.js';
import { resolveOutputFormat, type FormatOptions } from './schema-utils.js';

type SetupEnvOptions = FormatOptions & {
  name?: string | undefined;
  shell?: boolean | undefined;
  showSecrets?: boolean | undefined;
};

function hasExplicitFormatOption(command: Command): boolean {
  const localSource = command.getOptionValueSource('format');
  if (localSource && localSource !== 'default') {
    return true;
  }

  let parent: Command | null = command.parent;
  while (parent) {
    const source = parent.getOptionValueSource('format');
    if (source && source !== 'default') {
      return true;
    }
    parent = parent.parent;
  }

  return false;
}

export function attachSetupEnvSubcommand(cmd: Command): void {
  cmd
    .command('env')
    .description('Print environment variables from current configuration')
    .option('--name <name>', 'Server name')
    .option('--shell', 'Emit POSIX shell exports (export KEY=value)')
    .option('--show-secrets', 'Show full API key/password values')
    .option('-f, --format <format>', 'Output format for structured output')
    .action(function (this: Command, options: SetupEnvOptions) {
      const config = getConfig(options.name);
      const masked = !options.showSecrets;
      const envValues: Record<string, string | undefined> = {
        JELLYFIN_SERVER_URL: config.serverUrl || undefined,
        JELLYFIN_API_KEY: masked ? maskSecret(config.apiKey) : config.apiKey,
        JELLYFIN_USERNAME: config.username,
        JELLYFIN_PASSWORD: masked ? maskSecret(config.password) : config.password,
        JELLYFIN_USER_ID: config.userId,
        JELLYFIN_TIMEOUT: config.timeout ? String(config.timeout) : undefined,
        JELLYFIN_OUTPUT_FORMAT: config.outputFormat,
      };

      const filteredEntries = Object.entries(envValues).filter(([, value]) => value !== undefined && value !== '');
      if (options.shell) {
        const lines = filteredEntries.map(([key, value]) => `export ${key}=${quoteShellValue(value ?? '')}`);
        console.log(lines.join('\n'));
        return;
      }

      if (hasExplicitFormatOption(this)) {
        const outputFormat = resolveOutputFormat(this, options);
        const variables = Object.fromEntries(filteredEntries);
        console.log(
          formatOutput(
            {
              masked,
              server_name: options.name ?? null,
              variable_count: filteredEntries.length,
              variables,
            },
            outputFormat,
            'setup_env',
          ),
        );
        return;
      }

      const lines = filteredEntries.map(([key, value]) => `${key}=${value ?? ''}`);
      console.log(lines.join('\n'));
    });
}
