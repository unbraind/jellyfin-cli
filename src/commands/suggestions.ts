import { Command } from 'commander';
import { createApiClient, handleError } from './utils.js';
import { toon } from '../formatters/index.js';

/**
 * Builds the suggestions command tree with validated options and actions.
 * @returns - The configured Commander command tree.
 */
export function createSuggestionsCommand(): Command {
  const cmd = new Command('suggestions');

  cmd
    .command('list')
    .alias('get')
    .description('Get content suggestions')
    .option('-f, --format <format>', 'Output format')
    .option('--parent <id>', 'Parent ID')
    .option('--limit <number>', 'Limit', '20')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const suggestions = await client.getSuggestions({
          parentId: options.parent,
          limit: parseInt(options.limit, 10),
        });
        console.log(toon.formatItems(suggestions));
      } catch (err) {
        handleError(err, format);
      }
    });

  return cmd;
}
