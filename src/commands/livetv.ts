import { Command } from 'commander';
import { createApiClient, handleError } from './utils.js';
import { toon } from '../formatters/index.js';
import { attachLivetvExtendedCommands } from './livetv-extended.js';

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
    .command('channel <channelId>')
    .description('Get Live TV channel by ID')
    .option('-f, --format <format>', 'Output format')
    .action(async (channelId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        const channel = await client.getLiveTvChannel(channelId);
        console.log(toon.formatItem(channel));
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
    .command('program <programId>')
    .description('Get Live TV program by ID')
    .option('-f, --format <format>', 'Output format')
    .action(async (programId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        const program = await client.getLiveTvProgram(programId);
        console.log(toon.formatItem(program));
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

  attachLivetvExtendedCommands(cmd);

  return cmd;
}
