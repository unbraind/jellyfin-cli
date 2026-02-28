import { Command } from 'commander';
import { createApiClient, handleError } from './utils.js';
import { toon } from '../formatters/index.js';

export function createMusicGenresCommand(): Command {
  const cmd = new Command('music-genres');

  cmd
    .command('list')
    .description('List all music genres')
    .option('-f, --format <format>', 'Output format')
    .option('--parent <id>', 'Parent ID')
    .option('--limit <number>', 'Limit', '100')
    .option('--sort <field>', 'Sort field', 'SortName')
    .option('--order <direction>', 'Sort order', 'Ascending')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const result = await client.getMusicGenres({
          parentId: options.parent,
          limit: parseInt(options.limit, 10),
          sortBy: options.sort,
          sortOrder: options.order,
        });
        console.log(toon.formatItems(result.Items ?? []));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('get <name>')
    .description('Get music genre by name')
    .option('-f, --format <format>', 'Output format')
    .action(async (name, options) => {
      const { client, format } = await createApiClient(options);
      try {
        const genre = await client.getMusicGenre(name);
        console.log(toon.formatItem(genre));
      } catch (err) {
        handleError(err, format);
      }
    });

  return cmd;
}
