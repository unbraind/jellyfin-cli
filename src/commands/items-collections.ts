import type { Command } from 'commander';
import { parseNonNegativeInt, parsePositiveInt } from './number-options.js';
import { createApiClient, handleError } from './utils.js';

/**
 * Adds Jellyfin 12 item-to-collection lookup to the items command tree.
 * @param command - Parent items command.
 */
export function addItemCollectionsCommand(command: Command): void {
  command
    .command('collections <itemId>')
    .description('List collections containing an item (Jellyfin 12+)')
    .option('-f, --format <format>', 'Output format')
    .option('--user <id>', 'User ID used to attach user data')
    .option('--limit <number>', 'Maximum results', '50')
    .option('--offset <number>', 'Start index', '0')
    .option('--fields <fields>', 'Additional item fields (comma-separated)')
    .action(async (itemId, options) => {
      const { client, format, formatter } = await createApiClient(options);
      try {
        const result = await client.getItemCollections(itemId, {
          userId: options.user,
          limit: parsePositiveInt(options.limit, 'Limit'),
          startIndex: parseNonNegativeInt(options.offset, 'Offset'),
          fields: options.fields?.split(',').map((field: string) => field.trim()).filter(Boolean),
        });
        console.log(formatter.formatQueryResult(result, formatter.formatItem));
      } catch (err) {
        handleError(err, format);
      }
    });
}
