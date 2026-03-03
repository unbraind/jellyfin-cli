import { Command } from 'commander';
import { formatOutput, toon } from '../formatters/index.js';
import { getSchema, getAvailableTypes } from './schema-defs.js';
import { getConfig } from '../utils/config.js';
import {
  extractOpenApiOperations,
  fetchOpenApiDocument,
  filterOpenApiOperations,
  matchOperationsForCommandIntent,
  summarizeOpenApi,
} from '../utils/openapi.js';
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
    .option('--include-paths', 'Include operation details')
    .option('--method <method>', 'Filter operations by HTTP method')
    .option('--path-prefix <prefix>', 'Filter operations by path prefix')
    .option('--tag <tag>', 'Filter operations by exact tag')
    .option('--search <text>', 'Filter operations by path/summary/operationId/tags text')
    .option('--for-command <path>', 'Infer likely operations for a CLI command path')
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
        const allOperations = extractOpenApiOperations(result.document);
        const filteredOperations = filterOpenApiOperations(allOperations, {
          method: options.method as string | undefined,
          pathPrefix: options.pathPrefix as string | undefined,
          tag: options.tag as string | undefined,
          search: options.search as string | undefined,
        });
        const commandMatches = options.forCommand
          ? matchOperationsForCommandIntent(allOperations, String(options.forCommand))
          : [];
        const data: Record<string, unknown> = {
          source_path: result.sourcePath,
          server_url: config.serverUrl,
          server_version: summary.serverVersion,
          path_count: summary.pathCount,
          operation_count: summary.operationCount,
          top_tags: summary.topTags ?? [],
        };

        if (options.method || options.pathPrefix || options.tag || options.search) {
          data.operation_filters = {
            method: options.method ?? null,
            path_prefix: options.pathPrefix ?? null,
            tag: options.tag ?? null,
            search: options.search ?? null,
          };
          data.filtered_operation_count = filteredOperations.length;
        }

        if (options.includePaths) {
          data.operations = filteredOperations.slice(0, limit).map((operation) => ({
            method: operation.method,
            path: operation.path,
            operation_id: operation.operationId ?? null,
            tags: operation.tags,
            deprecated: operation.deprecated,
            read_only_safe: operation.readOnlySafe,
          }));
          data.operations_total = filteredOperations.length;
          data.operations_truncated = filteredOperations.length > limit;
        }

        if (options.forCommand) {
          data.command_intent = String(options.forCommand);
          data.command_match_note = 'Inferred from token similarity against OpenAPI path, tags, and operation metadata.';
          data.command_matches = commandMatches.slice(0, limit).map((operation) => ({
            method: operation.method,
            path: operation.path,
            operation_id: operation.operationId ?? null,
            tags: operation.tags,
            score: operation.score,
            matched_on: operation.matchedOn,
            read_only_safe: operation.readOnlySafe,
          }));
          data.command_matches_total = commandMatches.length;
          data.command_matches_truncated = commandMatches.length > limit;
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
