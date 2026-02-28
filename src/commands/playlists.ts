import { Command } from 'commander';
import { createApiClient, handleError } from './utils.js';
import { toon } from '../formatters/index.js';

export function createPlaylistsCommand(): Command {
  const cmd = new Command('playlists');

  cmd
    .command('create <name>')
    .description('Create a new playlist')
    .option('-f, --format <format>', 'Output format')
    .option('--items <ids>', 'Initial item IDs (comma-separated)')
    .option('--media-type <type>', 'Media type')
    .action(async (name, options) => {
      const { client, format } = await createApiClient(options);
      try {
        const result = await client.createPlaylist({
          name,
          ids: options.items?.split(','),
          mediaType: options.mediaType,
        });
        console.log(`type: playlist\ndata:\n  id: ${result.Id}\n  name: ${result.Name}\n  success: true`);
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('add <playlistId> <itemIds...>')
    .description('Add items to a playlist')
    .option('-f, --format <format>', 'Output format')
    .action(async (playlistId, itemIds, options) => {
      const { client, format } = await createApiClient(options);
      try {
        await client.addToPlaylist(playlistId, itemIds);
        console.log(`type: message\ndata:\n  message: Items added to playlist\n  success: true`);
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('remove <playlistId> <entryIds...>')
    .description('Remove items from a playlist')
    .option('-f, --format <format>', 'Output format')
    .action(async (playlistId, entryIds, options) => {
      const { client, format } = await createApiClient(options);
      try {
        await client.removeFromPlaylist(playlistId, entryIds);
        console.log(`type: message\ndata:\n  message: Items removed from playlist\n  success: true`);
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('items <playlistId>')
    .description('List items in a playlist')
    .option('-f, --format <format>', 'Output format')
    .option('--limit <number>', 'Limit', '100')
    .option('--offset <number>', 'Offset', '0')
    .action(async (playlistId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        const result = await client.getPlaylistItems(playlistId, {
          limit: parseInt(options.limit, 10),
          startIndex: parseInt(options.offset, 10),
        });
        console.log(toon.formatItems(result.Items ?? []));
      } catch (err) {
        handleError(err, format);
      }
    });

  return cmd;
}
