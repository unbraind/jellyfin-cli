import { Command } from 'commander';
import { createApiClient, handleError } from './utils.js';
import { toon } from '../formatters/index.js';

export function createQuickConnectCommand(): Command {
  const cmd = new Command('quickconnect');

  cmd.command('status').description('Check if Quick Connect is enabled')
    .option('-f, --format <format>', 'Output format')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const enabled = await client.quickConnectEnabled();
        console.log(toon.formatToon({ enabled }, 'quickconnect_status'));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('init').description('Initialize Quick Connect')
    .option('-f, --format <format>', 'Output format')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const result = await client.quickConnectInitiate();
        console.log(toon.formatToon({
          secret: result.Secret,
          code: result.Code,
          device_id: result.DeviceId,
          date_added: result.DateAdded,
        }, 'quickconnect_init'));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('check <secret>').description('Check Quick Connect status')
    .option('-f, --format <format>', 'Output format')
    .action(async (secret, options) => {
      const { client, format } = await createApiClient(options);
      try {
        const result = await client.quickConnectConnect(secret);
        console.log(toon.formatToon({
          secret: result.Secret,
          code: result.Code,
          authenticated: !!result.Authentication,
          device_id: result.DeviceId,
        }, 'quickconnect_status'));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('authorize <code>').description('Authorize Quick Connect request')
    .option('-f, --format <format>', 'Output format')
    .option('--user <userId>', 'User ID to authorize')
    .action(async (code, options) => {
      const { client, format } = await createApiClient(options);
      try {
        const result = await client.quickConnectAuthorize(code, options.user);
        console.log(toon.formatMessage(`Quick Connect authorization ${result ? 'successful' : 'failed'}`, result));
      } catch (err) { handleError(err, format); }
    });

  return cmd;
}
