import { Command } from 'commander';
import { createApiClient, handleError } from './utils.js';
import { toon } from '../formatters/index.js';

export function createTrickplayCommand(): Command {
  const cmd = new Command('trickplay');

  cmd
    .command('hls-url <itemId> <width>')
    .description('Get trickplay HLS playlist URL')
    .option('-f, --format <format>', 'Output format')
    .option('--media-source <id>', 'Media source ID')
    .action(async (itemId, width, options) => {
      const { client, format } = await createApiClient(options);
      try {
        const url = client.getTrickplayHlsPlaylistUrl(itemId, parseInt(width, 10), {
          mediaSourceId: options.mediaSource,
        });
        console.log(toon.formatToon({ url, item_id: itemId, width }, 'trickplay_hls_url'));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('tile-url <itemId> <width> <index>')
    .description('Get trickplay tile image URL')
    .option('-f, --format <format>', 'Output format')
    .option('--media-source <id>', 'Media source ID')
    .action(async (itemId, width, index, options) => {
      const { client, format } = await createApiClient(options);
      try {
        const url = client.getTrickplayTileImageUrl(itemId, parseInt(width, 10), parseInt(index, 10), {
          mediaSourceId: options.mediaSource,
        });
        console.log(toon.formatToon({ url, item_id: itemId, width, index }, 'trickplay_tile_url'));
      } catch (err) {
        handleError(err, format);
      }
    });

  return cmd;
}
