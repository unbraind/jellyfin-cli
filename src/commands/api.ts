import { readFileSync } from 'node:fs';
import { Command } from 'commander';
import { fetchOpenApiDocumentWithOptions } from '../utils/openapi.js';
import {
  parseKeyValueOptions,
  prepareApiOperation,
  resolveApiOperation,
  type ResolvedApiOperation,
} from '../utils/api-operation.js';
import { getConfig } from '../utils/config.js';
import { createApiClient, handleError, output } from './utils.js';
import { parsePositiveInteger, resolveOutputFormat, type FormatOptions } from './schema-utils.js';

type ApiInputOptions = FormatOptions & {
  server?: string | undefined;
  endpoint?: string | undefined;
  pathParam?: string[] | undefined;
  query?: string[] | undefined;
  bodyJson?: string | undefined;
  bodyText?: string | undefined;
  bodyFile?: string | undefined;
  contentType?: string | undefined;
  maxBytes?: string | undefined;
  confirm?: boolean | undefined;
};

function operationContract(operation: ResolvedApiOperation): Record<string, unknown> {
  return {
    operation_id: operation.operationId,
    method: operation.method,
    path_template: operation.pathTemplate,
    summary: operation.summary,
    tags: operation.tags,
    deprecated: operation.deprecated,
    read_only_safe: operation.readOnlySafe,
    parameters: operation.parameters.map((parameter) => ({
      name: parameter.name,
      in: parameter.location,
      required: parameter.required,
    })),
    request_body_allowed: operation.requestBodyAllowed,
    request_body_required: operation.requestBodyRequired,
    request_body_content_types: operation.requestBodyContentTypes,
  };
}

type ParsedBody = {
  data: unknown;
  contentType: string;
};

function contentTypeAllowed(contentType: string, allowed: string[]): boolean {
  const normalized = contentType.split(';', 1)[0]!.trim().toLowerCase();
  return allowed.some((candidate) => {
    const expected = candidate.toLowerCase();
    if (expected === normalized || expected === '*/*') {
      return true;
    }
    const wildcard = expected.indexOf('*');
    return wildcard >= 0 &&
      normalized.startsWith(expected.slice(0, wildcard)) &&
      normalized.endsWith(expected.slice(wildcard + 1));
  });
}

function parseBody(
  options: ApiInputOptions,
  operation: ResolvedApiOperation,
): ParsedBody | undefined {
  const selected = [
    options.bodyJson !== undefined,
    options.bodyText !== undefined,
    options.bodyFile !== undefined,
  ].filter(Boolean).length;
  if (selected > 1) {
    throw new Error('Use only one of --body-json, --body-text, or --body-file');
  }
  if (selected === 0) {
    if (options.contentType !== undefined) {
      throw new Error('--content-type requires a request body');
    }
    return undefined;
  }

  let body: ParsedBody;
  if (options.bodyJson !== undefined) {
    try {
      const parsed = JSON.parse(options.bodyJson) as unknown;
      body = {
        data: JSON.stringify(parsed),
        contentType: options.contentType ?? 'application/json',
      };
    } catch {
      throw new Error('Request body must contain valid JSON');
    }
  } else if (options.bodyText !== undefined) {
    body = {
      data: options.bodyText,
      contentType: options.contentType ?? 'text/plain',
    };
  } else {
    if (!options.contentType) {
      throw new Error('--body-file requires --content-type');
    }
    const filePath = options.bodyFile;
    if (!filePath) {
      throw new Error('Missing --body-file path');
    }
    body = {
      data: readFileSync(filePath),
      contentType: options.contentType,
    };
  }

  if (!contentTypeAllowed(body.contentType, operation.requestBodyContentTypes)) {
    throw new Error(
      `Content type ${body.contentType} is not declared for ${operation.operationId}`,
    );
  }
  return body;
}

async function resolveOperation(
  operationId: string,
  options: ApiInputOptions,
): Promise<{ operation: ResolvedApiOperation; sourceKind: string }> {
  const config = getConfig(options.server);
  if (!config.serverUrl) {
    throw new Error('No server URL configured. Use: jf config set --server <url>');
  }
  const source = await fetchOpenApiDocumentWithOptions(config, {
    endpointPath: options.endpoint,
  });
  return {
    operation: resolveApiOperation(source.document, operationId),
    sourceKind: source.sourceKind,
  };
}

