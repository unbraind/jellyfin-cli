import { Command } from 'commander';
import { createApiClient, handleError } from './utils.js';
import { toon } from '../formatters/index.js';

// Commands for the PlaybackReportingActivity plugin
// Plugin must be installed: https://github.com/jellyfin/jellyfin-plugin-playbackreporting
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
        console.log(toon.formatToon(data, 'play_activity'));
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
        console.log(toon.formatToon(data, 'user_activity'));
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
        console.log(toon.formatToon(data, 'hourly_report'));
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
        console.log(toon.formatToon(data, `breakdown_${type.toLowerCase()}`));
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
        console.log(toon.formatToon(data, 'movies_report'));
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
        console.log(toon.formatToon(data, 'tv_shows_report'));
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
        console.log(toon.formatToon(data, 'duration_histogram'));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('users').description('List users known to the playback reporting plugin')
    .option('-f, --format <format>', 'Output format')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const data = await client.getUsageUserList();
        console.log(toon.formatToon(data, 'usage_users'));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('type-filters').description('List available media type filters for reports')
    .option('-f, --format <format>', 'Output format')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const data = await client.getUsageTypeFilterList();
        console.log(toon.formatToon(data, 'type_filters'));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('user-items <userId> <date>').description('Get playback items for a user on a specific date (YYYY-MM-DD)')
    .option('-f, --format <format>', 'Output format')
    .action(async (userId, date, options) => {
      const { client, format } = await createApiClient(options);
      try {
        const data = await client.getUserReportData(userId, date);
        console.log(toon.formatToon(data, 'user_items'));
      } catch (err) { handleError(err, format); }
    });

  return cmd;
}
