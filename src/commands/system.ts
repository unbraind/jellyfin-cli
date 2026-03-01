import { Command } from 'commander';
import { createApiClient, handleError } from './utils.js';
import { formatSuccess, toon } from '../formatters/index.js';

export function createSystemCommand(): Command {
  const cmd = new Command('system');

  cmd
    .command('info')
    .description('Get system information')
    .option('-f, --format <format>', 'Output format')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const info = await client.getSystemInfo();
        console.log(toon.formatSystemInfo(info));
      } catch (err) { handleError(err, format); }
    });

  cmd
    .command('health')
    .description('Check server health status')
    .option('-f, --format <format>', 'Output format')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const health = await client.getHealth();
        console.log(formatSuccess(`Server health: ${health}`, format));
      } catch (err) { handleError(err, format); }
    });

  cmd
    .command('restart')
    .description('Restart the Jellyfin server')
    .option('-f, --format <format>', 'Output format')
    .option('--force', 'Skip confirmation')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      if (!options.force) { console.error('Use --force to confirm restart'); process.exit(1); }
      try {
        await client.restartServer();
        console.log(formatSuccess('Server restart initiated', format));
      } catch (err) { handleError(err, format); }
    });

  cmd
    .command('shutdown')
    .description('Shutdown the Jellyfin server')
    .option('-f, --format <format>', 'Output format')
    .option('--force', 'Skip confirmation')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      if (!options.force) { console.error('Use --force to confirm shutdown'); process.exit(1); }
      try {
        await client.shutdownServer();
        console.log(formatSuccess('Server shutdown initiated', format));
      } catch (err) { handleError(err, format); }
    });

  cmd
    .command('activity')
    .description('Get activity log')
    .option('-f, --format <format>', 'Output format')
    .option('--limit <number>', 'Number of entries', '50')
    .option('--start <number>', 'Start index', '0')
    .option('--min-date <date>', 'Minimum date (ISO format)')
    .option('--has-user', 'Only show entries with user ID')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const result = await client.getActivityLog({
          limit: parseInt(options.limit, 10),
          startIndex: parseInt(options.start, 10),
          minDate: options.minDate,
          hasUserId: options.hasUser,
        });
        console.log(toon.formatActivityLog(result.Items ?? []));
      } catch (err) { handleError(err, format); }
    });

  cmd
    .command('time')
    .description('Get server UTC time (useful for clock sync checking)')
    .option('-f, --format <format>', 'Output format')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const timeInfo = await client.getUtcTime();
        console.log(toon.formatToon({
          request_received: timeInfo.RequestReceptionTime,
          response_sent: timeInfo.ResponseTransmissionTime,
        }, 'server_time'));
      } catch (err) { handleError(err, format); }
    });

  cmd
    .command('config')
    .description('Get server application configuration')
    .option('-f, --format <format>', 'Output format')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const config = await client.getServerConfiguration();
        console.log(toon.formatToon(config, 'server_config'));
      } catch (err) { handleError(err, format); }
    });

  cmd
    .command('config-section <key>')
    .description('Get a named server configuration section (e.g. network, encoding)')
    .option('-f, --format <format>', 'Output format')
    .action(async (key, options) => {
      const { client, format } = await createApiClient(options);
      try {
        const section = await client.getNamedConfiguration(key);
        console.log(toon.formatToon(section, `config_${key}`));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('endpoint').description('Get network endpoint info (is local, is in network)')
    .option('-f, --format <format>', 'Output format')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const ep = await client.getSystemEndpoint();
        console.log(toon.formatToon({ is_local: ep.IsLocal, is_in_network: ep.IsInNetwork }, 'endpoint'));
      } catch (err) { handleError(err, format); }
    });

  return cmd;
}
