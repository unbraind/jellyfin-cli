import { Command } from 'commander';
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { Writable } from 'node:stream';
import { JellyfinApiClient, JellyfinApiError } from '../api/client.js';
import { saveConfig, getConfig, getSettingsPath, listServers } from '../utils/config.js';
import { formatOutput } from '../formatters/index.js';
import { promptGithubStar } from '../utils/github-star.js';
import { isOutputFormat, outputFormatChoices, parseOutputFormat } from '../utils/output-format.js';
import {
  isValidServerUrl,
  sanitizeServerAddress,
  resolveSetupSaveServerName,
} from './setup-utils.js';
import chalk from 'chalk';
import { resolveOutputFormat, type FormatOptions } from './schema-utils.js';
import { attachSetupEnvSubcommand } from './setup-env.js';
import { attachSetupStatusSubcommand } from './setup-status.js';
import { attachSetupStartupSubcommand } from './setup-startup.js';

type SetupCommandOptions = FormatOptions & {
  apiKey?: string | undefined;
  default?: boolean | undefined;
  name?: string | undefined;
  nonInteractive?: boolean | undefined;
  outputFormat?: string | undefined;
  password?: string | undefined;
  server?: string | undefined;
  timeout?: string | undefined;
  username?: string | undefined;
};

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
    .action(async function (this: Command, options: SetupCommandOptions) {
      const existingConfig = getConfig(options.name);
      const runtimeFormat = resolveOutputFormat(this, options);
      let outputFormatInput = options.outputFormat;
      let persistedOutputFormat = parseOutputFormat(outputFormatInput, existingConfig.outputFormat ?? 'toon');
      let timeout = options.timeout ? parseInt(options.timeout, 10) : existingConfig.timeout ?? 30000;
      let serverUrl = options.server ?? existingConfig.serverUrl;
      let apiKey = options.apiKey ?? existingConfig.apiKey;
      let username = options.username ?? existingConfig.username;
      let password = options.password ?? existingConfig.password;
      let userId = existingConfig.userId;
      const hasExplicitPassword = typeof options.password === 'string' && options.password.length > 0;

      // API key auth should not fail because of an inherited saved password.
      // Preserve explicit password intent to allow username/password setup flows.
      const hasResolvedApiKey = typeof apiKey === 'string' && apiKey.length > 0;
      const hasResolvedPassword = typeof password === 'string' && password.length > 0;
      if (hasResolvedApiKey && hasResolvedPassword && !hasExplicitPassword) {
        password = undefined;
      }

      const isInteractive = !options.nonInteractive && process.stdin.isTTY;

      if (!serverUrl && isInteractive) {
        console.log(chalk.cyan('\n🧙 Jellyfin CLI Setup Wizard\n'));
        serverUrl = await prompt('Enter Jellyfin server URL (e.g., http://192.168.1.100:8096): ');
      }
      if (isInteractive && !options.outputFormat) {
        const candidate = (
          await prompt(`Default output format [${outputFormatChoices()}] (${persistedOutputFormat}): `)
        ).trim();
        if (candidate.length > 0) {
          outputFormatInput = candidate;
          persistedOutputFormat = parseOutputFormat(outputFormatInput, persistedOutputFormat);
        }
      }
      if (isInteractive && !options.timeout) {
        const candidate = (await prompt(`Request timeout in ms (${timeout}): `)).trim();
        if (candidate.length > 0) {
          timeout = parseInt(candidate, 10);
        }
      }

      if (!serverUrl) {
        console.error(
          formatOutput(
            { error: 'Server URL is required. Use --server <url> or set JELLYFIN_SERVER_URL' },
            runtimeFormat,
            'error',
          ),
        );
        process.exit(1);
      }
      if (!isValidServerUrl(serverUrl)) {
        console.error(formatOutput({ error: 'Server URL must be a valid http(s) URL.' }, runtimeFormat, 'error'));
        process.exit(1);
      }
      if (outputFormatInput && !isOutputFormat(outputFormatInput)) {
        console.error(
          formatOutput(
            { error: `Invalid output format: ${outputFormatInput}. Use one of: ${outputFormatChoices()}` },
            runtimeFormat,
            'error',
          ),
        );
        process.exit(1);
      }
      if (options.timeout && (!Number.isFinite(timeout) || timeout <= 0)) {
        console.error(formatOutput({ error: 'Timeout must be a positive integer.' }, runtimeFormat, 'error'));
        process.exit(1);
      }
      if (apiKey && password) {
        console.error(
          formatOutput(
            { error: 'Do not combine --api-key with --password. Use either API key or username/password auth.' },
            runtimeFormat,
            'error',
          ),
        );
        process.exit(1);
      }
      if (!apiKey && ((username && !password) || (!username && password))) {
        console.error(
          formatOutput({ error: 'Username and password must be provided together.' }, runtimeFormat, 'error'),
        );
        process.exit(1);
      }

      const client = new JellyfinApiClient({ serverUrl, timeout: 10000 });
      let publicInfo;

      try {
        publicInfo = await client.getPublicSystemInfo();
        console.log(
          formatOutput(
            {
            server_name: publicInfo.ServerName,
            version: publicInfo.Version,
            server_id: publicInfo.Id,
            local_address: sanitizeServerAddress(publicInfo.LocalAddress),
            },
            runtimeFormat,
            'setup_server_detected',
          ),
        );
      } catch (err) {
        console.error(
          formatOutput({ error: `Could not connect to server at ${serverUrl}` }, runtimeFormat, 'error'),
        );
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
          console.error(
            formatOutput({ error: 'Authentication failed. Check username and password.' }, runtimeFormat, 'error'),
          );
          process.exit(1);
        }
      } else if (!apiKey && !username) {
        console.error(
          formatOutput(
            { error: 'Either --api-key or --username/--password is required' },
            runtimeFormat,
            'error',
          ),
        );
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
          const usernameLower = typeof username === 'string' ? username.toLowerCase() : undefined;
          const matchedUser = username
            ? users.find((u) => u.Name?.toLowerCase() === usernameLower)
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
          outputFormat: persistedOutputFormat,
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
          output_format: persistedOutputFormat,
          server_name: publicInfo.ServerName,
          server_version: publicInfo.Version,
          setup_complete: true,
        };

        console.log(formatOutput(result, runtimeFormat, 'setup_complete'));
        await promptGithubStar();

      } catch (err) {
        const message = err instanceof JellyfinApiError ? err.message : 'Setup validation failed. API Key might be invalid.';
        console.error(formatOutput({ error: message }, runtimeFormat, 'error'));
        process.exit(1);
      }
    });

  attachSetupEnvSubcommand(cmd);
  attachSetupStatusSubcommand(cmd);
  attachSetupStartupSubcommand(cmd);

  return cmd;
}
