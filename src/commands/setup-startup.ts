import { Command } from 'commander';
import { JellyfinApiClient } from '../api/client.js';
import { JellyfinApiError } from '../api/types.js';
import { formatOutput } from '../formatters/index.js';
import { getConfig } from '../utils/config.js';
import { resolveOutputFormat, type FormatOptions } from './schema-utils.js';

type SetupStartupOptions = FormatOptions & {
  name?: string | undefined;
};

export function attachSetupStartupSubcommand(cmd: Command): void {
  cmd
    .command('startup')
    .description('Inspect Jellyfin startup wizard state (read-only diagnostics)')
    .option('--name <name>', 'Server name')
    .option('-f, --format <format>', 'Output format')
    .action(async function (this: Command, options: SetupStartupOptions) {
      const config = getConfig(options.name);
      const format = resolveOutputFormat(this, options);
      if (!config.serverUrl) {
        console.error(
          formatOutput(
            { error: 'No server configured. Run: jf setup --server <url> --api-key <key>' },
            format,
            'error',
          ),
        );
        process.exit(1);
      }

      try {
        const client = new JellyfinApiClient(config);
        const warnings: string[] = [];

        const startupConfiguration = await client.getStartupConfiguration();
        const startupFirstUser = await client.getStartupFirstUser();
        let startupComplete: boolean | null = null;

        try {
          startupComplete = await client.isStartupComplete();
        } catch (err) {
          if (err instanceof JellyfinApiError && err.statusCode === 405) {
            warnings.push('startup_complete_endpoint_not_available');
          } else {
            throw err;
          }
        }

        console.log(
          formatOutput(
            {
              server_url: config.serverUrl,
              startup_complete: startupComplete,
              setup_wizard_required: startupComplete === null ? null : !startupComplete,
              configuration: {
                ui_culture: startupConfiguration.UICulture ?? null,
                metadata_country_code: startupConfiguration.MetadataCountryCode ?? null,
                preferred_metadata_language: startupConfiguration.PreferredMetadataLanguage ?? null,
              },
              first_user: {
                has_name: Boolean(startupFirstUser.Name && startupFirstUser.Name.length > 0),
                has_password: Boolean(startupFirstUser.Password && startupFirstUser.Password.length > 0),
                has_password_hint: Boolean(
                  startupFirstUser.PasswordHint && startupFirstUser.PasswordHint.length > 0,
                ),
              },
              warnings,
            },
            format,
            'setup_startup',
          ),
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Startup diagnostics failed';
        console.error(formatOutput({ error: message }, format, 'error'));
        process.exit(1);
      }
    });
}
