import { Command } from 'commander';
import { JellyfinApiClient, JellyfinApiError } from '../api/client.js';
import { saveConfig, getConfig, getSettingsPath } from '../utils/config.js';
import { toon, formatSuccess } from '../formatters/index.js';

export function createSetupCommand(): Command {
  const cmd = new Command('setup');

  cmd
    .description('Interactive setup wizard for configuring the CLI')
    .option('--server <url>', 'Jellyfin server URL')
    .option('--api-key <key>', 'API key')
    .option('--username <username>', 'Username')
    .option('--password <password>', 'Password')
    .option('--name <name>', 'Server name for this config')
    .option('--default', 'Set as default server')
    .option('-f, --format <format>', 'Output format')
    .action(async (options) => {
      const format = options.format ?? 'toon';
      const existingConfig = getConfig(options.name);

      const serverUrl = options.server ?? existingConfig.serverUrl;
      
      if (!serverUrl) {
        console.error(toon.formatError('Server URL is required. Use --server <url> or set JELLYFIN_SERVER_URL'));
        process.exit(1);
      }

      let apiKey = options.apiKey ?? existingConfig.apiKey;
      let userId = existingConfig.userId;
      let username = options.username ?? existingConfig.username;
      const password = options.password ?? existingConfig.password;

      const client = new JellyfinApiClient({ serverUrl, timeout: 10000 });

      try {
        const publicInfo = await client.getPublicSystemInfo();
        
        if (options.format === 'toon' || !options.format) {
          console.log(toon.formatToon({
            server_name: publicInfo.ServerName,
            version: publicInfo.Version,
            server_id: publicInfo.Id,
            local_address: publicInfo.LocalAddress,
          }, 'setup_server_detected'));
        }

        if (!apiKey && username && password) {
          const authClient = new JellyfinApiClient({ serverUrl });
          try {
            const user = await authClient.authenticate(username, password);
            userId = user.Id ?? undefined;
            apiKey = undefined;
          } catch (authErr) {
            console.error(toon.formatError('Authentication failed. Check username and password.'));
            process.exit(1);
          }
        } else if (!apiKey && !username) {
          console.error(toon.formatError('Either --api-key or --username/--password is required'));
          process.exit(1);
        }

        const testClient = new JellyfinApiClient({
          serverUrl,
          apiKey,
          userId,
        });

        if (!apiKey && username && password) {
          await testClient.authenticate(username, password);
        }

        const users = await testClient.getUsers();
        if (!userId && users.length > 0) {
          const adminUser = users.find((u) => u.Policy?.IsAdministrator);
          userId = adminUser?.Id ?? users[0]?.Id ?? undefined;
          username = adminUser?.Name ?? users[0]?.Name ?? username;
        }

        const newConfig = {
          serverUrl,
          apiKey,
          username,
          password,
          userId,
          outputFormat: existingConfig.outputFormat ?? 'toon',
          timeout: existingConfig.timeout ?? 30000,
        };

        saveConfig(newConfig, options.name, options.default);

        const result = {
          config_path: getSettingsPath(),
          server_url: serverUrl,
          username,
          user_id: userId,
          has_api_key: !!apiKey,
          has_password: !!password,
          output_format: newConfig.outputFormat,
          server_name: publicInfo.ServerName,
          server_version: publicInfo.Version,
          setup_complete: true,
        };

        console.log(toon.formatToon(result, 'setup_complete'));

      } catch (err) {
        const message = err instanceof JellyfinApiError ? err.message : 'Setup failed';
        console.error(toon.formatError(message));
        process.exit(1);
      }
    });

  cmd
    .command('status')
    .description('Check current setup status')
    .option('--name <name>', 'Server name')
    .option('-f, --format <format>', 'Output format')
    .action(async (options) => {
      const config = getConfig(options.name);
      const format = options.format ?? config.outputFormat ?? 'toon';

      if (!config.serverUrl) {
        console.log(toon.formatToon({
          configured: false,
          message: 'No server configured. Run: jf setup --server <url> --api-key <key>',
        }, 'setup_status'));
        return;
      }

      try {
        const client = new JellyfinApiClient(config);
        const info = await client.getPublicSystemInfo();

        console.log(toon.formatToon({
          configured: true,
          server_url: config.serverUrl,
          username: config.username,
          user_id: config.userId,
          has_api_key: !!config.apiKey,
          output_format: config.outputFormat,
          server_name: info.ServerName,
          server_version: info.Version,
          can_connect: true,
        }, 'setup_status'));
      } catch (err) {
        console.log(toon.formatToon({
          configured: true,
          server_url: config.serverUrl,
          username: config.username,
          can_connect: false,
          error: err instanceof Error ? err.message : 'Connection failed',
        }, 'setup_status'));
      }
    });

  cmd
    .command('env')
    .description('Show environment variable names for configuration')
    .action(() => {
      console.log(toon.formatToon({
        JELLYFIN_SERVER_URL: 'Server URL',
        JELLYFIN_API_KEY: 'API key for authentication',
        JELLYFIN_USERNAME: 'Username for authentication',
        JELLYFIN_PASSWORD: 'Password for authentication',
        JELLYFIN_USER_ID: 'User ID',
        JELLYFIN_TIMEOUT: 'Request timeout in milliseconds',
        JELLYFIN_OUTPUT_FORMAT: 'Output format (toon, json, table, raw)',
      }, 'environment_variables'));
    });

  return cmd;
}
