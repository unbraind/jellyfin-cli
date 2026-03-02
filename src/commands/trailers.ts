import { Command } from 'commander';
import { createApiClient, handleError } from './utils.js';
import { toon } from '../formatters/index.js';

export function createTrailersCommand(): Command {
  const cmd = new Command('trailers');

  cmd.command('list').description('List trailers from the Trailers library')
    .option('-f, --format <format>', 'Output format')
    .option('--limit <number>', 'Maximum results', '50')
    .option('--offset <number>', 'Start index', '0')
    .option('--sort <field>', 'Sort field (e.g. SortName, DateCreated, CommunityRating)')
    .option('--order <dir>', 'Sort order (Ascending, Descending)')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const result = await client.getTrailers({
          limit: parseInt(options.limit, 10),
          startIndex: parseInt(options.offset, 10),
          sortBy: options.sort,
        });
        console.log(toon.formatItems(result.Items ?? []));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('similar <itemId>').description('Get items similar to a trailer')
    .option('-f, --format <format>', 'Output format')
    .option('--limit <number>', 'Maximum results', '20')
    .action(async (itemId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        const result = await client.getSimilarItems(itemId, {
          limit: parseInt(options.limit, 10),
        });
        console.log(toon.formatItems(result.Items ?? []));
      } catch (err) { handleError(err, format); }
    });

  return cmd;
}
