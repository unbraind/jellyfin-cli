import { Command } from 'commander';
import { createApiClient, handleError } from './utils.js';

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
        console.log(`type: message\ndata:\n  message: Item marked as favorite\n  success: true`);
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
        console.log(`type: message\ndata:\n  message: Item removed from favorites\n  success: true`);
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
        console.log(`type: message\ndata:\n  message: Item marked as played\n  success: true`);
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
        console.log(`type: message\ndata:\n  message: Item marked as unplayed\n  success: true`);
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
        console.log(`type: message\ndata:\n  message: Item liked\n  success: true`);
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
        console.log(`type: message\ndata:\n  message: Item disliked\n  success: true`);
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
        console.log(`type: message\ndata:\n  message: Item rating removed\n  success: true`);
      } catch (err) {
        handleError(err, format);
      }
    });

  return cmd;
}
