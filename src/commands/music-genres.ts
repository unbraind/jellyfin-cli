import { Command } from 'commander';
import { createApiClient, handleError } from './utils.js';

/**
 * Builds the music genres command tree with validated options and actions.
 * @returns - The configured Commander command tree.
 */
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
      const { client, format, formatter } = await createApiClient(options);
      try {
        const result = await client.getMusicGenres({
          parentId: options.parent,
          limit: parseInt(options.limit, 10),
          sortBy: options.sort,
          sortOrder: options.order,
        });
        console.log(formatter.formatItems(result.Items ?? []));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('get <name>')
    .description('Get music genre by name')
    .option('-f, --format <format>', 'Output format')
    .action(async (name, options) => {
      const { client, format, formatter } = await createApiClient(options);
      try {
        const genre = await client.getMusicGenre(name);
        console.log(formatter.formatItem(genre));
      } catch (err) {
        handleError(err, format);
      }
    });

  return cmd;
}
