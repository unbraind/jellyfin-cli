import { Command } from 'commander';
import { createApiClient, handleError } from './utils.js';
import { toon } from '../formatters/index.js';

export function createArtistsCommand(): Command {
  const cmd = new Command('artists');

  cmd
    .command('list')
    .description('List all artists')
    .option('-f, --format <format>', 'Output format')
    .option('--parent <id>', 'Parent library ID')
    .option('--limit <number>', 'Maximum results', '100')
    .option('--offset <number>', 'Start index', '0')
    .option('--sort <field>', 'Sort field (e.g. SortName, DateCreated)')
    .option('--order <dir>', 'Sort order (Ascending, Descending)')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const result = await client.getArtists({
          parentId: options.parent,
          limit: parseInt(options.limit, 10),
          sortBy: options.sort,
          sortOrder: options.order,
        });
        console.log(toon.formatItems(result.Items ?? []));
      } catch (err) { handleError(err, format); }
    });

  cmd
    .command('album-artists')
    .description('List all album artists')
    .option('-f, --format <format>', 'Output format')
    .option('--parent <id>', 'Parent library ID')
    .option('--limit <number>', 'Maximum results', '100')
    .option('--sort <field>', 'Sort field')
    .option('--order <dir>', 'Sort order')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const result = await client.getAlbumArtists({
          parentId: options.parent,
          limit: parseInt(options.limit, 10),
          sortBy: options.sort,
          sortOrder: options.order,
        });
        console.log(toon.formatItems(result.Items ?? []));
      } catch (err) { handleError(err, format); }
    });

  cmd
    .command('get <name>')
    .description('Get an artist by name')
    .option('-f, --format <format>', 'Output format')
    .action(async (name, options) => {
      const { client, format } = await createApiClient(options);
      try {
        const artist = await client.getArtistByName(name);
        console.log(toon.formatItem(artist));
      } catch (err) { handleError(err, format); }
    });

  return cmd;
}
