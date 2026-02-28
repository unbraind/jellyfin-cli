import { Command } from 'commander';
import { createApiClient, handleError } from './utils.js';
import { toon } from '../formatters/index.js';
import type { ItemsQueryParams } from '../types/index.js';

export function createItemsCommand(): Command {
  const cmd = new Command('items');

  cmd
    .command('list')
    .description('List items')
    .option('-f, --format <format>', 'Output format')
    .option('--parent <id>', 'Parent ID')
    .option('--types <types>', 'Item types (comma-separated)')
    .option('--genres <genres>', 'Genres (comma-separated)')
    .option('--years <years>', 'Years (comma-separated)')
    .option('--search <term>', 'Search term')
    .option('--limit <number>', 'Limit', '50')
    .option('--offset <number>', 'Offset', '0')
    .option('--sort <field>', 'Sort field')
    .option('--order <direction>', 'Sort order (Ascending/Descending)')
    .option('--recursive', 'Recursive search')
    .option('--favorites', 'Show only favorites')
    .option('--played', 'Show only played items')
    .option('--unplayed', 'Show only unplayed items')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const params: ItemsQueryParams = {
          parentId: options.parent,
          includeItemTypes: options.types?.split(','),
          genres: options.genres?.split(','),
          years: options.years?.split(',').map((y: string) => parseInt(y, 10)),
          searchTerm: options.search,
          limit: parseInt(options.limit, 10),
          startIndex: parseInt(options.offset, 10),
          sortBy: options.sort,
          sortOrder: options.order,
          recursive: options.recursive,
          isFavorite: options.favorites,
          isPlayed: options.played ? true : options.unplayed ? false : undefined,
        };
        const result = await client.getItems(params);
        console.log(toon.formatItems(result.Items ?? []));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('get <itemId>')
    .description('Get item by ID')
    .option('-f, --format <format>', 'Output format')
    .action(async (itemId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        const item = await client.getItem(itemId);
        console.log(toon.formatItem(item));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('latest')
    .description('Get latest items')
    .option('-f, --format <format>', 'Output format')
    .option('--parent <id>', 'Parent ID')
    .option('--limit <number>', 'Limit', '20')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const items = await client.getLatestItems({
          parentId: options.parent,
          limit: parseInt(options.limit, 10),
        });
        console.log(toon.formatItems(items));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('resume')
    .description('Get resume items')
    .option('-f, --format <format>', 'Output format')
    .option('--parent <id>', 'Parent ID')
    .option('--limit <number>', 'Limit', '20')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const result = await client.getResumeItems({
          parentId: options.parent,
          limit: parseInt(options.limit, 10),
        });
        console.log(toon.formatItems(result.Items ?? []));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('search <term>')
    .description('Search for items')
    .option('-f, --format <format>', 'Output format')
    .option('--limit <number>', 'Limit', '20')
    .option('--types <types>', 'Item types (comma-separated)')
    .action(async (term, options) => {
      const { client, format } = await createApiClient(options);
      try {
        const result = await client.getSearchHints({
          searchTerm: term,
          limit: parseInt(options.limit, 10),
          includeItemTypes: options.types?.split(','),
        });
        console.log(toon.formatSearchResult(result));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('similar <itemId>')
    .description('Get similar items')
    .option('-f, --format <format>', 'Output format')
    .option('--limit <number>', 'Limit', '20')
    .action(async (itemId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        const result = await client.getSimilarItems(itemId, {
          limit: parseInt(options.limit, 10),
        });
        console.log(toon.formatItems(result.Items ?? []));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('refresh <itemId>')
    .description('Refresh item metadata')
    .option('-f, --format <format>', 'Output format')
    .option('--recursive', 'Refresh recursively')
    .option('--replace-metadata', 'Replace all metadata')
    .option('--replace-images', 'Replace all images')
    .action(async (itemId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        await client.refreshItem(itemId, {
          recursive: options.recursive,
          replaceAllMetadata: options.replaceMetadata,
          replaceAllImages: options.replaceImages,
        });
        console.log(`type: message\ndata:\n  message: Refresh initiated for item ${itemId}\n  success: true`);
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('delete <itemId>')
    .description('Delete an item')
    .option('-f, --format <format>', 'Output format')
    .option('--force', 'Skip confirmation')
    .action(async (itemId, options) => {
      const { client, format } = await createApiClient(options);
      if (!options.force) {
        console.error('Use --force to confirm deletion');
        process.exit(1);
      }
      try {
        await client.deleteItem(itemId);
        console.log(`type: message\ndata:\n  message: Item ${itemId} deleted\n  success: true`);
      } catch (err) {
        handleError(err, format);
      }
    });

  return cmd;
}
