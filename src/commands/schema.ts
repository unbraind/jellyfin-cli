import { Command } from 'commander';
import { toon } from '../formatters/index.js';
import { getSchema, getAvailableTypes } from './schema-defs.js';

const formatToon = toon.formatToon;

export function createSchemaCommand(): Command {
  const cmd = new Command('schema');

  cmd
    .description('Output JSON schema for Toon format types (useful for LLMs)')
    .argument('[type]', 'Output type to get schema for (leave empty for all)')
    .option('-f, --format <format>', 'Output format (toon, json)', 'toon')
    .action((type, options) => {
      try {
        const schema = getSchema(type);
        if (options.format === 'json') {
          console.log(JSON.stringify(schema, null, 2));
        } else {
          console.log(formatToon(schema, 'schema'));
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error(formatToon({ error: message, available_types: getAvailableTypes() }, 'error'));
        process.exit(1);
      }
    });

  cmd
    .command('list')
    .description('List all available output types')
    .action(() => {
      console.log(formatToon({
        types: getAvailableTypes(),
        count: getAvailableTypes().length,
      }, 'output_types'));
    });

  return cmd;
}
