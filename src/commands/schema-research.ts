import { Command } from 'commander';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { formatOutput } from '../formatters/index.js';
import { getConfig } from '../utils/config.js';
import {
  extractOpenApiOperations,
  fetchOpenApiDocumentWithOptions,
  filterOpenApiOperations,
  matchOperationsForCommandIntent,
  summarizeOpenApi,
  type OpenApiOperationEntry,
} from '../utils/openapi.js';
import { generateCliToolSchemas } from '../utils/tool-schema.js';
import {
  parseCoveragePercent,
  parsePositiveInteger,
  resolveOutputFormat,
  type FormatOptions,
} from './schema-utils.js';
import { summarizeOperationsByTag } from './schema-coverage.js';

type CoverageSnapshot = {
  operation_scope_count: number;
  mapped_operation_count: number;
  unmapped_operation_count: number;
  coverage_percent: number;
  tool_scope_count: number;
  mapped_tool_count: number;
  unmatched_operations_total: number;
  unmatched_by_tag_total: number;
  unmatched_by_tag: Array<{ tag: string; operations: number; sample_paths: string[] }>;
  unmatched_operations?: Array<{
    method: string;
    path: string;
    operation_id: string | null;
    tags: string[];
    read_only_safe: boolean;
    deprecated: boolean;
  }>;
};

function buildCoverageSnapshot(
  operations: OpenApiOperationEntry[],
  commandIntentFilter: string | undefined,
  root: Command,
  minScore: number,
  includeUnmatched: boolean,
  unmatchedLimit: number,
): CoverageSnapshot {
  const tools = generateCliToolSchemas(root, commandIntentFilter);
  const mappedOperationKeys = new Set<string>();
  let mappedToolCount = 0;

  for (const tool of tools) {
    const commandIntent = tool.command.replace(/^jf\s+/i, '').trim();
    const matches = matchOperationsForCommandIntent(operations, commandIntent).filter(
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
      if (match.score < extraScoreThreshold || match.matchedOn.length < 2) {
        continue;
      }
      mappedOperationKeys.add(key);
    }
  }

  const unmatched = operations.filter((operation) => !mappedOperationKeys.has(`${operation.method} ${operation.path}`));
  const unmatchedByTag = summarizeOperationsByTag(unmatched);
  const coveragePercent =
    operations.length === 0
      ? 100
      : Number(((mappedOperationKeys.size / operations.length) * 100).toFixed(2));

  return {
    operation_scope_count: operations.length,
    mapped_operation_count: mappedOperationKeys.size,
    unmapped_operation_count: unmatched.length,
    coverage_percent: coveragePercent,
    tool_scope_count: tools.length,
    mapped_tool_count: mappedToolCount,
    unmatched_operations_total: unmatched.length,
    unmatched_by_tag_total: unmatchedByTag.length,
    unmatched_by_tag: unmatchedByTag,
    unmatched_operations: includeUnmatched
      ? unmatched.slice(0, unmatchedLimit).map((operation) => ({
        method: operation.method,
        path: operation.path,
        operation_id: operation.operationId ?? null,
        tags: operation.tags,
        read_only_safe: operation.readOnlySafe,
        deprecated: operation.deprecated,
      }))
      : undefined,
  };
}

