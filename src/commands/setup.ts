import { Command } from 'commander';
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { Writable } from 'node:stream';
import { JellyfinApiClient, JellyfinApiError } from '../api/client.js';
import { saveConfig, getConfig, getSettingsPath, listServers } from '../utils/config.js';
import { toon } from '../formatters/index.js';
import { promptGithubStar } from '../utils/github-star.js';
import { isOutputFormat, outputFormatChoices, parseOutputFormat } from '../utils/output-format.js';
import {
  isValidServerUrl,
  maskSecret,
  quoteShellValue,
  sanitizeServerAddress,
  resolveSetupSaveServerName,
} from './setup-utils.js';
import chalk from 'chalk';

class MutedOutput extends Writable {
  private muted = false;

  public setMuted(state: boolean): void {
    this.muted = state;
  }

  public override _write(
    chunk: string | Uint8Array,
    encoding: BufferEncoding,
    callback: (error?: Error | null) => void,
  ): void {
    if (!this.muted) {
      output.write(chunk, encoding);
    }
    callback();
  }
}

async function prompt(question: string, hidden = false): Promise<string> {
  if (hidden) {
    const hiddenOutput = new MutedOutput();
    const rl = readline.createInterface({ input, output: hiddenOutput });
    process.stdout.write(question);
    hiddenOutput.setMuted(true);
    const answer = await rl.question('');
    hiddenOutput.setMuted(false);
    process.stdout.write('\n');
    rl.close();
    return answer;
  } else {
    const rl = readline.createInterface({ input, output });
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
    .option('-o, --output-format <format>', `Persist default output format (${outputFormatChoices()})`)
    .option('--timeout <ms>', 'Persist request timeout in milliseconds')
    .option('--non-interactive', 'Do not prompt for missing values')
    .action(async (options) => {
      const existingConfig = getConfig(options.name);
      let outputFormatInput = options.outputFormat as string | undefined;
      let outputFormat = parseOutputFormat(outputFormatInput, existingConfig.outputFormat ?? 'toon');
      let timeout = options.timeout ? parseInt(options.timeout, 10) : existingConfig.timeout ?? 30000;
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
      if (isInteractive && !options.outputFormat) {
        const candidate = (await prompt(`Default output format [${outputFormatChoices()}] (${outputFormat}): `)).trim();
        if (candidate.length > 0) {
          outputFormatInput = candidate;
          outputFormat = parseOutputFormat(outputFormatInput, outputFormat);
        }
      }
      if (isInteractive && !options.timeout) {
        const candidate = (await prompt(`Request timeout in ms (${timeout}): `)).trim();
        if (candidate.length > 0) {
          timeout = parseInt(candidate, 10);
        }
      }

      if (!serverUrl) {
        console.error(toon.formatError('Server URL is required. Use --server <url> or set JELLYFIN_SERVER_URL'));
        process.exit(1);
      }
      if (!isValidServerUrl(serverUrl)) {
        console.error(toon.formatError('Server URL must be a valid http(s) URL.'));
        process.exit(1);
      }
      if (outputFormatInput && !isOutputFormat(outputFormatInput)) {
        console.error(toon.formatError(`Invalid output format: ${outputFormatInput}. Use one of: ${outputFormatChoices()}`));
        process.exit(1);
      }
      if (options.timeout && (!Number.isFinite(timeout) || timeout <= 0)) {
        console.error(toon.formatError('Timeout must be a positive integer.'));
        process.exit(1);
      }
      if (apiKey && (username || password)) {
        console.error(toon.formatError('Use either API key auth OR username/password auth, not both.'));
        process.exit(1);
      }
      if ((username && !password) || (!username && password)) {
        console.error(toon.formatError('Username and password must be provided together.'));
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
            local_address: sanitizeServerAddress(publicInfo.LocalAddress),
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
          const matchedUser = username
            ? users.find((u) => u.Name?.toLowerCase() === username.toLowerCase())
            : undefined;
          const adminUser = users.find((u) => u.Policy?.IsAdministrator);
          userId = matchedUser?.Id ?? adminUser?.Id ?? users[0]?.Id ?? undefined;
          if (!username) {
            username = matchedUser?.Name ?? adminUser?.Name ?? users[0]?.Name ?? username;
          }
        }

        const newConfig = {
          serverUrl,
          apiKey,
          username,
          password,
          userId,
          outputFormat,
          timeout,
        };

        const targetServerName = resolveSetupSaveServerName(options.name, listServers());
        saveConfig(newConfig, targetServerName, options.default);

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
    .command('env')
    .description('Print environment variables from current configuration')
    .option('--name <name>', 'Server name')
    .option('--shell', 'Emit POSIX shell exports (export KEY=value)')
    .option('--show-secrets', 'Show full API key/password values')
    .action((options) => {
      const config = getConfig(options.name);
      const envValues: Record<string, string | undefined> = {
        JELLYFIN_SERVER_URL: config.serverUrl || undefined,
        JELLYFIN_API_KEY: options.showSecrets ? config.apiKey : maskSecret(config.apiKey),
        JELLYFIN_USERNAME: config.username,
        JELLYFIN_PASSWORD: options.showSecrets ? config.password : maskSecret(config.password),
        JELLYFIN_USER_ID: config.userId,
        JELLYFIN_TIMEOUT: config.timeout ? String(config.timeout) : undefined,
        JELLYFIN_OUTPUT_FORMAT: config.outputFormat,
      };

      const lines = Object.entries(envValues)
        .filter(([, value]) => value !== undefined && value !== '')
        .map(([key, value]) => {
          const safeValue = value ?? '';
          if (options.shell) {
            return `export ${key}=${quoteShellValue(safeValue)}`;
          }
          return `${key}=${safeValue}`;
        });

      console.log(lines.join('\n'));
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

  return cmd;
}
