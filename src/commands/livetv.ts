import { Command } from 'commander';
import { createApiClient, handleError } from './utils.js';
import { toon } from '../formatters/index.js';

export function createLivetvCommand(): Command {
  const cmd = new Command('livetv');

  cmd
    .command('info')
    .description('Get Live TV info')
    .option('-f, --format <format>', 'Output format')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const info = await client.getLiveTvInfo();
        console.log(toon.formatLiveTvInfo(info));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('channels')
    .description('List Live TV channels')
    .option('-f, --format <format>', 'Output format')
    .option('--limit <number>', 'Limit', '100')
    .option('--offset <number>', 'Offset', '0')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const result = await client.getLiveTvChannels({
          limit: parseInt(options.limit, 10),
          startIndex: parseInt(options.offset, 10),
        });
        console.log(toon.formatItems(result.Items ?? []));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('programs')
    .description('List Live TV programs')
    .option('-f, --format <format>', 'Output format')
    .option('--channel <id>', 'Channel ID')
    .option('--limit <number>', 'Limit', '100')
    .option('--offset <number>', 'Offset', '0')
    .option('--min-date <date>', 'Minimum start date')
    .option('--max-date <date>', 'Maximum start date')
    .option('--aired', 'Only show programs that have aired')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const result = await client.getLiveTvPrograms({
          channelId: options.channel,
          limit: parseInt(options.limit, 10),
          startIndex: parseInt(options.offset, 10),
          minStartDate: options.minDate,
          maxStartDate: options.maxDate,
          hasAired: options.aired,
        });
        console.log(toon.formatItems(result.Items ?? []));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('recordings')
    .description('List Live TV recordings')
    .option('-f, --format <format>', 'Output format')
    .option('--limit <number>', 'Limit', '100')
    .option('--offset <number>', 'Offset', '0')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const result = await client.getLiveTvRecordings({
          limit: parseInt(options.limit, 10),
          startIndex: parseInt(options.offset, 10),
        });
        console.log(toon.formatItems(result.Items ?? []));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('timers')
    .description('List Live TV timers')
    .option('-f, --format <format>', 'Output format')
    .option('--channel <id>', 'Channel ID')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const result = await client.getLiveTvTimers({
          channelId: options.channel,
        });
        console.log(toon.formatItems(result.Items ?? []));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('timer <timerId>')
    .description('Get Live TV timer by ID')
    .option('-f, --format <format>', 'Output format')
    .action(async (timerId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        const timer = await client.getLiveTvTimer(timerId);
        console.log(toon.formatItem(timer));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('create-timer')
    .description('Create a Live TV timer')
    .option('-f, --format <format>', 'Output format')
    .requiredOption('--channel <id>', 'Channel ID')
    .requiredOption('--name <name>', 'Timer name')
    .requiredOption('--start <date>', 'Start date (ISO format)')
    .requiredOption('--end <date>', 'End date (ISO format)')
    .option('--program <id>', 'Program ID')
    .option('--pre-padding <seconds>', 'Pre-padding seconds', '60')
    .option('--post-padding <seconds>', 'Post-padding seconds', '300')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        await client.createLiveTvTimer({
          channelId: options.channel,
          name: options.name,
          startDate: options.start,
          endDate: options.end,
          programId: options.program,
          prePaddingSeconds: parseInt(options.prePadding, 10),
          postPaddingSeconds: parseInt(options.postPadding, 10),
        });
        console.log(toon.formatMessage('Timer created'));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('delete-timer <timerId>')
    .description('Delete a Live TV timer')
    .option('-f, --format <format>', 'Output format')
    .action(async (timerId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        await client.deleteLiveTvTimer(timerId);
        console.log(toon.formatMessage('Timer deleted'));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('series-timers')
    .description('List Live TV series timers')
    .option('-f, --format <format>', 'Output format')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const result = await client.getLiveTvSeriesTimers();
        console.log(toon.formatItems(result.Items ?? []));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('series-timer <id>')
    .description('Get Live TV series timer by ID')
    .option('-f, --format <format>', 'Output format')
    .action(async (id, options) => {
      const { client, format } = await createApiClient(options);
      try {
        const timer = await client.getLiveTvSeriesTimer(id);
        console.log(toon.formatItem(timer));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('delete-series-timer <id>')
    .description('Delete a Live TV series timer')
    .option('-f, --format <format>', 'Output format')
    .action(async (id, options) => {
      const { client, format } = await createApiClient(options);
      try {
        await client.deleteLiveTvSeriesTimer(id);
        console.log(toon.formatMessage('Series timer deleted'));
      } catch (err) {
        handleError(err, format);
      }
    });

  return cmd;
}