export function attachSchemaResearchSubcommand(cmd: Command): void {
  cmd
    .command('research')
    .description('Create an agent-friendly OpenAPI + coverage research snapshot from a live server')
    .option('-f, --format <format>', 'Output format (toon, json, table, raw, yaml, markdown)', 'toon')
    .option('--name <name>', 'Server name')
    .option('--method <method>', 'Filter operations by HTTP method')
    .option('--tag <tag>', 'Filter operations by exact tag')
    .option('--path-prefix <prefix>', 'Filter operations by path prefix')
    .option('--endpoint <path>', 'Preferred OpenAPI path (e.g. /api-docs/openapi.json)')
    .option('--command-prefix <prefix>', 'Limit command intents to a CLI command prefix (e.g. "items")')
    .option('--min-score <number>', 'Minimum operation intent score required for a mapping', '3')
    .option('--require-coverage <percent>', 'Exit with code 1 when full/read-only coverage is below threshold')
    .option('--include-unmatched', 'Include unmatched operation sample arrays in output')
    .option('--limit <number>', 'Unmatched operation sample limit', '20')
    .option('--save <path>', 'Write snapshot payload to a JSON file for CI/automation workflows')
    .action(async function (this: Command, options: FormatOptions & Record<string, unknown>) {
      const outputFormat = resolveOutputFormat(this, options);
      const minScore = parsePositiveInteger(String(options.minScore ?? '3'), 'Min score', outputFormat);
      const limit = parsePositiveInteger(String(options.limit ?? '20'), 'Limit', outputFormat);
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
        const result = await fetchOpenApiDocumentWithOptions(config, { endpointPath: options.endpoint as string | undefined });
        const summary = summarizeOpenApi(result.document);
        const allOperations = extractOpenApiOperations(result.document);
        const baseFilteredOperations = filterOpenApiOperations(allOperations, {
          method: options.method as string | undefined,
          pathPrefix: options.pathPrefix as string | undefined,
          tag: options.tag as string | undefined,
        });
        const readOnlyFilteredOperations = filterOpenApiOperations(baseFilteredOperations, { readOnlySafe: true });
        const includeUnmatched = options.includeUnmatched ? true : false;
        const commandPrefix = options.commandPrefix as string | undefined;

        const fullCoverage = buildCoverageSnapshot(
          baseFilteredOperations,
          commandPrefix,
          root,
          minScore,
          includeUnmatched,
          limit,
        );
        const readOnlyCoverage = buildCoverageSnapshot(
          readOnlyFilteredOperations,
          commandPrefix,
          root,
          minScore,
          includeUnmatched,
          limit,
        );

        const data = {
          source_path: result.sourcePath,
          server_url: config.serverUrl,
          server_version: summary.serverVersion,
          path_count: summary.pathCount,
          operation_count: summary.operationCount,
          filters: {
            method: options.method ?? null,
            tag: options.tag ?? null,
            path_prefix: options.pathPrefix ?? null,
          },
          min_score: minScore,
          required_coverage_percent: requiredCoverage ?? null,
          coverage_requirement_met:
            requiredCoverage === undefined
              ? null
              : fullCoverage.coverage_percent >= requiredCoverage &&
                readOnlyCoverage.coverage_percent >= requiredCoverage,
          command_prefix: commandPrefix ?? null,
          include_unmatched: includeUnmatched,
          full_scope: fullCoverage,
          read_only_scope: readOnlyCoverage,
          saved_to: null as string | null,
        };

        const savePath = options.save as string | undefined;
        if (savePath) {
          const resolvedSavePath = resolve(savePath);
          mkdirSync(dirname(resolvedSavePath), { recursive: true });
          writeFileSync(`${resolvedSavePath}`, `${JSON.stringify(data, null, 2)}\n`, 'utf-8');
          data.saved_to = resolvedSavePath;
        }

        console.log(formatOutput(data, outputFormat, 'openapi_research'));
        if (
          requiredCoverage !== undefined &&
          (fullCoverage.coverage_percent < requiredCoverage ||
            readOnlyCoverage.coverage_percent < requiredCoverage)
        ) {
          console.error(
            formatOutput(
              {
                error:
                  'Coverage requirement not met for one or more scopes (full_scope/read_only_scope)',
                required_coverage_percent: requiredCoverage,
                full_scope_coverage_percent: fullCoverage.coverage_percent,
                read_only_scope_coverage_percent: readOnlyCoverage.coverage_percent,
              },
              outputFormat,
              'error',
            ),
          );
          process.exit(1);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'OpenAPI research failed';
        console.error(formatOutput({ error: message }, outputFormat, 'error'));
        process.exit(1);
      }
    });
}
