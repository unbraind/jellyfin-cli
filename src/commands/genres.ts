import { Command } from 'commander';
import { createApiClient, handleError } from './utils.js';
import { toon } from '../formatters/index.js';

export function createGenresCommand(): Command {
  const cmd = new Command('genres');

  cmd
    .command('list')
    .description('List all content genres')
    .option('-f, --format <format>', 'Output format')
    .option('--parent <id>', 'Parent library ID')
    .option('--limit <number>', 'Maximum results', '100')
    .option('--sort <field>', 'Sort field (e.g. SortName, DateCreated)', 'SortName')
    .option('--order <dir>', 'Sort order (Ascending, Descending)', 'Ascending')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const result = await client.getGenres({
          parentId: options.parent,
          limit: parseInt(options.limit, 10),
        });
        console.log(toon.formatItems(result.Items ?? []));
      } catch (err) { handleError(err, format); }
    });

  cmd
    .command('get <name>')
    .description('Get a genre by name')
    .option('-f, --format <format>', 'Output format')
    .action(async (name, options) => {
      const { client, format } = await createApiClient(options);
      try {
        const genre = await client.getGenreByName(name);
        console.log(toon.formatItem(genre));
      } catch (err) { handleError(err, format); }
    });

  return cmd;
}
