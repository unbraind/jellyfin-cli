import { Command } from 'commander';
import { createApiClient, handleError } from './utils.js';
import { toon } from '../formatters/index.js';

export function createLivetvAdminCommand(): Command {
  const cmd = new Command('livetv-admin');
  cmd.description('Live TV administrative commands (tuners, providers, timers)');

  cmd.command('series-recordings').description('List Live TV series recordings')
    .option('-f, --format <format>', 'Output format')
    .option('--limit <number>', 'Limit', '100')
    .option('--offset <number>', 'Offset', '0')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const result = await client.livetv.getLiveTvSeriesRecordings({
          limit: parseInt(options.limit, 10),
          startIndex: parseInt(options.offset, 10),
        });
        console.log(toon.formatItems(result.Items ?? []));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('timer-defaults').description('Get default values for a new Live TV timer')
    .option('-f, --format <format>', 'Output format')
    .option('--program <id>', 'Program ID to get defaults for')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const defaults = await client.livetv.getLiveTvTimerDefaults({ programId: options.program });
        console.log(toon.formatItem(defaults));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('update-timer <timerId>').description('Update an existing Live TV timer')
    .option('-f, --format <format>', 'Output format')
    .option('--channel <id>', 'Channel ID')
    .option('--name <name>', 'Timer name')
    .option('--start <date>', 'Start date (ISO format)')
    .option('--end <date>', 'End date (ISO format)')
    .option('--pre-padding <seconds>', 'Pre-padding seconds')
    .option('--post-padding <seconds>', 'Post-padding seconds')
    .action(async (timerId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        await client.updateLiveTvTimer(timerId, {
          channelId: options.channel,
          name: options.name,
          startDate: options.start,
          endDate: options.end,
          prePaddingSeconds: options.prePadding ? parseInt(options.prePadding, 10) : undefined,
          postPaddingSeconds: options.postPadding ? parseInt(options.postPadding, 10) : undefined,
        });
        console.log(toon.formatMessage(`Timer ${timerId} updated`, true));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('create-series-timer').description('Create a Live TV series timer')
    .option('-f, --format <format>', 'Output format')
    .requiredOption('--channel <id>', 'Channel ID')
    .requiredOption('--name <name>', 'Timer name')
    .option('--record-any-time', 'Record at any time')
    .option('--record-any-channel', 'Record on any channel')
    .option('--record-new-only', 'Record new episodes only')
    .option('--pre-padding <seconds>', 'Pre-padding seconds', '60')
    .option('--post-padding <seconds>', 'Post-padding seconds', '300')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        await client.createLiveTvSeriesTimer({
          channelId: options.channel,
          name: options.name,
          recordAnyTime: options.recordAnyTime,
          recordAnyChannel: options.recordAnyChannel,
          recordNewOnly: options.recordNewOnly,
          prePaddingSeconds: parseInt(options.prePadding, 10),
          postPaddingSeconds: parseInt(options.postPadding, 10),
        });
        console.log(toon.formatMessage('Series timer created', true));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('add-tuner-host').description('Add a tuner host (DVB, HDHomeRun, etc.)')
    .option('-f, --format <format>', 'Output format')
    .requiredOption('--url <url>', 'Tuner device URL')
    .requiredOption('--type <type>', 'Tuner type (e.g. HdHomerun, M3U)')
    .option('--name <name>', 'Friendly name')
    .option('--tuner-count <count>', 'Number of tuners', '2')
    .option('--allow-hw-transcode', 'Allow hardware transcoding')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const result = await client.livetv.addTunerHost({
          Url: options.url,
          Type: options.type,
          FriendlyName: options.name,
          EnabledTunerCount: parseInt(options.tunerCount, 10),
          AllowHWTranscoding: options.allowHwTranscode,
        });
        console.log(toon.formatToon({ id: result.Id, url: result.Url, type: result.Type, name: result.FriendlyName, added: true }, 'tuner_host'));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('delete-tuner-host <id>').description('Delete a tuner host by ID')
    .option('-f, --format <format>', 'Output format')
    .option('--force', 'Skip confirmation')
    .action(async (id, options) => {
      const { client, format } = await createApiClient(options);
      if (!options.force) { console.error('Use --force to confirm deletion'); process.exit(1); }
      try {
        await client.livetv.deleteTunerHost(id);
        console.log(toon.formatMessage(`Tuner host ${id} deleted`, true));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('reset-tuner <tunerId>').description('Reset a tuner device')
    .option('-f, --format <format>', 'Output format')
    .action(async (tunerId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        await client.livetv.resetTuner(tunerId);
        console.log(toon.formatMessage(`Tuner ${tunerId} reset`, true));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('add-listing-provider').description('Add an EPG/listings provider')
    .option('-f, --format <format>', 'Output format')
    .requiredOption('--type <type>', 'Provider type (SchedulesDirect, XmlTv, etc.)')
    .option('--listings-id <id>', 'Listings ID')
    .option('--username <username>', 'Provider username')
    .option('--password <password>', 'Provider password')
    .option('--zip <zip>', 'ZIP/postal code')
    .option('--country <code>', 'Country code')
    .option('--path <path>', 'Path to local file (for XmlTv)')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const result = await client.livetv.addListingProvider({
          Type: options.type,
          ListingsId: options.listingsId,
          Username: options.username,
          Password: options.password,
          ZipCode: options.zip,
          Country: options.country,
          Path: options.path,
        });
        console.log(toon.formatToon({ id: result.Id, type: result.Type, added: true }, 'listing_provider'));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('delete-listing-provider <id>').description('Delete a listings/EPG provider by ID')
    .option('-f, --format <format>', 'Output format')
    .option('--force', 'Skip confirmation')
    .action(async (id, options) => {
      const { client, format } = await createApiClient(options);
      if (!options.force) { console.error('Use --force to confirm deletion'); process.exit(1); }
      try {
        await client.livetv.deleteListingProvider(id);
        console.log(toon.formatMessage(`Listing provider ${id} deleted`, true));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('channel-mapping-options').description('Get channel mapping options for a listing provider')
    .option('-f, --format <format>', 'Output format')
    .option('--provider <id>', 'Provider ID')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const result = await client.livetv.getChannelMappingOptions({ providerId: options.provider });
        console.log(toon.formatToon({
          provider_name: result.ProviderName,
          tuner_channels: result.TunerChannels?.map((c) => ({ id: c.Id, name: c.Name })),
          provider_channels: result.ProviderChannels?.map((c) => ({ id: c.Id, name: c.Name })),
          mappings: result.Mappings,
        }, 'channel_mapping_options'));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('set-channel-mappings').description('Configure channel mappings for a provider')
    .option('-f, --format <format>', 'Output format')
    .requiredOption('--provider <id>', 'Provider ID')
    .requiredOption('--mappings <json>', 'Channel mappings as JSON array of {tuner, provider} objects')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const mappings = JSON.parse(options.mappings) as Record<string, string>[];
        await client.livetv.setChannelMappings({ providerId: options.provider, mappings });
        console.log(toon.formatMessage('Channel mappings updated', true));
      } catch (err) { handleError(err, format); }
    });

  return cmd;
}
