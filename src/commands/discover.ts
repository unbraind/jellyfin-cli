import { Command } from 'commander';
import { createApiClient, handleError } from './utils.js';
import { toon } from '../formatters/index.js';

export function createDiscoverCommand(): Command {
  const cmd = new Command('discover');

  cmd
    .command('recommendations')
    .description('Get recommendations')
    .option('-f, --format <format>', 'Output format')
    .option('--categories <number>', 'Category limit', '6')
    .option('--items <number>', 'Items per category', '8')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const recommendations = await client.getRecommendations({
          categoryLimit: parseInt(options.categories, 10),
          itemLimit: parseInt(options.items, 10),
        });
        const simplified = recommendations.map((r) => ({
          baseline_item: r.BaselineItemName,
          category_id: r.CategoryId,
          type: r.RecommendationType,
          items: r.Items?.slice(0, 5).map((i) => ({
            id: i.Id,
            name: i.Name,
            type: i.Type,
            year: i.ProductionYear,
          })),
        }));
        console.log(toon.formatToon(simplified, 'recommendations'));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('mix <itemId>')
    .description('Get instant mix for an item')
    .option('-f, --format <format>', 'Output format')
    .option('--limit <number>', 'Limit', '50')
    .action(async (itemId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        const result = await client.getInstantMix(itemId, {
          limit: parseInt(options.limit, 10),
        });
        console.log(toon.formatItems(result.Items ?? []));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd.command('album-mix <albumId>').description('Get instant mix based on an album')
    .option('-f, --format <format>', 'Output format').option('--limit <number>', 'Limit', '50')
    .action(async (albumId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        const result = await client.getAlbumInstantMix(albumId, { limit: parseInt(options.limit, 10) });
        console.log(toon.formatItems(result.Items ?? []));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('song-mix <songId>').description('Get instant mix based on a song')
    .option('-f, --format <format>', 'Output format').option('--limit <number>', 'Limit', '50')
    .action(async (songId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        const result = await client.getSongInstantMix(songId, { limit: parseInt(options.limit, 10) });
        console.log(toon.formatItems(result.Items ?? []));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('trailers').description('Browse trailer items in the library')
    .option('-f, --format <format>', 'Output format').option('--limit <number>', 'Limit', '20')
    .option('--offset <number>', 'Start index', '0').option('--sort <field>', 'Sort field')
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

  return cmd;
}
