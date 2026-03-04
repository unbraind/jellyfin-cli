import { Command } from 'commander';
import { formatOutput } from '../formatters/index.js';
import { getSchema, getAvailableTypes } from './schema-defs.js';
import { createSchemaValidateCommand } from './schema-validate.js';
import { getConfig } from '../utils/config.js';
import {
  extractOpenApiOperations,
  fetchOpenApiDocumentWithOptions,
  filterOpenApiOperations,
  matchOperationsForCommandIntent,
  summarizeOpenApi,
} from '../utils/openapi.js';
import { generateCliToolSchemas } from '../utils/tool-schema.js';
import { parsePositiveInteger, resolveOutputFormat, type FormatOptions } from './schema-utils.js';
import { attachSchemaResearchSubcommand } from './schema-research.js';
import { attachSchemaCoverageSubcommand } from './schema-coverage-command.js';

export function createSchemaCommand(): Command {
  const cmd = new Command('schema');

  cmd
    .description('Output JSON schema for Toon format types (useful for LLMs)')
    .argument('[type]', 'Output type to get schema for (leave empty for all)')
    .option('-f, --format <format>', 'Output format (toon, json, table, raw, yaml, markdown)', 'toon')
    .action(function (this: Command, type, options: FormatOptions) {
      const outputFormat = resolveOutputFormat(this, options);
      try {
        const schema = getSchema(type);
        console.log(formatOutput(schema, outputFormat, 'schema'));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error(formatOutput({ error: message, available_types: getAvailableTypes() }, outputFormat, 'error'));
        process.exit(1);
      }
    });

  cmd.addCommand(createSchemaValidateCommand());
  attachSchemaResearchSubcommand(cmd);
  attachSchemaCoverageSubcommand(cmd);

  cmd
    .command('list')
    .description('List all available output types')
    .action(function (this: Command) {
      const outputFormat = resolveOutputFormat(this, {});
      console.log(formatOutput({ types: getAvailableTypes(), count: getAvailableTypes().length }, outputFormat, 'output_types'));
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
    .option('--read-only-ops', 'Filter to read-only safe operations (GET/HEAD/OPTIONS)')
    .option('--endpoint <path>', 'Preferred OpenAPI path (e.g. /api-docs/openapi.json)')
    .option('--for-command <path>', 'Infer likely operations for a CLI command path')
    .option('--limit <number>', 'Path operation list limit', '50')
    .action(async function (this: Command, options: FormatOptions & Record<string, unknown>) {
      const outputFormat = resolveOutputFormat(this, options);
      const limit = parsePositiveInteger(String(options.limit ?? '50'), 'Limit', outputFormat);

      const config = getConfig(options.name as string | undefined);
      if (!config.serverUrl) {
        console.error(formatOutput({ error: 'No server URL configured' }, outputFormat, 'error'));
        process.exit(1);
      }

      try {
        const result = await fetchOpenApiDocumentWithOptions(config, { endpointPath: options.endpoint as string | undefined });
        const summary = summarizeOpenApi(result.document);
        const allOperations = extractOpenApiOperations(result.document);
        const filteredOperations = filterOpenApiOperations(allOperations, {
          method: options.method as string | undefined,
          pathPrefix: options.pathPrefix as string | undefined,
          tag: options.tag as string | undefined,
          search: options.search as string | undefined,
          readOnlySafe: options.readOnlyOps ? true : undefined,
        });
        const commandMatches = options.forCommand ? matchOperationsForCommandIntent(filteredOperations, String(options.forCommand)) : [];
        const data: Record<string, unknown> = {
          source_path: result.sourcePath,
          server_url: config.serverUrl,
          server_version: summary.serverVersion,
          path_count: summary.pathCount,
          operation_count: summary.operationCount,
          top_tags: summary.topTags ?? [],
        };

        if (options.method || options.pathPrefix || options.tag || options.search || options.readOnlyOps) {
          data.operation_filters = {
            method: options.method ?? null,
            path_prefix: options.pathPrefix ?? null,
            tag: options.tag ?? null,
            search: options.search ?? null,
            read_only_ops: options.readOnlyOps ?? false,
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
    .option('--name <name>', 'Server name (used with --openapi-match)')
    .option('--endpoint <path>', 'Preferred OpenAPI path for --openapi-match (e.g. /api-docs/openapi.json)')
    .option('--openapi-match', 'Attach inferred OpenAPI operation candidates per tool')
    .option('--openapi-match-limit <number>', 'OpenAPI matches to include per tool when --openapi-match is enabled', '3')
    .option('--min-score <number>', 'Minimum OpenAPI match score for --openapi-match', '3')
    .option('--limit <number>', 'Schema list limit', '500')
    .action(async function (this: Command, options: FormatOptions & Record<string, unknown>) {
      const outputFormat = resolveOutputFormat(this, options);
      const limit = parsePositiveInteger(String(options.limit ?? '500'), 'Limit', outputFormat);
      const openApiMatchLimit = parsePositiveInteger(
        String(options.openapiMatchLimit ?? '3'),
        'OpenAPI match limit',
        outputFormat,
      );
      const minScore = parsePositiveInteger(String(options.minScore ?? '3'), 'Min score', outputFormat);

      const root = this.parent?.parent;
      if (!root) {
        console.error(formatOutput({ error: 'Could not access root command tree' }, outputFormat, 'error'));
        process.exit(1);
      }

      try {
        const allTools = generateCliToolSchemas(root, options.command as string | undefined);
        const sourceTools = allTools.slice(0, limit);
        let tools = sourceTools;
        let openApiMatchMeta:
          | {
            enabled: true;
            source_path: string;
            server_url: string;
            operation_count: number;
            min_score: number;
            match_limit: number;
          }
          | { enabled: false } = { enabled: false };

        if (options.openapiMatch) {
          const config = getConfig(options.name as string | undefined);
          if (!config.serverUrl) {
            console.error(formatOutput({ error: 'No server URL configured' }, outputFormat, 'error'));
            process.exit(1);
          }

          const openApiResult = await fetchOpenApiDocumentWithOptions(config, {
            endpointPath: options.endpoint as string | undefined,
          });
          const openApiOperations = extractOpenApiOperations(openApiResult.document);
          tools = sourceTools.map((tool) => {
            const commandIntent = tool.command.replace(/^jf\s+/i, '').trim();
            const matches = matchOperationsForCommandIntent(openApiOperations, commandIntent)
              .filter((candidate) => candidate.score >= minScore)
              .slice(0, openApiMatchLimit)
              .map((candidate) => ({
                method: candidate.method,
                path: candidate.path,
                operation_id: candidate.operationId ?? null,
                tags: candidate.tags,
                score: candidate.score,
                matched_on: candidate.matchedOn,
                read_only_safe: candidate.readOnlySafe,
              }));
            return {
              ...tool,
              openapi_matches: matches,
            };
          });

          openApiMatchMeta = {
            enabled: true,
            source_path: openApiResult.sourcePath,
            server_url: config.serverUrl,
            operation_count: openApiOperations.length,
            min_score: minScore,
            match_limit: openApiMatchLimit,
          };
        }

        const data = {
          tool_count: tools.length,
          total_tool_count: allTools.length,
          command_prefix: options.command ?? null,
          truncated: allTools.length > limit,
          openapi_matching: openApiMatchMeta,
          tools,
        };

        console.log(formatOutput(data, outputFormat, 'tool_schemas'));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Tool schema export failed';
        console.error(formatOutput({ error: message }, outputFormat, 'error'));
        process.exit(1);
      }
    });

  return cmd;
}
