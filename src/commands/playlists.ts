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
        console.log(toon.formatToon({ id: result.Id, name: name, created: true }, 'playlist_created'));
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
        console.log(toon.formatMessage('Items added to playlist'));
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
        console.log(toon.formatMessage('Items removed from playlist'));
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

  cmd
    .command('delete <playlistId>')
    .description('Delete a playlist')
    .option('-f, --format <format>', 'Output format')
    .action(async (playlistId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        await client.deletePlaylist(playlistId);
        console.log(toon.formatMessage('Playlist deleted'));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd.command('get <playlistId>').description('Get playlist details')
    .option('-f, --format <format>', 'Output format')
    .action(async (playlistId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        const playlist = await client.getPlaylist(playlistId);
        console.log(toon.formatItem(playlist));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('update <playlistId>').description('Update playlist name or items')
    .option('-f, --format <format>', 'Output format')
    .option('--name <name>', 'New playlist name')
    .option('--items <ids>', 'Item IDs (comma-separated)')
    .action(async (playlistId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        await client.updatePlaylist(playlistId, {
          Name: options.name,
          Ids: options.items?.split(','),
        });
        console.log(toon.formatMessage('Playlist updated', true));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('users <playlistId>').description('List users with access to a playlist')
    .option('-f, --format <format>', 'Output format')
    .action(async (playlistId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        const users = await client.getPlaylistUsers(playlistId);
        console.log(toon.formatToon(users.map((u) => ({ user_id: u.UserId, can_edit: u.CanEdit })), 'playlist_users'));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('share <playlistId> <userId>').description('Grant a user access to a playlist')
    .option('-f, --format <format>', 'Output format')
    .option('--can-edit', 'Grant edit permissions (default: read-only)')
    .action(async (playlistId, userId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        await client.setPlaylistUserAccess(playlistId, userId, !!options.canEdit);
        console.log(toon.formatMessage(`User ${userId} granted ${options.canEdit ? 'edit' : 'read'} access`, true));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('unshare <playlistId> <userId>').description('Remove a user\'s access to a playlist')
    .option('-f, --format <format>', 'Output format')
    .action(async (playlistId, userId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        await client.removePlaylistUserAccess(playlistId, userId);
        console.log(toon.formatMessage(`User ${userId} access removed`, true));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('move <playlistId> <itemId> <newIndex>').description('Move item to new position in playlist')
    .option('-f, --format <format>', 'Output format')
    .action(async (playlistId, itemId, newIndex, options) => {
      const { client, format } = await createApiClient(options);
      try {
        await client.movePlaylistItem(playlistId, itemId, parseInt(newIndex, 10));
        console.log(toon.formatMessage('Item moved', true));
      } catch (err) { handleError(err, format); }
    });

  return cmd;
}
