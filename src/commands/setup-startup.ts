import { Command } from 'commander';
import { JellyfinApiClient } from '../api/client.js';
import { JellyfinApiError } from '../api/types.js';
import { formatOutput } from '../formatters/index.js';
import { getConfig } from '../utils/config.js';
import { resolveOutputFormat, type FormatOptions } from './schema-utils.js';

type SetupStartupOptions = FormatOptions & {
  name?: string | undefined;
};

type SetupUpdateConfigurationOptions = SetupStartupOptions & {
  metadataCountryCode?: string | undefined;
  preferredMetadataLanguage?: string | undefined;
  uiCulture?: string | undefined;
};

async function runStartupDiagnostics(thisCommand: Command, options: SetupStartupOptions): Promise<void> {
  const config = getConfig(options.name);
  const format = resolveOutputFormat(thisCommand, options);
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
          startup_complete_state:
            startupComplete === null ? 'unknown' : startupComplete ? 'complete' : 'required',
          startup_complete: startupComplete,
          setup_wizard_required: startupComplete === null ? null : !startupComplete,
          configuration: {
            ui_culture: startupConfiguration.UICulture ?? null,
            metadata_country_code: startupConfiguration.MetadataCountryCode ?? null,
            preferred_metadata_language: startupConfiguration.PreferredMetadataLanguage ?? null,
          },
          first_user: {
            has_name: Boolean(startupFirstUser.Name && startupFirstUser.Name.length > 0),
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
}

export function attachSetupStartupSubcommand(cmd: Command): void {
  cmd
    .command('startup')
    .description('Inspect Jellyfin startup wizard state (read-only diagnostics)')
    .option('--name <name>', 'Server name')
    .option('-f, --format <format>', 'Output format')
    .action(async function (this: Command, options: SetupStartupOptions) {
      await runStartupDiagnostics(this, options);
    });

  cmd
    .command('configuration')
    .description('Alias of setup startup for endpoint-aligned startup configuration diagnostics')
    .option('--name <name>', 'Server name')
    .option('-f, --format <format>', 'Output format')
    .action(async function (this: Command, options: SetupStartupOptions) {
      await runStartupDiagnostics(this, options);
    });

  cmd
    .command('update-configuration')
    .description('Update startup wizard configuration (POST /Startup/Configuration)')
    .option('--name <name>', 'Server name')
    .option('--ui-culture <culture>', 'UI culture (for example en-US)')
    .option('--metadata-country-code <code>', 'Metadata country code (for example US)')
    .option('--preferred-metadata-language <language>', 'Preferred metadata language (for example en)')
    .option('-f, --format <format>', 'Output format')
    .action(async function (this: Command, options: SetupUpdateConfigurationOptions) {
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

      const hasPayload = Boolean(
        options.uiCulture || options.metadataCountryCode || options.preferredMetadataLanguage,
      );
      if (!hasPayload) {
        console.error(
          formatOutput(
            {
              error:
                'At least one option is required: --ui-culture, --metadata-country-code, --preferred-metadata-language',
            },
            format,
            'error',
          ),
        );
        process.exit(1);
      }

      try {
        const client = new JellyfinApiClient(config);
        await client.updateStartupConfiguration({
          UICulture: options.uiCulture,
          MetadataCountryCode: options.metadataCountryCode,
          PreferredMetadataLanguage: options.preferredMetadataLanguage,
        });

        console.log(
          formatOutput(
            {
              server_url: config.serverUrl,
              updated: true,
              configuration: {
                ui_culture: options.uiCulture ?? null,
                metadata_country_code: options.metadataCountryCode ?? null,
                preferred_metadata_language: options.preferredMetadataLanguage ?? null,
              },
            },
            format,
            'setup_startup_configuration_updated',
          ),
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Startup configuration update failed';
        console.error(formatOutput({ error: message }, format, 'error'));
        process.exit(1);
      }
    });
}
