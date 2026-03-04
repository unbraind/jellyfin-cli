import { Command } from 'commander';
import { chmodSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { formatOutput } from '../formatters/index.js';
import { getConfig } from '../utils/config.js';
import { maskSecret, quoteShellValue } from './setup-utils.js';
import { resolveOutputFormat, type FormatOptions } from './schema-utils.js';

type SetupEnvOptions = FormatOptions & {
  name?: string | undefined;
  shell?: boolean | undefined;
  showSecrets?: boolean | undefined;
  writeFile?: string | undefined;
};

function writeEnvFile(path: string, lines: string[]): string {
  const resolvedPath = resolve(path);
  const content = `${lines.join('\n')}\n`;
  writeFileSync(resolvedPath, content, { encoding: 'utf-8', mode: 0o600 });
  try {
    chmodSync(resolvedPath, 0o600);
  } catch {
    // Best-effort hardening (e.g. unsupported chmod on platform/fs).
  }
  return resolvedPath;
}

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
    .option('--write-file <path>', 'Write rendered env output to a file (mode 0600)')
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
      const lines = options.shell
        ? filteredEntries.map(([key, value]) => `export ${key}=${quoteShellValue(value ?? '')}`)
        : filteredEntries.map(([key, value]) => `${key}=${value ?? ''}`);

      if (options.writeFile) {
        const wroteTo = writeEnvFile(options.writeFile, lines);
        const outputFormat = resolveOutputFormat(this, options);
        console.log(
          formatOutput(
            {
              masked,
              shell: options.shell === true,
              server_name: options.name ?? null,
              variable_count: filteredEntries.length,
              line_count: lines.length,
              wrote_to: wroteTo,
            },
            outputFormat,
            'setup_env_file',
          ),
        );
        return;
      }

      if (options.shell) {
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
      console.log(lines.join('\n'));
    });
}
