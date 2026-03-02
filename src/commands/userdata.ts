import { Command } from 'commander';
import { createApiClient, handleError } from './utils.js';
import { toon } from '../formatters/index.js';

export function createUserDataCommand(): Command {
  const cmd = new Command('userdata');

  cmd
    .command('favorite <itemId>')
    .description('Mark item as favorite')
    .option('-f, --format <format>', 'Output format')
    .option('--user <userId>', 'User ID')
    .action(async (itemId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        await client.markFavorite(itemId, options.user);
        console.log(toon.formatMessage('Favorited'));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('unfavorite <itemId>')
    .description('Remove item from favorites')
    .option('-f, --format <format>', 'Output format')
    .option('--user <userId>', 'User ID')
    .action(async (itemId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        await client.unmarkFavorite(itemId, options.user);
        console.log(toon.formatMessage('Unfavorited'));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('played <itemId>')
    .description('Mark item as played')
    .option('-f, --format <format>', 'Output format')
    .option('--user <userId>', 'User ID')
    .option('--date <date>', 'Date played (ISO format)')
    .action(async (itemId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        await client.markPlayed(itemId, options.user, options.date);
        console.log(toon.formatMessage('Marked played'));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('unplayed <itemId>')
    .description('Mark item as unplayed')
    .option('-f, --format <format>', 'Output format')
    .option('--user <userId>', 'User ID')
    .action(async (itemId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        await client.unmarkPlayed(itemId, options.user);
        console.log(toon.formatMessage('Marked unplayed'));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('like <itemId>')
    .description('Like an item')
    .option('-f, --format <format>', 'Output format')
    .option('--user <userId>', 'User ID')
    .action(async (itemId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        await client.updateUserItemRating(itemId, options.user, true);
        console.log(toon.formatMessage('Liked'));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('dislike <itemId>')
    .description('Dislike an item')
    .option('-f, --format <format>', 'Output format')
    .option('--user <userId>', 'User ID')
    .action(async (itemId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        await client.updateUserItemRating(itemId, options.user, false);
        console.log(toon.formatMessage('Disliked'));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('unrate <itemId>')
    .description('Remove rating from item')
    .option('-f, --format <format>', 'Output format')
    .option('--user <userId>', 'User ID')
    .action(async (itemId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        await client.deleteUserItemRating(itemId, options.user);
        console.log(toon.formatMessage('Rating removed'));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd.command('get <itemId>').description('Get user data for an item (play count, favorite status, position)')
    .option('-f, --format <format>', 'Output format')
    .option('--user <userId>', 'User ID (defaults to current user)')
    .action(async (itemId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        const data = await client.getUserItemData(itemId, options.user);
        console.log(toon.formatToon({
          is_favorite: data.IsFavorite,
          played: data.Played,
          play_count: data.PlayCount,
          last_played: data.LastPlayedDate,
          position_ticks: data.PlaybackPositionTicks,
          rating: data.Rating,
        }, 'user_item_data'));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('played-items').description('List items marked as played by the current user')
    .option('-f, --format <format>', 'Output format')
    .option('--limit <number>', 'Limit', '20')
    .option('--types <types>', 'Item types (comma-separated)')
    .option('--recursive', 'Recursive search')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const result = await client.getItems({
          isPlayed: true,
          recursive: options.recursive ?? true,
          limit: parseInt(options.limit, 10),
          includeItemTypes: options.types?.split(','),
          sortBy: 'DatePlayed',
          sortOrder: 'Descending',
        });
        console.log(toon.formatItems(result.Items ?? []));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('update <itemId>').description('Update user data for an item directly (position, play count, favorite, rating)')
    .option('-f, --format <format>', 'Output format')
    .option('--user <userId>', 'User ID (defaults to current user)')
    .option('--favorite <boolean>', 'Set favorite (true/false)')
    .option('--played <boolean>', 'Set played state (true/false)')
    .option('--play-count <n>', 'Set play count')
    .option('--position <ticks>', 'Set playback position in ticks')
    .option('--rating <number>', 'Set community rating (0-10)')
    .action(async (itemId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        const data: { IsFavorite?: boolean; Played?: boolean; PlayCount?: number; PlaybackPositionTicks?: number; Rating?: number } = {};
        if (options.favorite !== undefined) data.IsFavorite = options.favorite === 'true';
        if (options.played !== undefined) data.Played = options.played === 'true';
        if (options.playCount !== undefined) data.PlayCount = parseInt(options.playCount, 10);
        if (options.position !== undefined) data.PlaybackPositionTicks = parseInt(options.position, 10);
        if (options.rating !== undefined) data.Rating = parseFloat(options.rating);
        const result = await client.updateUserItemData(itemId, data, options.user);
        console.log(toon.formatToon({
          is_favorite: result.IsFavorite,
          played: result.Played,
          play_count: result.PlayCount,
          position_ticks: result.PlaybackPositionTicks,
          rating: result.Rating,
        }, 'user_item_data'));
      } catch (err) { handleError(err, format); }
    });

  return cmd;
}
