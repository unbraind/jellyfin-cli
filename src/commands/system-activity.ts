import type { Command } from 'commander';
import {
  ACTIVITY_LOG_SEVERITIES,
  ACTIVITY_LOG_SORT_FIELDS,
  SORT_ORDERS,
  type ActivityLogSeverity,
  type ActivityLogSortField,
  type SortOrder,
} from '../types/index.js';
import { parseNonNegativeInt, parsePositiveInt } from './number-options.js';
import { createApiClient, formatToon, handleError } from './utils.js';

/**
 * Adds the fully filterable Jellyfin activity-log command to the system tree.
 * @param command - Parent system command.
 */
export function addSystemActivityCommand(command: Command): void {
  command
    .command('activity')
    .description('Get activity log')
    .option('-f, --format <format>', 'Output format')
    .option('--limit <number>', 'Number of entries', '50')
    .option('--start <number>', 'Start index', '0')
    .option('--min-date <date>', 'Minimum date (ISO format)')
    .option('--max-date <date>', 'Maximum date (ISO format; Jellyfin 12+)')
    .option('--has-user', 'Only show entries with user ID')
    .option('--name <value>', 'Filter by activity name (Jellyfin 12+)')
    .option('--overview <value>', 'Filter by overview (Jellyfin 12+)')
    .option('--short-overview <value>', 'Filter by short overview (Jellyfin 12+)')
    .option('--type <value>', 'Filter by activity type (Jellyfin 12+)')
    .option('--item <id>', 'Filter by item ID (Jellyfin 12+)')
    .option('--username <value>', 'Filter by username (Jellyfin 12+)')
    .option('--severity <level>', 'Filter by Trace, Debug, Information, Warning, Error, Critical, or None (Jellyfin 12+)')
    .option('--sort <fields>', 'ActivityLogSortBy fields (comma-separated; Jellyfin 12+)')
    .option('--order <directions>', 'Ascending or Descending (comma-separated; Jellyfin 12+)')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const severity = options.severity as ActivityLogSeverity | undefined;
        const sortBy = options.sort?.split(',') as ActivityLogSortField[] | undefined;
        const sortOrder = options.order?.split(',') as SortOrder[] | undefined;
        if (severity && !ACTIVITY_LOG_SEVERITIES.includes(severity)) {
          throw new Error(`Invalid severity '${options.severity}'`);
        }
        if (sortBy?.some((field) => !ACTIVITY_LOG_SORT_FIELDS.includes(field))) {
          throw new Error(`Invalid activity sort field '${options.sort}'`);
        }
        if (sortOrder?.some((order) => !SORT_ORDERS.includes(order))) {
          throw new Error(`Invalid sort order '${options.order}'`);
        }
        const result = await client.getActivityLog({
          limit: parsePositiveInt(options.limit, 'Limit'),
          startIndex: parseNonNegativeInt(options.start, 'Start index'),
          minDate: options.minDate,
          maxDate: options.maxDate,
          hasUserId: options.hasUser,
          name: options.name,
          overview: options.overview,
          shortOverview: options.shortOverview,
          type: options.type,
          itemId: options.item,
          username: options.username,
          severity,
          sortBy,
          sortOrder,
        });
        console.log(formatToon(result.Items ?? [], format, 'activity_log'));
      } catch (err) {
        handleError(err, format);
      }
    });
}
