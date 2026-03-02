import { Command } from 'commander';
import { createApiClient, handleError } from './utils.js';
import { toon } from '../formatters/index.js';

export function createPersonsCommand(): Command {
  const cmd = new Command('persons');

  cmd
    .command('list')
    .description('List all persons (actors, directors, writers, etc.)')
    .option('-f, --format <format>', 'Output format')
    .option('--parent <id>', 'Parent library ID')
    .option('--limit <number>', 'Maximum results', '100')
    .option('--search <term>', 'Search by name')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const result = await client.getPersons({
          parentId: options.parent,
          limit: parseInt(options.limit, 10),
        });
        const items = result.Items ?? [];
        const filtered = options.search
          ? items.filter((p) => p.Name?.toLowerCase().includes(options.search.toLowerCase()))
          : items;
        console.log(toon.formatItems(filtered));
      } catch (err) { handleError(err, format); }
    });

  cmd
    .command('get <name>')
    .description('Get a person by name')
    .option('-f, --format <format>', 'Output format')
    .action(async (name, options) => {
      const { client, format } = await createApiClient(options);
      try {
        const person = await client.getPersonByName(name);
        console.log(toon.formatItem(person));
      } catch (err) { handleError(err, format); }
    });

  return cmd;
}
