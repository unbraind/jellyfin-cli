import { Command } from 'commander';
import { createApiClient, handleError } from './utils.js';
import { toon } from '../formatters/index.js';

export function attachLivetvExtendedCommands(cmd: Command): void {
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

  cmd.command('guide-info')
    .description('Get TV guide date range')
    .option('-f, --format <format>', 'Output format')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const info = await client.getLiveTvGuideInfo();
        console.log(toon.formatToon({ start_date: info.StartDate, end_date: info.EndDate }, 'guide_info'));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd.command('recommended')
    .description('Get recommended Live TV programs')
    .option('-f, --format <format>', 'Output format')
    .option('--limit <number>', 'Limit', '20')
    .option('--is-airing', 'Only currently airing')
    .option('--has-aired', 'Only programs that have aired')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const result = await client.getLiveTvRecommendedPrograms({
          limit: parseInt(options.limit, 10),
          isAiring: options.isAiring,
          hasAired: options.hasAired,
        });
        console.log(toon.formatItems(result.Items ?? []));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd.command('recording-folders')
    .description('List Live TV recording folder collections')
    .option('-f, --format <format>', 'Output format')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const result = await client.getLiveTvRecordingFolders();
        console.log(toon.formatItems(result.Items ?? []));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd.command('recording-groups')
    .description('List Live TV recording groups')
    .option('-f, --format <format>', 'Output format')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const result = await client.getLiveTvRecordingGroups();
        console.log(toon.formatItems(result.Items ?? []));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd.command('recording <id>')
    .description('Get Live TV recording by ID')
    .option('-f, --format <format>', 'Output format')
    .action(async (id, options) => {
      const { client, format } = await createApiClient(options);
      try {
        const recording = await client.getLiveTvRecordingById(id);
        console.log(toon.formatItem(recording));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd.command('delete-recording <id>')
    .description('Delete a Live TV recording')
    .option('-f, --format <format>', 'Output format')
    .option('--force', 'Skip confirmation')
    .action(async (id, options) => {
      const { client, format } = await createApiClient(options);
      if (!options.force) {
        console.error('Use --force to confirm deletion');
        process.exit(1);
      }
      try {
        await client.deleteLiveTvRecording(id);
        console.log(toon.formatMessage(`Recording ${id} deleted`, true));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd.command('discover-tuners')
    .description('Discover available tuner devices on the network')
    .option('-f, --format <format>', 'Output format')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const tuners = await client.discoverTuners();
        console.log(toon.formatToon(tuners.map((t) => ({ type: t.Type, url: t.Url })), 'tuners'));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd.command('tuner-types')
    .description('List supported tuner host types')
    .option('-f, --format <format>', 'Output format')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const types = await client.getTunerHostTypes();
        console.log(toon.formatToon(types.map((t) => ({ id: t.Id, name: t.Name })), 'tuner_types'));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd.command('schedules-direct-countries')
    .description('List Schedules Direct countries and postal code patterns')
    .option('-f, --format <format>', 'Output format')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const payload = await client.getSchedulesDirectCountries();
        const normalized = typeof payload === 'string' ? { raw: payload } : payload;
        console.log(toon.formatToon(normalized, 'schedules_direct_countries'));
      } catch (err) {
        handleError(err, format);
      }
    });
}
