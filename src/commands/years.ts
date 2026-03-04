import { Command } from 'commander';
import { createApiClient, formatItem, formatToon, handleError } from './utils.js';

function parseLimit(value: string | undefined): number {
  const parsed = parseInt(value ?? '100', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 100;
}

function isDescending(sortOrder?: string): boolean {
  return sortOrder?.toLowerCase() === 'descending';
}

function normalizeYears(
  years: number[] | null | undefined,
  limit: number,
  sortOrder?: string,
): Array<{ id: string; name: string; year: number; child_count: null }> {
  const unique = Array.from(
    new Set((years ?? []).filter((year): year is number => Number.isInteger(year) && year > 0)),
  );
  unique.sort((a, b) => (isDescending(sortOrder) ? b - a : a - b));
  return unique.slice(0, limit).map((year) => ({
    id: String(year),
    name: String(year),
    year,
    child_count: null,
  }));
}

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
        const limit = parseLimit(options.limit);
        const sortOrder = isDescending(options.order) ? 'Descending' : 'Ascending';

        // Prefer the lightweight read-only filters endpoint first. It returns only year values
        // and avoids expensive /Years scans on large libraries.
        try {
          const filters = await client.getQueryFilters2({
            parentId: options.parent,
          });
          const yearEntries = normalizeYears(filters.Years, limit, sortOrder);
          if (yearEntries.length > 0) {
            console.log(formatToon(yearEntries, format, 'years'));
            return;
          }
        } catch {
          // Fallback to /Years endpoint when Filters2 is unavailable.
        }

        const result = await client.getYears({
          parentId: options.parent,
          limit,
          sortBy: options.sort,
          sortOrder,
        });
        const simplified = (result.Items ?? []).map((y) => ({
          id: y.Id,
          name: y.Name,
          year: y.ProductionYear,
          child_count: y.ChildCount,
        }));
        console.log(formatToon(simplified, format, 'years'));
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
        console.log(formatItem(yearInfo, format));
      } catch (err) {
        handleError(err, format);
      }
    });

  return cmd;
}
