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

  return cmd;
}
