import { Command } from 'commander';
import { formatOutput } from '../formatters/index.js';
import { getConfig } from '../utils/config.js';
import { compareOpenApiDocuments } from '../utils/openapi-compatibility.js';
import { resolveJellyfinVersionSelector } from '../utils/jellyfin-releases.js';
import {
  fetchOfficialOpenApiDocument,
  fetchOpenApiDocumentWithOptions,
} from '../utils/openapi-source.js';
import { parsePositiveInteger, resolveOutputFormat, type FormatOptions } from './schema-utils.js';

type CompatibilityOptions = FormatOptions & {
  name?: string | undefined;
  endpoint?: string | undefined;
  targetVersion?: string | undefined;
  baseline?: string | undefined;
  allowPrerelease?: boolean | undefined;
  failOnBreaking?: boolean | undefined;
  limit?: string | undefined;
};

/**
 * Attaches version-aware live-to-official OpenAPI comparison for upgrade and CI workflows.
 * @param cmd - Parent schema command receiving the compatibility subcommand.
 */
export function attachSchemaCompatibilitySubcommand(cmd: Command): void {
  cmd
    .command('compatibility')
    .alias('diff')
    .description('Compare official Jellyfin versions or audit explicit live-server API drift')
    .option('-f, --format <format>', 'Output format (toon, json, table, raw, yaml, markdown)', 'toon')
    .option('--name <name>', 'Server name')
    .option('--endpoint <path>', 'Preferred live OpenAPI path (e.g. /api-docs/openapi.json)')
    .option('--baseline <source>', 'Baseline contract: official or live', 'official')
    .option('--target-version <version>', 'Exact artifact or latest-stable/latest-preview (defaults to live API version)')
    .option('--allow-prerelease', 'Allow an explicitly named alpha, beta, or RC target artifact')
    .option('--fail-on-breaking', 'Exit nonzero after output when breaking compatibility changes exist')
    .option('--limit <number>', 'Maximum detailed changes to include', '50')
    .action(async function (this: Command, options: CompatibilityOptions) {
      const outputFormat = resolveOutputFormat(this, options);
      const limit = parsePositiveInteger(String(options.limit ?? '50'), 'Limit', outputFormat);
      const config = getConfig(options.name);
      if (!config.serverUrl) {
        console.error(formatOutput({ error: 'No server URL configured' }, outputFormat, 'error'));
        process.exit(1);
      }

      try {
        const requestedTargetVersion = options.targetVersion
          ? await resolveJellyfinVersionSelector(
            config,
            options.targetVersion,
            options.allowPrerelease,
          )
          : undefined;
        const baseline = await fetchOpenApiDocumentWithOptions(config, {
          endpointPath: options.endpoint,
        });
        const liveApiVersion = baseline.document.info?.version;
        if (options.baseline !== 'official' && options.baseline !== 'live') {
          throw new Error('Baseline must be official or live');
        }
        if (!liveApiVersion) throw new Error('Live OpenAPI document does not declare an API version');
        const baselineResult = options.baseline === 'live'
          ? baseline
          : await fetchOfficialOpenApiDocument(config, liveApiVersion);
        const targetArtifactVersion = requestedTargetVersion ?? liveApiVersion;
        if (!targetArtifactVersion) throw new Error('Live OpenAPI document does not declare an API version');
        const target = await fetchOfficialOpenApiDocument(config, targetArtifactVersion, {
          allowPrerelease: options.allowPrerelease,
        });
        const result = compareOpenApiDocuments(baselineResult.document, target.document);
        const changes = result.changes.slice(0, limit);
        const data = {
          compatible: result.compatible,
          baseline: {
            source_kind: options.baseline,
            artifact_version: options.baseline === 'official' ? liveApiVersion : null,
            api_version: baselineResult.document.info?.version ?? null,
            operation_count: result.baselineOperationCount,
            component_schema_count: result.baselineSchemaCount,
          },
          target: {
            source_kind: target.sourceKind,
            artifact_version: targetArtifactVersion,
            api_version: target.document.info?.version ?? null,
            prerelease: targetArtifactVersion.includes('-'),
            operation_count: result.targetOperationCount,
            component_schema_count: result.targetSchemaCount,
          },
          summary: {
            breaking: result.breakingCount,
            review: result.reviewCount,
            non_breaking: result.nonBreakingCount,
            total: result.changes.length,
            counts_by_kind: result.countsByKind,
          },
          changes,
          changes_truncated: result.changes.length > changes.length,
        };
        console.log(formatOutput(data, outputFormat, 'openapi_compatibility'));
        if (options.failOnBreaking && !result.compatible) process.exitCode = 1;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'OpenAPI compatibility analysis failed';
        console.error(formatOutput({ error: message }, outputFormat, 'error'));
        process.exit(1);
      }
    });
}
