import { readFileSync, statSync } from 'node:fs';
import { Command } from 'commander';
import { JellyfinApiError } from '../api/types.js';
import {
  parseApiBatchManifest,
  prepareApiBatch,
  type PreparedApiBatchRequest,
} from '../utils/api-batch.js';
import { fetchOpenApiDocumentWithOptions } from '../utils/openapi.js';
import { getConfig } from '../utils/config.js';
import { createApiClient, handleError, output } from './utils.js';
import { parsePositiveInteger, resolveOutputFormat, type FormatOptions } from './schema-utils.js';

const MAX_MANIFEST_BYTES = 1_048_576;
const MAX_BATCH_OPERATIONS = 100;

type ApiBatchOptions = FormatOptions & {
  server?: string | undefined;
  endpoint?: string | undefined;
  file?: string | undefined;
  stdin?: boolean | undefined;
  dryRun?: boolean | undefined;
  maxOperations?: string | undefined;
  maxBytes?: string | undefined;
  maxTotalBytes?: string | undefined;
};

function readManifest(options: ApiBatchOptions): unknown {
  if ((options.file === undefined) === (options.stdin !== true)) {
    throw new Error('Use exactly one of --file or --stdin');
  }
  if (options.file !== undefined && statSync(options.file).size > MAX_MANIFEST_BYTES) {
    throw new Error(`Batch manifest exceeds ${MAX_MANIFEST_BYTES} bytes`);
  }
  const text = readFileSync(options.file ?? 0, 'utf8');
  if (Buffer.byteLength(text) > MAX_MANIFEST_BYTES) {
    throw new Error(`Batch manifest exceeds ${MAX_MANIFEST_BYTES} bytes`);
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error('Batch manifest must contain valid JSON');
  }
}

function preflightEntry(entry: PreparedApiBatchRequest): Record<string, unknown> {
  return {
    id: entry.id,
    operation_id: entry.operation.operationId,
    method: entry.request.method,
    path: entry.request.path,
    query: entry.request.query,
    deprecated: entry.operation.deprecated,
  };
}

/**
 * Attaches bounded read-only manifest execution to the exact API command tree.
 * @param cmd - Parent `jf api` command receiving the batch subcommand.
 */
export function attachApiBatchSubcommand(cmd: Command): void {
  cmd
    .command('batch')
    .description('Preflight and execute a bounded JSON manifest of read-only operations')
    .option('-f, --format <format>', 'Output format (toon, json, table, raw, yaml, markdown)', 'toon')
    .option('--server <name>', 'Server name from config')
    .option('--endpoint <path>', 'Preferred OpenAPI document path')
    .option('--file <path>', 'Read the JSON batch manifest from a file')
    .option('--stdin', 'Read the JSON batch manifest from standard input')
    .option('--dry-run', 'Resolve and validate every operation without executing requests')
    .option('--max-operations <count>', 'Maximum manifest request count', '25')
    .option('--max-bytes <bytes>', 'Maximum bytes accepted from one response', '1048576')
    .option('--max-total-bytes <bytes>', 'Maximum bytes accepted across all responses', '10485760')
    .action(async function (this: Command, options: ApiBatchOptions) {
      const format = resolveOutputFormat(this, options);
      try {
        const maxOperations = parsePositiveInteger(
          String(options.maxOperations ?? '25'),
          'Maximum operations',
          format,
        );
        if (maxOperations > MAX_BATCH_OPERATIONS) {
          throw new Error(`Maximum operations cannot exceed ${MAX_BATCH_OPERATIONS}`);
        }
        const maxBytes = parsePositiveInteger(
          String(options.maxBytes ?? '1048576'),
          'Maximum response bytes',
          format,
        );
        const maxTotalBytes = parsePositiveInteger(
          String(options.maxTotalBytes ?? '10485760'),
          'Maximum total response bytes',
          format,
        );
        const config = getConfig(options.server);
        if (!config.serverUrl) {
          throw new Error('No server URL configured. Use: jf config set --server <url>');
        }
        const source = await fetchOpenApiDocumentWithOptions(config, {
          endpointPath: options.endpoint,
        });
        const prepared = prepareApiBatch(
          source.document,
          parseApiBatchManifest(readManifest(options), maxOperations),
        );
        const preflight = prepared.map(preflightEntry);
        if (options.dryRun) {
          output({
            dry_run: true,
            openapi_source: source.sourceKind,
            request_count: prepared.length,
            requests: preflight,
          }, format, 'api_batch_plan');
          return;
        }

        const { client } = await createApiClient({ format, server: options.server });
        const results: Record<string, unknown>[] = [];
        let totalBytes = 0;
        let failureCount = 0;
        for (const entry of prepared) {
          try {
            const remainingBytes = maxTotalBytes - totalBytes;
            if (remainingBytes <= 0) {
              throw new Error(`Batch responses exceed --max-total-bytes (${maxTotalBytes})`);
            }
            const response = await client.executeOperation(
              entry.request.method,
              entry.request.path,
              entry.request.query,
              undefined,
              undefined,
              Math.min(maxBytes, remainingBytes),
            );
            totalBytes += response.byteLength;
            results.push({
              id: entry.id,
              operation_id: entry.operation.operationId,
              ok: true,
              status: response.status,
              content_type: response.contentType,
              encoding: response.encoding,
              response_bytes: response.byteLength,
              data: response.data,
            });
          } catch (error) {
            failureCount += 1;
            results.push({
              id: entry.id,
              operation_id: entry.operation.operationId,
              ok: false,
              status: error instanceof JellyfinApiError ? error.statusCode ?? null : null,
              error: error instanceof Error ? error.message : 'API batch request failed',
            });
          }
        }
        output({
          dry_run: false,
          openapi_source: source.sourceKind,
          request_count: prepared.length,
          success_count: prepared.length - failureCount,
          failure_count: failureCount,
          response_bytes: totalBytes,
          results,
        }, format, 'api_batch_response');
        if (failureCount > 0) {
          process.exitCode = 1;
        }
      } catch (error) {
        handleError(error, format);
      }
    });
}
