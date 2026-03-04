import { Command } from 'commander';
import { formatOutput } from '../formatters/index.js';
import { getConfig } from '../utils/config.js';
import {
  extractOpenApiOperations,
  fetchOpenApiDocumentWithOptions,
  filterOpenApiOperations,
  summarizeOpenApi,
} from '../utils/openapi.js';
import { suggestCommandFromOperation } from '../utils/openapi-suggestions.js';
import { generateCliToolSchemas } from '../utils/tool-schema.js';
import { mapOpenApiCoverageToTools, summarizeOperationsByTag } from './schema-coverage.js';
import {
  parseCoveragePercent,
  parsePositiveInteger,
  resolveOutputFormat,
  type FormatOptions,
} from './schema-utils.js';

export function attachSchemaCoverageSubcommand(cmd: Command): void {
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
    .option('--require-coverage <percent>', 'Exit with code 1 when coverage is below threshold')
    .option('--suggest-commands', 'Include suggested CLI command names for unmatched operations')
    .action(async function (this: Command, options: FormatOptions & Record<string, unknown>) {
      const outputFormat = resolveOutputFormat(this, options);
      const limit = parsePositiveInteger(String(options.limit ?? '50'), 'Limit', outputFormat);
      const minScore = parsePositiveInteger(String(options.minScore ?? '3'), 'Min score', outputFormat);
      const requiredCoverage =
        options.requireCoverage === undefined
          ? undefined
          : parseCoveragePercent(String(options.requireCoverage), outputFormat);

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
        const result = await fetchOpenApiDocumentWithOptions(config, {
          endpointPath: options.endpoint as string | undefined,
        });
        const summary = summarizeOpenApi(result.document);
        const allOperations = extractOpenApiOperations(result.document);
        const filteredOperations = filterOpenApiOperations(allOperations, {
          method: options.method as string | undefined,
          pathPrefix: options.pathPrefix as string | undefined,
          tag: options.tag as string | undefined,
          readOnlySafe: options.readOnlyOps ? true : undefined,
        });
        const tools = generateCliToolSchemas(root, options.commandPrefix as string | undefined);
        const coverageMapping = mapOpenApiCoverageToTools(filteredOperations, tools, minScore);
        const unmatchedTools = coverageMapping.unmatchedTools;

        const unmatched = filteredOperations.filter(
          (operation) => !coverageMapping.mappedOperationKeys.has(`${operation.method} ${operation.path}`),
        );
        const unmatchedByTag = summarizeOperationsByTag(unmatched);
        const coverage =
          filteredOperations.length === 0
            ? 100
            : Number(((coverageMapping.mappedOperationKeys.size / filteredOperations.length) * 100).toFixed(2));

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
          mapped_operation_count: coverageMapping.mappedOperationKeys.size,
          unmapped_operation_count: unmatched.length,
          unmapped_tool_count: unmatchedTools.length,
          coverage_percent: coverage,
          tool_scope_count: tools.length,
          mapped_tool_count: coverageMapping.mappedToolCount,
          min_score: minScore,
          required_coverage_percent: requiredCoverage ?? null,
          coverage_requirement_met: requiredCoverage === undefined ? null : coverage >= requiredCoverage,
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
          unmatched_tools: unmatchedTools.slice(0, limit),
          unmatched_tools_total: unmatchedTools.length,
          unmatched_tools_truncated: unmatchedTools.length > limit,
          unmatched_by_tag_total: unmatchedByTag.length,
          unmatched_by_tag: unmatchedByTag,
          summary: {
            operation_scope_count: filteredOperations.length,
            mapped_operation_count: coverageMapping.mappedOperationKeys.size,
            unmapped_operation_count: unmatched.length,
            unmapped_tool_count: unmatchedTools.length,
            coverage_percent: coverage,
            tool_scope_count: tools.length,
            mapped_tool_count: coverageMapping.mappedToolCount,
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
        if (requiredCoverage !== undefined && coverage < requiredCoverage) {
          console.error(
            formatOutput(
              {
                error: `Coverage ${coverage}% is below required threshold ${requiredCoverage}%`,
                coverage_percent: coverage,
                required_coverage_percent: requiredCoverage,
              },
              outputFormat,
              'error',
            ),
          );
          process.exit(1);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'OpenAPI coverage analysis failed';
        console.error(formatOutput({ error: message }, outputFormat, 'error'));
        process.exit(1);
      }
    });
}
