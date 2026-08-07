import { Command } from 'commander';
import { createApiClient, handleError } from './utils.js';
import { parseNonNegativeInt, parsePositiveInt } from './number-options.js';

/**
 * Builds the persons command tree with validated options and actions.
 * @returns - The configured Commander command tree.
 */
export function createPersonsCommand(): Command {
  const cmd = new Command('persons');

  cmd
    .command('list')
    .description('List all persons (actors, directors, writers, etc.)')
    .option('-f, --format <format>', 'Output format')
    .option('--parent <id>', 'Parent library ID')
    .option('--limit <number>', 'Maximum results', '100')
    .option('--offset <number>', 'Start index', '0')
    .option('--search <term>', 'Search by name on the server')
    .option('--name-starts-with <value>', 'Filter names by prefix (Jellyfin 12+)')
    .option('--name-less-than <value>', 'Filter names before this value (Jellyfin 12+)')
    .option('--name-starts-with-or-greater <value>', 'Filter names at or after this prefix (Jellyfin 12+)')
    .action(async (options) => {
      const { client, format, formatter } = await createApiClient(options);
      try {
        const result = await client.getPersons({
          parentId: options.parent,
          limit: parsePositiveInt(options.limit, 'Limit'),
          startIndex: parseNonNegativeInt(options.offset, 'Offset'),
          searchTerm: options.search,
          nameStartsWith: options.nameStartsWith,
          nameLessThan: options.nameLessThan,
          nameStartsWithOrGreater: options.nameStartsWithOrGreater,
        });
        console.log(formatter.formatItems(result.Items ?? []));
      } catch (err) { handleError(err, format); }
    });

  cmd
    .command('get <name>')
    .description('Get a person by name')
    .option('-f, --format <format>', 'Output format')
    .action(async (name, options) => {
      const { client, format, formatter } = await createApiClient(options);
      try {
        const person = await client.getPersonByName(name);
        console.log(formatter.formatItem(person));
      } catch (err) { handleError(err, format); }
    });

  return cmd;
}
