import { Command } from 'commander';
import { createApiClient, handleError } from './utils.js';
import { formatSuccess, toon } from '../formatters/index.js';

export function createSystemCommand(): Command {
  const cmd = new Command('system');

  cmd
    .command('info')
    .description('Get system information')
    .option('-f, --format <format>', 'Output format')
    .option('--public', 'Public info only (no auth required)')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        if (options.public) {
          const info = await client.getPublicSystemInfo();
          console.log(toon.formatToon({
            name: info.ServerName,
            ver: info.Version,
            id: info.Id,
            url: info.LocalAddress,
          }, 'sys_public'));
        } else {
          const info = await client.getSystemInfo();
          console.log(toon.formatSystemInfo(info));
        }
      } catch (err) { handleError(err, format); }
    });

  cmd
    .command('ping')
    .description('Ping server to check connectivity')
    .option('-f, --format <format>', 'Output format')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        await client.getHealth();
        console.log(toon.formatToon({ status: 'ok', reachable: true }, 'ping'));
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
    .command('logs')
    .description('List server log files')
    .option('-f, --format <format>', 'Output format')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const logs = await client.getSystemLogs();
        console.log(toon.formatToon(logs.map((l) => ({
          name: l.Name, date: l.DateCreated, size: l.Size,
        })), 'log_files'));
      } catch (err) { handleError(err, format); }
    });

  cmd
    .command('log <name>')
    .description('Get content of a log file')
    .option('-f, --format <format>', 'Output format')
    .option('--lines <n>', 'Number of lines', '100')
    .action(async (name, options) => {
      const { client, format } = await createApiClient(options);
      try {
        const content = await client.getSystemLogFile(name);
        const lines = content.split('\n');
        const limit = parseInt(options.lines, 10);
        const result = lines.slice(-limit);
        if (format === 'raw') {
          console.log(result.join('\n'));
        } else {
          console.log(toon.formatToon({ name, total_lines: lines.length, showing: result.length, content: result }, 'log_content'));
        }
      } catch (err) { handleError(err, format); }
    });

  cmd
    .command('storage')
    .description('Get system storage paths')
    .option('-f, --format <format>', 'Output format')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const storage = await client.getSystemStorageInfo();
        console.log(toon.formatToon({
          data_paths: storage.DataPaths,
          cache_path: storage.CachePath,
          internal_metadata_path: storage.InternalMetadataPath,
          log_path: storage.LogPath,
          transcoding_temp_path: storage.TranscodingTempPath,
        }, 'storage_info'));
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

  cmd
    .command('endpoint')
    .description('Get network endpoint info (is local, is in network)')
    .option('-f, --format <format>', 'Output format')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const ep = await client.getSystemEndpoint();
        console.log(toon.formatToon({ is_local: ep.IsLocal, is_in_network: ep.IsInNetwork }, 'endpoint'));
      } catch (err) { handleError(err, format); }
    });

  cmd
    .command('bitrate-test')
    .description('Test server-to-client bitrate (downloads a test payload)')
    .option('-f, --format <format>', 'Output format')
    .option('--size <bytes>', 'Test payload size in bytes', '1000000')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const sizeByes = parseInt(options.size, 10);
        const start = Date.now();
        await client.testBitrate(sizeByes);
        const elapsed = Date.now() - start;
        const bitsPerSecond = (sizeByes * 8) / (elapsed / 1000);
        console.log(toon.formatToon({
          size_bytes: sizeByes,
          elapsed_ms: elapsed,
          bitrate_bps: Math.round(bitsPerSecond),
          bitrate_mbps: Math.round(bitsPerSecond / 1_000_000 * 100) / 100,
        }, 'bitrate_test'));
      } catch (err) { handleError(err, format); }
    });

  return cmd;
}
