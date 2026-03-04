import { Command } from 'commander';
import { formatOutput } from '../formatters/index.js';
import { getConfig } from '../utils/config.js';
import {
  extractOpenApiOperations,
  fetchOpenApiDocumentWithOptions,
  filterOpenApiOperations,
  matchOperationsForCommandIntent,
} from '../utils/openapi.js';
import { suggestCommandFromOperation } from '../utils/openapi-suggestions.js';
import { generateCliToolSchemas } from '../utils/tool-schema.js';
import { parsePositiveInteger, resolveOutputFormat, type FormatOptions } from './schema-utils.js';
import { mapOpenApiCoverageToTools } from './schema-coverage.js';

type SuggestActionOptions = FormatOptions &
  Record<string, unknown> & {
    endpoint?: string | undefined;
    forCommand?: string | undefined;
    limit?: string | undefined;
    method?: string | undefined;
    minScore?: string | undefined;
    name?: string | undefined;
    pathPrefix?: string | undefined;
    readOnlyOps?: boolean | undefined;
    search?: string | undefined;
    tag?: string | undefined;
  };

export function attachSchemaSuggestSubcommand(cmd: Command): void {
  cmd
    .command('suggest')
    .description('Suggest CLI command patterns from live Jellyfin OpenAPI metadata')
    .option('-f, --format <format>', 'Output format (toon, json, table, raw, yaml, markdown)', 'toon')
    .option('--name <name>', 'Server name')
    .option('--endpoint <path>', 'Preferred OpenAPI path (e.g. /api-docs/openapi.json)')
    .option('--for-command <path>', 'Intent to match against OpenAPI, e.g. "users list"')
    .option('--method <method>', 'Filter operations by HTTP method')
    .option('--path-prefix <prefix>', 'Filter operations by path prefix')
    .option('--tag <tag>', 'Filter operations by exact tag')
    .option('--search <text>', 'Filter operations by path/summary/operationId/tags text')
    .option('--read-only-ops', 'Filter to read-only safe operations (GET/HEAD/OPTIONS)')
    .option('--min-score <number>', 'Minimum operation intent score used by gap mapping mode', '3')
    .option('--limit <number>', 'Suggestion list limit', '20')
    .action(async function (this: Command, options: SuggestActionOptions) {
      const outputFormat = resolveOutputFormat(this, options);
      const limit = parsePositiveInteger(String(options.limit ?? '20'), 'Limit', outputFormat);
      const minScore = parsePositiveInteger(String(options.minScore ?? '3'), 'Min score', outputFormat);
      const config = getConfig(options.name);

      if (!config.serverUrl) {
        console.error(formatOutput({ error: 'No server URL configured' }, outputFormat, 'error'));
        process.exit(1);
      }

      try {
        const openApiResult = await fetchOpenApiDocumentWithOptions(config, {
          endpointPath: options.endpoint,
        });
        const allOperations = extractOpenApiOperations(openApiResult.document);
        const operations = filterOpenApiOperations(allOperations, {
          method: options.method,
          pathPrefix: options.pathPrefix,
          tag: options.tag,
          search: options.search,
          readOnlySafe: options.readOnlyOps ? true : undefined,
        });
        const intent = options.forCommand?.trim();

        if (intent && intent.length > 0) {
          const matches = matchOperationsForCommandIntent(operations, intent);
          const suggestions = matches.slice(0, limit).map((operation) => {
            const suggestion = suggestCommandFromOperation(operation);
            return {
              method: operation.method,
              path: operation.path,
              operation_id: operation.operationId ?? null,
              tags: operation.tags,
              score: operation.score,
              matched_on: operation.matchedOn,
              read_only_safe: operation.readOnlySafe,
              suggested_command: suggestion.suggestedCommand,
              confidence: suggestion.confidence,
              inferred_intent: suggestion.intent,
              rationale: suggestion.rationale,
            };
          });

          const data = {
            source_path: openApiResult.sourcePath,
            server_url: config.serverUrl,
            mode: 'intent',
            command_intent: intent,
            operation_scope_count: operations.length,
            suggestions_total: matches.length,
            truncated: matches.length > limit,
            suggestions,
          };
          console.log(formatOutput(data, outputFormat, 'openapi_command_suggestions'));
          return;
        }

        const root = this.parent?.parent;
        if (!root) {
          console.error(formatOutput({ error: 'Could not access root command tree' }, outputFormat, 'error'));
          process.exit(1);
        }

        const tools = generateCliToolSchemas(root);
        const coverage = mapOpenApiCoverageToTools(operations, tools, minScore);
        const unmatchedOperations = operations.filter(
          (operation) => !coverage.mappedOperationKeys.has(`${operation.method} ${operation.path}`),
        );
        const suggestions = unmatchedOperations.slice(0, limit).map((operation) => {
          const suggestion = suggestCommandFromOperation(operation);
          return {
            method: operation.method,
            path: operation.path,
            operation_id: operation.operationId ?? null,
            tags: operation.tags,
            read_only_safe: operation.readOnlySafe,
            suggested_command: suggestion.suggestedCommand,
            confidence: suggestion.confidence,
            inferred_intent: suggestion.intent,
            rationale: suggestion.rationale,
          };
        });

        const data = {
          source_path: openApiResult.sourcePath,
          server_url: config.serverUrl,
          mode: 'coverage_gap',
          min_score: minScore,
          operation_scope_count: operations.length,
          mapped_operation_count: coverage.mappedOperationKeys.size,
          unmatched_operation_count: unmatchedOperations.length,
          unmatched_tools_total: coverage.unmatchedTools.length,
          suggestions_total: unmatchedOperations.length,
          truncated: unmatchedOperations.length > limit,
          suggestions,
        };
        console.log(formatOutput(data, outputFormat, 'openapi_command_suggestions'));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'OpenAPI command suggestion failed';
        console.error(formatOutput({ error: message }, outputFormat, 'error'));
        process.exit(1);
      }
    });
}
