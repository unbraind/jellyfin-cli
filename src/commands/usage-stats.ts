import { Command } from 'commander';
import { createApiClient, handleError } from './utils.js';
import { JellyfinApiError } from '../api/client.js';
import type { JellyfinApiClient } from '../api/client.js';
import { formatOutput } from '../formatters/index.js';

async function getUsageUsers(client: JellyfinApiClient): Promise<unknown> {
  try {
    return await client.getUsageUserList();
  } catch (error) {
    if (!(error instanceof JellyfinApiError) || error.statusCode !== 500) throw error;
    const users = await client.getUsers();
    return users.map((user) => ({
      name: user.Name ?? null,
      id: user.Id ?? null,
      in_list: null,
      source: 'jellyfin_core_fallback',
      warning: 'playback_reporting_user_list_failed',
    }));
  }
}

// Commands for the PlaybackReportingActivity plugin
// Plugin must be installed: https://github.com/jellyfin/jellyfin-plugin-playbackreporting
/**
 * Builds the usage stats command tree with validated options and actions.
 * @returns - The configured Commander command tree.
 */
export function createUsageStatsCommand(): Command {
  const cmd = new Command('usage-stats');
  cmd.description('Playback usage statistics (requires PlaybackReportingActivity plugin)');

  cmd.command('play-activity').description('Get playback activity stats over time')
    .option('-f, --format <format>', 'Output format')
    .option('--days <number>', 'Number of days to include', '30')
    .option('--end-date <date>', 'End date (YYYY-MM-DD)')
    .option('--filter <userId>', 'Filter by user ID')
    .option('--data-type <type>', 'Data type (count or duration)')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const data = await client.getUsagePlayActivity({
          days: parseInt(options.days, 10),
          endDate: options.endDate,
          filter: options.filter,
          dataType: options.dataType,
        });
        console.log(formatOutput(data, format, 'play_activity'));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('user-activity').description('Get per-user activity report')
    .option('-f, --format <format>', 'Output format')
    .option('--days <number>', 'Number of days to include', '30')
    .option('--end-date <date>', 'End date (YYYY-MM-DD)')
    .option('--filter <userId>', 'Filter by user ID')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const data = await client.getUserActivity({
          days: parseInt(options.days, 10),
          endDate: options.endDate,
          filter: options.filter,
        });
        console.log(formatOutput(data, format, 'user_activity'));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('hourly').description('Get hourly playback usage report')
    .option('-f, --format <format>', 'Output format')
    .option('--days <number>', 'Number of days to include', '30')
    .option('--end-date <date>', 'End date (YYYY-MM-DD)')
    .option('--filter <userId>', 'Filter by user ID')
    .option('--data-type <type>', 'Data type (count or duration)')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const data = await client.getHourlyReport({
          days: parseInt(options.days, 10),
          endDate: options.endDate,
          filter: options.filter,
          dataType: options.dataType,
        });
        console.log(formatOutput(data, format, 'hourly_report'));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('breakdown <type>').description('Get breakdown report by type (e.g. MediaType, AudioCodec, VideoCodec, VideoResolution, SubtitleCodec, StreamType)')
    .option('-f, --format <format>', 'Output format')
    .option('--days <number>', 'Number of days to include', '30')
    .option('--end-date <date>', 'End date (YYYY-MM-DD)')
    .option('--filter <userId>', 'Filter by user ID')
    .action(async (type, options) => {
      const { client, format } = await createApiClient(options);
      try {
        const data = await client.getBreakdownReport(type, {
          days: parseInt(options.days, 10),
          endDate: options.endDate,
          filter: options.filter,
        });
        console.log(formatOutput(data, format, `breakdown_${type.toLowerCase()}`));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('movies').description('Get most-played movies report')
    .option('-f, --format <format>', 'Output format')
    .option('--days <number>', 'Number of days to include', '30')
    .option('--end-date <date>', 'End date (YYYY-MM-DD)')
    .option('--filter <userId>', 'Filter by user ID')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const data = await client.getMoviesReport({
          days: parseInt(options.days, 10),
          endDate: options.endDate,
          filter: options.filter,
        });
        console.log(formatOutput(data, format, 'movies_report'));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('tv-shows').description('Get most-played TV shows report')
    .option('-f, --format <format>', 'Output format')
    .option('--days <number>', 'Number of days to include', '30')
    .option('--end-date <date>', 'End date (YYYY-MM-DD)')
    .option('--filter <userId>', 'Filter by user ID')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const data = await client.getTvShowsReport({
          days: parseInt(options.days, 10),
          endDate: options.endDate,
          filter: options.filter,
        });
        console.log(formatOutput(data, format, 'tv_shows_report'));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('duration-histogram').description('Get duration histogram report')
    .option('-f, --format <format>', 'Output format')
    .option('--days <number>', 'Number of days to include', '30')
    .option('--end-date <date>', 'End date (YYYY-MM-DD)')
    .option('--filter <userId>', 'Filter by user ID')
    .option('--data-type <type>', 'Data type (count or duration)')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const data = await client.getDurationHistogramReport({
          days: parseInt(options.days, 10),
          endDate: options.endDate,
          filter: options.filter,
          dataType: options.dataType,
        });
        console.log(formatOutput(data, format, 'duration_histogram'));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('users').description('List users known to the playback reporting plugin')
    .option('-f, --format <format>', 'Output format')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const data = await getUsageUsers(client);
        console.log(formatOutput(data, format, 'usage_users'));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('type-filters').description('List available media type filters for reports')
    .option('-f, --format <format>', 'Output format')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const data = await client.getUsageTypeFilterList();
        console.log(formatOutput(data, format, 'type_filters'));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('user-items <userId> <date>').description('Get playback items for a user on a specific date (YYYY-MM-DD)')
    .option('-f, --format <format>', 'Output format')
    .action(async (userId, date, options) => {
      const { client, format } = await createApiClient(options);
      try {
        const data = await client.getUserReportData(userId, date);
        console.log(formatOutput(data, format, 'user_items'));
      } catch (err) { handleError(err, format); }
    });

  return cmd;
}
