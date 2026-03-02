import { Command } from 'commander';
import { createApiClient, handleError } from './utils.js';
import { toon } from '../formatters/index.js';

export function createPluginsCommand(): Command {
  const cmd = new Command('plugins');

  cmd
    .command('list')
    .description('List all installed plugins')
    .option('-f, --format <format>', 'Output format')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const plugins = await client.getPlugins();
        const simplified = plugins.map((p) => ({
          id: p.Id,
          name: p.Name,
          version: p.Version,
          status: p.Status,
          description: p.Description?.slice(0, 100),
          can_uninstall: p.CanUninstall,
        }));
        console.log(toon.formatToon(simplified, 'plugins'));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('get <pluginId>')
    .description('Get plugin details')
    .option('-f, --format <format>', 'Output format')
    .action(async (pluginId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        const plugin = await client.getPlugin(pluginId);
        const simplified = {
          id: plugin.Id,
          name: plugin.Name,
          version: plugin.Version,
          status: plugin.Status,
          description: plugin.Description,
          can_uninstall: plugin.CanUninstall,
          has_image: plugin.HasImage,
          configuration_file: plugin.ConfigurationFileName,
          data_path: plugin.DataFolderPath,
        };
        console.log(toon.formatToon(simplified, 'plugin'));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('config <pluginId>')
    .description('Get plugin configuration')
    .option('-f, --format <format>', 'Output format')
    .action(async (pluginId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        const config = await client.getPluginConfiguration(pluginId);
        console.log(toon.formatToon(config, 'plugin_config'));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('uninstall <pluginId>')
    .description('Uninstall a plugin')
    .option('-f, --format <format>', 'Output format')
    .option('--force', 'Skip confirmation')
    .action(async (pluginId, options) => {
      const { client, format } = await createApiClient(options);
      if (!options.force) {
        console.error('Use --force to confirm uninstall');
        process.exit(1);
      }
      try {
        await client.uninstallPlugin(pluginId);
        console.log(toon.formatMessage('Plugin uninstalled', true));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('enable <pluginId> <version>')
    .description('Enable a disabled plugin by ID and version')
    .option('-f, --format <format>', 'Output format')
    .action(async (pluginId, version, options) => {
      const { client, format } = await createApiClient(options);
      try {
        await client.enablePlugin(pluginId, version);
        console.log(toon.formatMessage(`Plugin ${pluginId} v${version} enabled`, true));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('disable <pluginId> <version>')
    .description('Disable a plugin by ID and version (without uninstalling)')
    .option('-f, --format <format>', 'Output format')
    .action(async (pluginId, version, options) => {
      const { client, format } = await createApiClient(options);
      try {
        await client.disablePlugin(pluginId, version);
        console.log(toon.formatMessage(`Plugin ${pluginId} v${version} disabled`, true));
      } catch (err) {
        handleError(err, format);
      }
    });

  return cmd;
}
