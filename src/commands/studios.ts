import { Command } from 'commander';
import { createApiClient, handleError } from './utils.js';

/**
 * Builds the studios command tree with validated options and actions.
 * @returns - The configured Commander command tree.
 */
export function createStudiosCommand(): Command {
  const cmd = new Command('studios');

  cmd
    .command('list')
    .description('List all studios')
    .option('-f, --format <format>', 'Output format')
    .option('--parent <id>', 'Parent library ID')
    .option('--limit <number>', 'Maximum results', '100')
    .action(async (options) => {
      const { client, format, formatter } = await createApiClient(options);
      try {
        const result = await client.getStudios({
          parentId: options.parent,
          limit: parseInt(options.limit, 10),
        });
        console.log(formatter.formatItems(result.Items ?? []));
      } catch (err) { handleError(err, format); }
    });

  cmd
    .command('get <name>')
    .description('Get a studio by name')
    .option('-f, --format <format>', 'Output format')
    .action(async (name, options) => {
      const { client, format, formatter } = await createApiClient(options);
      try {
        const studio = await client.getStudioByName(name);
        console.log(formatter.formatItem(studio));
      } catch (err) { handleError(err, format); }
    });

  return cmd;
}
