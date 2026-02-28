import { Command } from 'commander';
import { createApiClient, handleError } from './utils.js';
import { toon } from '../formatters/index.js';

export function createYearsCommand(): Command {
  const cmd = new Command('years');

  cmd
    .command('list')
    .description('List all years')
    .option('-f, --format <format>', 'Output format')
    .option('--parent <id>', 'Parent ID')
    .option('--limit <number>', 'Limit', '100')
    .option('--sort <field>', 'Sort field', 'SortName')
    .option('--order <direction>', 'Sort order', 'Ascending')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const result = await client.getYears({
          parentId: options.parent,
          limit: parseInt(options.limit, 10),
          sortBy: options.sort,
          sortOrder: options.order,
        });
        const simplified = (result.Items ?? []).map((y) => ({
          id: y.Id,
          name: y.Name,
          year: y.ProductionYear,
          child_count: y.ChildCount,
        }));
        console.log(toon.formatToon(simplified, 'years'));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('get <year>')
    .description('Get items for a specific year')
    .option('-f, --format <format>', 'Output format')
    .action(async (year, options) => {
      const { client, format } = await createApiClient(options);
      try {
        const yearInfo = await client.getYear(parseInt(year, 10));
        console.log(toon.formatItem(yearInfo));
      } catch (err) {
        handleError(err, format);
      }
    });

  return cmd;
}
