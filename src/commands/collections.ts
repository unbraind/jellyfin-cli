import { Command } from 'commander';
import { createApiClient, handleError } from './utils.js';
import { toon } from '../formatters/index.js';

export function createCollectionsCommand(): Command {
  const cmd = new Command('collections');

  cmd
    .command('list')
    .description('List all collections (box sets)')
    .option('-f, --format <format>', 'Output format')
    .option('--limit <number>', 'Limit', '50')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const result = await client.getItems({
          includeItemTypes: ['BoxSet'],
          recursive: true,
          limit: parseInt(options.limit, 10),
          sortBy: 'SortName',
        });
        console.log(toon.formatItems(result.Items ?? []));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('get <collectionId>')
    .description('Get collection details')
    .option('-f, --format <format>', 'Output format')
    .action(async (collectionId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        const item = await client.getItem(collectionId);
        console.log(toon.formatItem(item));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('items <collectionId>')
    .description('List items in a collection')
    .option('-f, --format <format>', 'Output format')
    .option('--limit <number>', 'Limit', '100')
    .action(async (collectionId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        const result = await client.getItems({
          parentId: collectionId,
          limit: parseInt(options.limit, 10),
        });
        console.log(toon.formatItems(result.Items ?? []));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('create <name>')
    .description('Create a new collection')
    .option('-f, --format <format>', 'Output format')
    .option('--items <ids>', 'Item IDs to add (comma-separated)')
    .option('--parent <id>', 'Parent folder ID')
    .action(async (name, options) => {
      const { client, format } = await createApiClient(options);
      try {
        const result = await client.createCollection({
          name,
          ids: options.items?.split(',').map((id: string) => id.trim()),
          parentId: options.parent,
        });
        console.log(toon.formatToon({ id: result.Id, name: name, created: true }, 'collection_created'));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('add <collectionId> <itemIds...>')
    .description('Add items to a collection')
    .option('-f, --format <format>', 'Output format')
    .action(async (collectionId, itemIds, options) => {
      const { client, format } = await createApiClient(options);
      try {
        await client.addToCollection(collectionId, itemIds);
        console.log(toon.formatMessage('Items added to collection'));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('remove <collectionId> <itemIds...>')
    .description('Remove items from a collection')
    .option('-f, --format <format>', 'Output format')
    .action(async (collectionId, itemIds, options) => {
      const { client, format } = await createApiClient(options);
      try {
        await client.removeFromCollection(collectionId, itemIds);
        console.log(toon.formatMessage('Items removed from collection'));
      } catch (err) {
        handleError(err, format);
      }
    });

  return cmd;
}
