import { Command } from 'commander';
import { createApiClient, handleError } from './utils.js';
import { parseNonNegativeInt, parsePositiveInt } from './number-options.js';
import {
  ITEM_SORT_FIELDS,
  SORT_ORDERS,
  type ItemSortField,
  type SortOrder,
} from '../types/index.js';

/**
 * Builds the trailers command tree with validated options and actions.
 * @returns - The configured Commander command tree.
 */
export function createTrailersCommand(): Command {
  const cmd = new Command('trailers');

  cmd.command('list').description('List trailers from the Trailers library')
    .option('-f, --format <format>', 'Output format')
    .option('--limit <number>', 'Maximum results', '50')
    .option('--offset <number>', 'Start index', '0')
    .option('--sort <fields>', 'ItemSortBy fields (comma-separated)')
    .option('--order <directions>', 'Ascending or Descending (comma-separated)')
    .option('--audio-languages <codes>', 'Audio languages (comma-separated; Jellyfin 12+)')
    .option('--subtitle-languages <codes>', 'Subtitle languages (comma-separated; Jellyfin 12+)')
    .action(async (options) => {
      const { client, format, formatter } = await createApiClient(options);
      try {
        const sortBy = options.sort?.split(',').map((value: string) => value.trim()).filter(Boolean) as ItemSortField[] | undefined;
        const sortOrder = options.order?.split(',').map((value: string) => value.trim()).filter(Boolean) as SortOrder[] | undefined;
        if (sortBy?.some((field) => !ITEM_SORT_FIELDS.includes(field))) {
          throw new Error(`Invalid trailer sort field '${options.sort}'`);
        }
        if (sortOrder?.some((order) => !SORT_ORDERS.includes(order))) {
          throw new Error(`Invalid sort order '${options.order}'`);
        }
        const result = await client.getTrailers({
          limit: parsePositiveInt(options.limit, 'Limit'),
          startIndex: parseNonNegativeInt(options.offset, 'Offset'),
          sortBy,
          sortOrder,
          audioLanguages: options.audioLanguages?.split(',').map((value: string) => value.trim()).filter(Boolean),
          subtitleLanguages: options.subtitleLanguages?.split(',').map((value: string) => value.trim()).filter(Boolean),
        });
        console.log(formatter.formatItems(result.Items ?? []));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('similar <itemId>').description('Get items similar to a trailer')
    .option('-f, --format <format>', 'Output format')
    .option('--limit <number>', 'Maximum results', '20')
    .action(async (itemId, options) => {
      const { client, format, formatter } = await createApiClient(options);
      try {
        const result = await client.getSimilarItems(itemId, {
          limit: parseInt(options.limit, 10),
        });
        console.log(formatter.formatItems(result.Items ?? []));
      } catch (err) { handleError(err, format); }
    });

  return cmd;
}
