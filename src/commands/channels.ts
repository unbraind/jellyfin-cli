import { Command } from 'commander';
import { createApiClient, handleError } from './utils.js';
import { toon } from '../formatters/index.js';

export function createChannelsCommand(): Command {
  const cmd = new Command('channels');

  cmd
    .command('list')
    .description('List all channels')
    .option('-f, --format <format>', 'Output format')
    .option('--limit <number>', 'Limit', '50')
    .option('--supports-latest', 'Only show channels supporting latest items')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const result = await client.getChannels({
          limit: parseInt(options.limit, 10),
          supportsLatestItems: options.supportsLatest,
        });
        console.log(toon.formatItems(result.Items ?? []));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('features [channelId]')
    .description('Get channel features (all or for specific channel)')
    .option('-f, --format <format>', 'Output format')
    .action(async (channelId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        if (channelId) {
          const features = await client.getChannelFeatures(channelId);
          console.log(toon.formatToon(features, 'channel_features'));
        } else {
          const features = await client.getAllChannelFeatures();
          console.log(toon.formatToon(features, 'channel_features'));
        }
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('items <channelId>')
    .description('Get items from a channel')
    .option('-f, --format <format>', 'Output format')
    .option('--folder <id>', 'Folder ID')
    .option('--limit <number>', 'Limit', '50')
    .option('--offset <number>', 'Offset', '0')
    .option('--sort <field>', 'Sort field')
    .option('--order <direction>', 'Sort order')
    .action(async (channelId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        const result = await client.getChannelItems(channelId, {
          folderId: options.folder,
          limit: parseInt(options.limit, 10),
          startIndex: parseInt(options.offset, 10),
          sortBy: options.sort,
          sortOrder: options.order,
        });
        console.log(toon.formatItems(result.Items ?? []));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('latest <channelId>')
    .description('Get latest items from a channel')
    .option('-f, --format <format>', 'Output format')
    .option('--limit <number>', 'Limit', '20')
    .action(async (channelId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        const items = await client.getLatestChannelItems(channelId, undefined, parseInt(options.limit, 10));
        console.log(toon.formatItems(items));
      } catch (err) {
        handleError(err, format);
      }
    });

  return cmd;
}
