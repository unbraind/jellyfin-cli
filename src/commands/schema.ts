import { Command } from 'commander';
import { formatOutput, toon } from '../formatters/index.js';
import { getSchema, getAvailableTypes } from './schema-defs.js';
import { getConfig } from '../utils/config.js';
import { fetchOpenApiDocument, summarizeOpenApi } from '../utils/openapi.js';
import { isOutputFormat, parseOutputFormat } from '../utils/output-format.js';
import { generateCliToolSchemas } from '../utils/tool-schema.js';

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

  cmd
    .command('openapi')
    .description('Fetch and summarize Jellyfin OpenAPI document from configured server')
    .option('-f, --format <format>', 'Output format (toon, json, table, raw, yaml, markdown)', 'toon')
    .option('--name <name>', 'Server name')
    .option('--include-paths', 'Include a sorted operation list')
    .option('--limit <number>', 'Path operation list limit', '50')
    .action(async (options) => {
      if (!isOutputFormat(options.format)) {
        console.error(formatToon({ error: `Invalid format: ${options.format}` }, 'error'));
        process.exit(1);
      }

      const outputFormat = parseOutputFormat(options.format, 'toon');
      const limit = parseInt(options.limit, 10);
      if (!Number.isFinite(limit) || limit <= 0) {
        console.error(formatOutput({ error: 'Limit must be a positive integer' }, outputFormat, 'error'));
        process.exit(1);
      }

      const config = getConfig(options.name);
      if (!config.serverUrl) {
        console.error(formatOutput({ error: 'No server URL configured' }, outputFormat, 'error'));
        process.exit(1);
      }

      try {
        const result = await fetchOpenApiDocument(config);
        const summary = summarizeOpenApi(result.document);
        const data: Record<string, unknown> = {
          source_path: result.sourcePath,
          server_url: config.serverUrl,
          server_version: summary.serverVersion,
          path_count: summary.pathCount,
          operation_count: summary.operationCount,
          top_tags: summary.topTags ?? [],
        };

        if (options.includePaths) {
          const paths = result.document.paths ?? {};
          const operations = Object.entries(paths)
            .flatMap(([path, pathItem]) =>
              Object.keys(pathItem ?? {})
                .filter((method) => ['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'trace'].includes(method.toLowerCase()))
                .map((method) => `${method.toUpperCase()} ${path}`),
            )
            .sort()
            .slice(0, limit);
          data.operations = operations;
          data.operations_truncated = operations.length === limit;
        }

        console.log(formatOutput(data, outputFormat, 'openapi_summary'));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'OpenAPI fetch failed';
        console.error(formatOutput({ error: message }, outputFormat, 'error'));
        process.exit(1);
      }
    });

  cmd
    .command('tools')
    .description('Export command tool schemas for LLM/function-calling workflows')
    .option('-f, --format <format>', 'Output format (toon, json, table, raw, yaml, markdown)', 'toon')
    .option('--command <prefix>', 'Optional command prefix filter, e.g. "items" or "users get"')
    .option('--limit <number>', 'Schema list limit', '500')
    .action(function (this: Command, options) {
      if (!isOutputFormat(options.format)) {
        console.error(formatToon({ error: `Invalid format: ${options.format}` }, 'error'));
        process.exit(1);
      }

      const outputFormat = parseOutputFormat(options.format, 'toon');
      const limit = parseInt(options.limit, 10);
      if (!Number.isFinite(limit) || limit <= 0) {
        console.error(formatOutput({ error: 'Limit must be a positive integer' }, outputFormat, 'error'));
        process.exit(1);
      }

      const root = this.parent?.parent;
      if (!root) {
        console.error(formatOutput({ error: 'Could not access root command tree' }, outputFormat, 'error'));
        process.exit(1);
      }

      const allTools = generateCliToolSchemas(root, options.command as string | undefined);
      const tools = allTools.slice(0, limit);
      const data = {
        tool_count: tools.length,
        total_tool_count: allTools.length,
        command_prefix: options.command ?? null,
        truncated: allTools.length > limit,
        tools,
      };

      console.log(formatOutput(data, outputFormat, 'tool_schemas'));
    });

  return cmd;
}
