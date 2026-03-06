import { Command } from 'commander';
import { JellyfinApiClient } from '../api/client.js';
import { formatOutput } from '../formatters/index.js';
import { getConfig } from '../utils/config.js';
import { resolveOutputFormat, type FormatOptions } from './schema-utils.js';

type SetupStatusOptions = FormatOptions & {
  name?: string | undefined;
};

export function attachSetupStatusSubcommand(cmd: Command): void {
  cmd
    .command('status')
    .description('Check current setup status')
    .option('--name <name>', 'Server name')
    .option('-f, --format <format>', 'Output format')
    .action(async function (this: Command, options: SetupStatusOptions) {
      const config = getConfig(options.name);
      const format = resolveOutputFormat(this, options);
      if (!config.serverUrl) {
        console.log(
          formatOutput(
            {
              configured: false,
              message: 'No server configured. Run: jf setup --server <url> --api-key <key>',
            },
            format,
            'setup_status',
          ),
        );
        return;
      }

      try {
        const client = new JellyfinApiClient(config);
        const info = await client.getPublicSystemInfo();

        console.log(
          formatOutput(
            {
              configured: true,
              server_url: config.serverUrl,
              username: config.username,
              user_id: config.userId,
              output_format: config.outputFormat,
              server_name: info.ServerName,
              server_version: info.Version,
              can_connect: true,
            },
            format,
            'setup_status',
          ),
        );
      } catch (err) {
        console.log(
          formatOutput(
            {
              configured: true,
              server_url: config.serverUrl,
              username: config.username,
              can_connect: false,
              error: err instanceof Error ? err.message : 'Connection failed',
            },
            format,
            'setup_status',
          ),
        );
      }
    });
}
