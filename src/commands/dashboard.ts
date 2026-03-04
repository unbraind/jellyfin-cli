import { Command } from 'commander';
import { createApiClient, formatToon, handleError } from './utils.js';

function parseMainMenuFilter(value: string): boolean {
  return value.trim().toLowerCase() === 'true';
}

export function createDashboardCommand(): Command {
  const cmd = new Command('dashboard');

  cmd
    .command('pages')
    .description('List dashboard configuration pages')
    .option('-f, --format <format>', 'Output format')
    .option(
      '--main-menu <true|false>',
      'Filter by main menu availability',
      parseMainMenuFilter,
    )
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const pages = await client.getDashboardConfigurationPages(options.mainMenu);
        console.log(formatToon(pages ?? [], format, 'dashboard_pages'));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('page <name>')
    .description('Get dashboard configuration page source')
    .option('-f, --format <format>', 'Output format')
    .action(async (name: string, options) => {
      const { client, format } = await createApiClient(options);
      try {
        const content = await client.getDashboardConfigurationPage(name);
        console.log(formatToon({ name, content }, format, 'dashboard_page'));
      } catch (err) {
        handleError(err, format);
      }
    });

  return cmd;
}
