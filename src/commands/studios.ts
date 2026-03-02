import { Command } from 'commander';
import { createApiClient, handleError } from './utils.js';
import { toon } from '../formatters/index.js';

export function createStudiosCommand(): Command {
  const cmd = new Command('studios');

  cmd
    .command('list')
    .description('List all studios')
    .option('-f, --format <format>', 'Output format')
    .option('--parent <id>', 'Parent library ID')
    .option('--limit <number>', 'Maximum results', '100')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const result = await client.getStudios({
          parentId: options.parent,
          limit: parseInt(options.limit, 10),
        });
        console.log(toon.formatItems(result.Items ?? []));
      } catch (err) { handleError(err, format); }
    });

  cmd
    .command('get <name>')
    .description('Get a studio by name')
    .option('-f, --format <format>', 'Output format')
    .action(async (name, options) => {
      const { client, format } = await createApiClient(options);
      try {
        const studio = await client.getStudioByName(name);
        console.log(toon.formatItem(studio));
      } catch (err) { handleError(err, format); }
    });

  return cmd;
}
