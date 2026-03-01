import { Command } from 'commander';
import { createApiClient, handleError } from './utils.js';
import { toon } from '../formatters/index.js';

export function createFavoritesCommand(): Command {
  const cmd = new Command('favorites');

  cmd
    .command('list')
    .description('List favorite items')
    .option('-f, --format <format>', 'Output format')
    .option('--types <types>', 'Item types (comma-separated)')
    .option('--limit <number>', 'Limit', '50')
    .option('--offset <number>', 'Offset', '0')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const result = await client.getItems({
          filters: ['IsFavorite'],
          recursive: true,
          includeItemTypes: options.types?.split(','),
          limit: parseInt(options.limit, 10),
          startIndex: parseInt(options.offset, 10),
          sortBy: 'SortName',
        });
        console.log(toon.formatItems(result.Items ?? []));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('add <itemId>')
    .description('Add item to favorites')
    .option('-f, --format <format>', 'Output format')
    .option('--user <userId>', 'User ID')
    .action(async (itemId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        await client.markFavorite(itemId, options.user);
        console.log(toon.formatMessage('Item added to favorites', true));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('remove <itemId>')
    .description('Remove item from favorites')
    .option('-f, --format <format>', 'Output format')
    .option('--user <userId>', 'User ID')
    .action(async (itemId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        await client.unmarkFavorite(itemId, options.user);
        console.log(toon.formatMessage('Item removed from favorites', true));
      } catch (err) {
        handleError(err, format);
      }
    });

  return cmd;
}
