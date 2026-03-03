import { Command } from 'commander';
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { JellyfinApiClient, JellyfinApiError } from '../api/client.js';
import { saveConfig, getConfig, getSettingsPath } from '../utils/config.js';
import { toon } from '../formatters/index.js';
import { promptGithubStar } from '../utils/github-star.js';
import chalk from 'chalk';

async function prompt(question: string, hidden = false): Promise<string> {
  const rl = readline.createInterface({ input, output });
  if (hidden) {
    // Mute output for password (basic implementation)
    let isMuted = false;
    // @ts-expect-error - hacking the output stream for simple hidden input
    const originalWrite = rl.output.write.bind(rl.output);
    // @ts-expect-error - hacking the output stream for simple hidden input
    rl.output.write = (data: string | Buffer, ...args: unknown[]) => {
      if (!isMuted) return originalWrite(data, ...args);
      return true;
    };
    process.stdout.write(question);
    isMuted = true;
    const answer = await rl.question('');
    isMuted = false;
    process.stdout.write('\n');
    rl.close();
    return answer;
  } else {
    const answer = await rl.question(question);
    rl.close();
    return answer;
  }
}

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
    .option('--non-interactive', 'Do not prompt for missing values')
    .action(async (options) => {
      const existingConfig = getConfig(options.name);
      let serverUrl = options.server ?? existingConfig.serverUrl;
      let apiKey = options.apiKey ?? existingConfig.apiKey;
      let username = options.username ?? existingConfig.username;
      let password = options.password ?? existingConfig.password;
      let userId = existingConfig.userId;

      const isInteractive = !options.nonInteractive && process.stdin.isTTY;

      if (!serverUrl && isInteractive) {
        console.log(chalk.cyan('\n🧙 Jellyfin CLI Setup Wizard\n'));
        serverUrl = await prompt('Enter Jellyfin server URL (e.g., http://192.168.1.100:8096): ');
      }

      if (!serverUrl) {
        console.error(toon.formatError('Server URL is required. Use --server <url> or set JELLYFIN_SERVER_URL'));
        process.exit(1);
      }

      const client = new JellyfinApiClient({ serverUrl, timeout: 10000 });
      let publicInfo;

      try {
        publicInfo = await client.getPublicSystemInfo();
        if (options.format === 'toon' || !options.format) {
          console.log(toon.formatToon({
            server_name: publicInfo.ServerName,
            version: publicInfo.Version,
            server_id: publicInfo.Id,
            local_address: publicInfo.LocalAddress,
          }, 'setup_server_detected'));
        }
      } catch (err) {
        console.error(toon.formatError(`Could not connect to server at ${serverUrl}`));
        process.exit(1);
      }

      if (!apiKey && !username && !password && isInteractive) {
        const authMethod = await prompt('Authentication method [1] Username/Password [2] API Key (1/2): ');
        if (authMethod === '2') {
          apiKey = await prompt('Enter API Key: ', true);
        } else {
          username = await prompt('Enter Username: ');
          password = await prompt('Enter Password: ', true);
        }
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

      try {
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
        await promptGithubStar();

      } catch (err) {
        const message = err instanceof JellyfinApiError ? err.message : 'Setup validation failed. API Key might be invalid.';
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
        await promptGithubStar();
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
        JELLYFIN_OUTPUT_FORMAT: 'Output format (toon, json, table, raw, yaml, markdown)',
      }, 'environment_variables'));
    });

  return cmd;
}
