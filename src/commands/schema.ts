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
import { suggestCommandFromOperation } from '../utils/openapi-suggestions.js';
import { generateCliToolSchemas } from '../utils/tool-schema.js';
import { parsePositiveInteger, resolveOutputFormat, type FormatOptions } from './schema-utils.js';
import { summarizeOperationsByTag } from './schema-coverage.js';

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

  cmd
    .command('list')
    .description('List all available output types')
    .action(function (this: Command) {
      const outputFormat = resolveOutputFormat(this, {});
      console.log(formatOutput({
        types: getAvailableTypes(),
        count: getAvailableTypes().length,
      }, outputFormat, 'output_types'));
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
        const commandMatches = options.forCommand
          ? matchOperationsForCommandIntent(filteredOperations, String(options.forCommand))
          : [];
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
    .option('--limit <number>', 'Schema list limit', '500')
    .action(function (this: Command, options: FormatOptions & Record<string, unknown>) {
      const outputFormat = resolveOutputFormat(this, options);
      const limit = parsePositiveInteger(String(options.limit ?? '500'), 'Limit', outputFormat);

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

  cmd
    .command('coverage')
    .description('Estimate live OpenAPI operation coverage by existing CLI command intents')
    .option('-f, --format <format>', 'Output format (toon, json, table, raw, yaml, markdown)', 'toon')
    .option('--name <name>', 'Server name')
    .option('--method <method>', 'Filter operations by HTTP method')
    .option('--tag <tag>', 'Filter operations by exact tag')
    .option('--path-prefix <prefix>', 'Filter operations by path prefix')
    .option('--read-only-ops', 'Filter to read-only safe operations (GET/HEAD/OPTIONS)')
    .option('--endpoint <path>', 'Preferred OpenAPI path (e.g. /api-docs/openapi.json)')
    .option('--limit <number>', 'Unmatched operation sample limit', '50')
    .option('--command-prefix <prefix>', 'Limit command intents to a CLI command prefix (e.g. "items")')
    .option('--min-score <number>', 'Minimum operation intent score required for a mapping', '3')
    .option('--suggest-commands', 'Include suggested CLI command names for unmatched operations')
    .action(async function (this: Command, options: FormatOptions & Record<string, unknown>) {
      const outputFormat = resolveOutputFormat(this, options);
      const limit = parsePositiveInteger(String(options.limit ?? '50'), 'Limit', outputFormat);
      const minScore = parsePositiveInteger(String(options.minScore ?? '3'), 'Min score', outputFormat);

      const config = getConfig(options.name as string | undefined);
      if (!config.serverUrl) {
        console.error(formatOutput({ error: 'No server URL configured' }, outputFormat, 'error'));
        process.exit(1);
      }

      const root = this.parent?.parent;
      if (!root) {
        console.error(formatOutput({ error: 'Could not access root command tree' }, outputFormat, 'error'));
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
          readOnlySafe: options.readOnlyOps ? true : undefined,
        });
        const tools = generateCliToolSchemas(root, options.commandPrefix as string | undefined);
        const mappedOperationKeys = new Set<string>();
        let mappedToolCount = 0;

        for (const tool of tools) {
          const commandIntent = tool.command.replace(/^jf\s+/i, '').trim();
          const matches = matchOperationsForCommandIntent(filteredOperations, commandIntent).filter(
            (candidate) => candidate.score >= minScore,
          );
          if (matches.length === 0) {
            continue;
          }

          mappedToolCount += 1;
          const primaryMatch = matches.find(
            (candidate) => !mappedOperationKeys.has(`${candidate.method} ${candidate.path}`),
          ) ?? matches[0];
          mappedOperationKeys.add(`${primaryMatch.method} ${primaryMatch.path}`);

          const extraScoreThreshold = Math.max(minScore, primaryMatch.score - 2);
          for (const match of matches) {
            const key = `${match.method} ${match.path}`;
            if (key === `${primaryMatch.method} ${primaryMatch.path}`) {
              continue;
            }
            if (match.score < extraScoreThreshold) {
              continue;
            }
            if (match.matchedOn.length < 2) {
              continue;
            }
            mappedOperationKeys.add(key);
          }
        }

        const unmatched = filteredOperations.filter(
          (operation) => !mappedOperationKeys.has(`${operation.method} ${operation.path}`),
        );
        const unmatchedByTag = summarizeOperationsByTag(unmatched);
        const coverage =
          filteredOperations.length === 0
            ? 100
            : Number(((mappedOperationKeys.size / filteredOperations.length) * 100).toFixed(2));

        const data = {
          source_path: result.sourcePath,
          server_url: config.serverUrl,
          server_version: summary.serverVersion,
          path_count: summary.pathCount,
          operation_count: summary.operationCount,
          filters: {
            method: options.method ?? null,
            path_prefix: options.pathPrefix ?? null,
            tag: options.tag ?? null,
            read_only_ops: options.readOnlyOps ?? false,
          },
          operation_scope_count: filteredOperations.length,
          mapped_operation_count: mappedOperationKeys.size,
          unmapped_operation_count: unmatched.length,
          coverage_percent: coverage,
          tool_scope_count: tools.length,
          mapped_tool_count: mappedToolCount,
          min_score: minScore,
          command_prefix: options.commandPrefix ?? null,
          unmatched_operations: unmatched.slice(0, limit).map((operation) => ({
            method: operation.method,
            path: operation.path,
            operation_id: operation.operationId ?? null,
            tags: operation.tags,
            read_only_safe: operation.readOnlySafe,
            deprecated: operation.deprecated,
            suggested_command: options.suggestCommands
              ? suggestCommandFromOperation(operation).suggestedCommand
              : undefined,
          })),
          unmatched_operations_total: unmatched.length,
          unmatched_operations_truncated: unmatched.length > limit,
          unmatched_by_tag_total: unmatchedByTag.length,
          unmatched_by_tag: unmatchedByTag,
          summary: {
            operation_scope_count: filteredOperations.length,
            mapped_operation_count: mappedOperationKeys.size,
            unmapped_operation_count: unmatched.length,
            coverage_percent: coverage,
            tool_scope_count: tools.length,
            mapped_tool_count: mappedToolCount,
          },
          suggested_commands: options.suggestCommands
            ? unmatched.slice(0, limit).map((operation) => {
              const suggestion = suggestCommandFromOperation(operation);
              return {
                method: operation.method,
                path: operation.path,
                suggested_command: suggestion.suggestedCommand,
                intent: suggestion.intent,
                confidence: suggestion.confidence,
                rationale: suggestion.rationale,
              };
            })
            : undefined,
        };

        console.log(formatOutput(data, outputFormat, 'openapi_coverage'));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'OpenAPI coverage analysis failed';
        console.error(formatOutput({ error: message }, outputFormat, 'error'));
        process.exit(1);
      }
    });

  return cmd;
}
