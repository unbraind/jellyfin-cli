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

  return cmd;
}