function addExecutionOptions(command: Command): Command {
  return command
    .option('-f, --format <format>', 'Output format (toon, json, table, raw, yaml, markdown)', 'toon')
    .option('--server <name>', 'Server name from config')
    .option('--endpoint <path>', 'Preferred OpenAPI document path')
    .option('--path-param <key=value...>', 'Path template values declared by OpenAPI')
    .option('--query <key=value...>', 'Query values declared by OpenAPI; repeat keys for arrays')
    .option('--body-json <json>', 'JSON request body declared by OpenAPI')
    .option('--body-text <text>', 'Plain-text request body declared by OpenAPI')
    .option('--body-file <path>', 'Read a binary or text request body from a local file')
    .option('--content-type <type>', 'Request content type; required with --body-file')
    .option('--max-bytes <bytes>', 'Maximum buffered response size', '10485760');
}

async function executeOperation(
  command: Command,
  operationId: string,
  options: ApiInputOptions,
  expectedReadOnly: boolean,
): Promise<void> {
  const format = resolveOutputFormat(command, options);
  try {
    const resolved = await resolveOperation(operationId, options);
    if (resolved.operation.readOnlySafe !== expectedReadOnly) {
      const expected = expectedReadOnly ? 'GET, HEAD, or OPTIONS' : 'a mutating HTTP method';
      throw new Error(
        `Operation ${resolved.operation.operationId} uses ${resolved.operation.method}; expected ${expected}`,
      );
    }

    const body = parseBody(options, resolved.operation);
    const prepared = prepareApiOperation(
      resolved.operation,
      parseKeyValueOptions(options.pathParam, '--path-param'),
      parseKeyValueOptions(options.query, '--query'),
      body?.data,
    );
    const maxBytes = parsePositiveInteger(
      String(options.maxBytes ?? '10485760'),
      'Maximum response bytes',
      format,
    );
    const { client } = await createApiClient({ format, server: options.server });
    const response = await client.executeOperation(
      prepared.method,
      prepared.path,
      prepared.query,
      prepared.body,
      body?.contentType,
      maxBytes,
    );
    output({
      operation_id: resolved.operation.operationId,
      method: prepared.method,
      path: prepared.path,
      openapi_source: resolved.sourceKind,
      status: response.status,
      content_type: response.contentType,
      encoding: response.encoding,
      data: response.data,
    }, format, 'api_operation_response');
  } catch (error) {
    handleError(error, format);
  }
}

/**
 * Builds the exact OpenAPI operation command tree for complete agent-safe API access.
 * @returns The configured `jf api` command tree.
 */
export function createApiCommand(): Command {
  const cmd = new Command('api')
    .description('Inspect and execute exact Jellyfin OpenAPI operations');

  cmd
    .command('inspect <operationId>')
    .description('Inspect an exact operation ID and its declared inputs without executing it')
    .option('-f, --format <format>', 'Output format (toon, json, table, raw, yaml, markdown)', 'toon')
    .option('--server <name>', 'Server name from config')
    .option('--endpoint <path>', 'Preferred OpenAPI document path')
    .action(async function (
      this: Command,
      operationId: string,
      options: ApiInputOptions,
    ) {
      const format = resolveOutputFormat(this, options);
      try {
        const resolved = await resolveOperation(operationId, options);
        output({
          ...operationContract(resolved.operation),
          openapi_source: resolved.sourceKind,
        }, format, 'api_operation');
      } catch (error) {
        handleError(error, format);
      }
    });

  addExecutionOptions(
    cmd.command('get <operationId>')
      .description('Execute an exact GET, HEAD, or OPTIONS operation'),
  ).action(async function (
    this: Command,
    operationId: string,
    options: ApiInputOptions,
  ) {
    await executeOperation(this, operationId, options, true);
  });

  addExecutionOptions(
    cmd.command('mutate <operationId>')
      .description('Execute an exact mutating operation with explicit confirmation')
      .requiredOption('--confirm', 'Confirm the server mutation'),
  ).action(async function (
    this: Command,
    operationId: string,
    options: ApiInputOptions,
  ) {
    await executeOperation(this, operationId, options, false);
  });

  return cmd;
}
