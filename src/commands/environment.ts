import { Command } from 'commander';
import { createApiClient, handleError } from './utils.js';
import { toon } from '../formatters/index.js';

export function createEnvironmentCommand(): Command {
  const cmd = new Command('environment');

  cmd.command('drives').description('Get available drives')
    .option('-f, --format <format>', 'Output format')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const drives = await client.getDrives();
        console.log(toon.formatToon(drives.map((d) => ({
          name: d.Name,
          path: d.Path,
        })), 'drives'));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('logs').description('Get list of log files')
    .option('-f, --format <format>', 'Output format')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const logs = await client.getSystemLogs();
        console.log(toon.formatToon(logs.map((l) => ({
          name: l.Name,
          date: l.DateCreated,
          size: l.Size,
        })), 'log_files'));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('log <name>').description('Get log file content')
    .option('-f, --format <format>', 'Output format')
    .option('--lines <number>', 'Number of lines to show', '100')
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
          console.log(toon.formatToon({
            name,
            total_lines: lines.length,
            showing: result.length,
            content: result,
          }, 'log_content'));
        }
      } catch (err) { handleError(err, format); }
    });

  cmd.command('storage').description('Get system storage info')
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

  return cmd;
}
