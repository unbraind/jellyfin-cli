import { Command } from 'commander';
import { createApiClient, handleError } from './utils.js';
import { toon } from '../formatters/index.js';

export function createReportsCommand(): Command {
  const cmd = new Command('reports');
  cmd.description('Jellyfin Reports plugin (requires Reports plugin installed)');

  cmd.command('activities')
    .description('Get activity report (shows auth events, playback etc.)')
    .option('-f, --format <format>', 'Output format')
    .option('--limit <number>', 'Limit', '20')
    .option('--offset <number>', 'Start index', '0')
    .option('--min-date <date>', 'Minimum date (ISO format)')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const result = await client.getActivityReport({
          limit: parseInt(options.limit, 10),
          startIndex: parseInt(options.offset, 10),
          minDate: options.minDate,
        });
        const rows = (result.Rows ?? []).map((row) => ({
          id: row.Id,
          type: row.RowType,
          columns: row.Columns?.map((c) => c.Name).filter(Boolean),
        }));
        console.log(toon.formatToon({ total: result.TotalRecordCount, rows }, 'activity_report'));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('items')
    .description('Get items report (requires Reports plugin)')
    .option('-f, --format <format>', 'Output format')
    .option('--view <view>', 'Report view (ReportData, ReportActivities)', 'ReportData')
    .option('--display <type>', 'Display type (Screen, Export, Screen,Export)', 'Screen')
    .option('--limit <number>', 'Limit', '50')
    .option('--offset <number>', 'Start index', '0')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const result = await client.getItemsReport({
          reportView: options.view,
          displayType: options.display,
          limit: parseInt(options.limit, 10),
          startIndex: parseInt(options.offset, 10),
        });
        const rows = (result.Rows ?? []).map((row) => ({
          columns: row.Columns?.map((c) => c.Name).filter(Boolean),
        }));
        console.log(toon.formatToon({ total: result.TotalRecordCount, rows }, 'items_report'));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('headers')
    .description('Get report column headers (requires Reports plugin)')
    .option('-f, --format <format>', 'Output format')
    .option('--view <view>', 'Report view', 'ReportData')
    .option('--display <type>', 'Display type', 'Screen')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const headers = await client.getReportHeaders({
          reportView: options.view,
          displayType: options.display,
        });
        console.log(toon.formatToon(headers.map((h) => ({
          name: h.Name,
          field: h.FieldName,
          display_type: h.DisplayType,
        })), 'report_headers'));
      } catch (err) { handleError(err, format); }
    });

  return cmd;
}
