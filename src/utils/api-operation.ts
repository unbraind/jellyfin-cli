import type { OpenApiDocument } from './openapi-source.js';

const HTTP_METHODS = new Set([
  'get',
  'post',
  'put',
  'patch',
  'delete',
  'head',
  'options',
  'trace',
]);

/** OpenAPI parameter metadata required to validate generic API calls. */
export type ApiOperationParameter = {
  name: string;
  location: 'path' | 'query';
  required: boolean;
};

/** Exact OpenAPI operation selected for generic API execution. */
export type ResolvedApiOperation = {
  operationId: string;
  method: string;
  pathTemplate: string;
  summary?: string | undefined;
  tags: string[];
  deprecated: boolean;
  readOnlySafe: boolean;
  parameters: ApiOperationParameter[];
  requestBodyAllowed: boolean;
  requestBodyRequired: boolean;
  requestBodyContentTypes: string[];
};

/** Validated request values ready for the same-origin Jellyfin client. */
export type PreparedApiOperation = {
  method: string;
  path: string;
  query: Record<string, string | string[]>;
  body?: unknown;
};

type OpenApiOperationShape = {
  operationId?: unknown;
  summary?: unknown;
  tags?: unknown;
  deprecated?: unknown;
  parameters?: unknown;
  requestBody?: unknown;
};

function operationShape(value: unknown): OpenApiOperationShape | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as OpenApiOperationShape
    : undefined;
}

function operationParameters(...values: unknown[]): ApiOperationParameter[] {
  const parameters: ApiOperationParameter[] = values.flatMap((value) => Array.isArray(value) ? value : []).flatMap((entry): ApiOperationParameter[] => {
    if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) {
      return [];
    }
    const parameter = entry as Record<string, unknown>;
    const location = parameter.in;
    if (
      typeof parameter.name !== 'string' ||
      (location !== 'path' && location !== 'query')
    ) {
      return [];
    }
    return [{
      name: parameter.name,
      location,
      required: parameter.required === true || location === 'path',
    }];
  });
  return parameters.filter((parameter, index) => !parameters.slice(index + 1).some((candidate) =>
    candidate.name === parameter.name && candidate.location === parameter.location));
}

function requestBodyRequired(value: unknown): boolean {
  return typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    (value as Record<string, unknown>).required === true;
}

function requestBodyContentTypes(value: unknown): string[] {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return [];
  }
  const content = (value as Record<string, unknown>).content;
  return typeof content === 'object' && content !== null && !Array.isArray(content)
    ? Object.keys(content).sort()
    : [];
}

/**
 * Resolves one unique Jellyfin OpenAPI operation by its exact operation ID.
 * @param document - The validated OpenAPI document to inspect.
 * @param operationId - Exact Jellyfin operation identifier, matched case-insensitively.
 * @returns The resolved method, path template, and input contract.
 */
export function resolveApiOperation(
  document: OpenApiDocument,
  operationId: string,
): ResolvedApiOperation {
  const normalizedId = operationId.trim().toLowerCase();
  if (!normalizedId) {
    throw new Error('Operation ID must not be empty');
  }

  const matches: ResolvedApiOperation[] = [];
  for (const [pathTemplate, pathItem] of Object.entries(document.paths ?? {})) {
    for (const [methodName, value] of Object.entries(pathItem ?? {})) {
      if (!HTTP_METHODS.has(methodName.toLowerCase())) {
        continue;
      }
      const operation = operationShape(value);
      if (
        typeof operation?.operationId !== 'string' ||
        operation.operationId.toLowerCase() !== normalizedId
      ) {
        continue;
      }
      const method = methodName.toUpperCase();
      matches.push({
        operationId: operation.operationId,
        method,
        pathTemplate,
        summary: typeof operation.summary === 'string' ? operation.summary : undefined,
        tags: Array.isArray(operation.tags)
          ? operation.tags.filter((tag): tag is string => typeof tag === 'string')
          : [],
        deprecated: operation.deprecated === true,
        readOnlySafe: method === 'GET' || method === 'HEAD' || method === 'OPTIONS',
        parameters: operationParameters(
          (pathItem as Record<string, unknown>).parameters,
          operation.parameters,
        ),
        requestBodyAllowed: operation.requestBody !== undefined,
        requestBodyRequired: requestBodyRequired(operation.requestBody),
        requestBodyContentTypes: requestBodyContentTypes(operation.requestBody),
      });
    }
  }

  if (matches.length === 0) {
    throw new Error(`Unknown OpenAPI operation ID: ${operationId}`);
  }
  if (matches.length > 1) {
    throw new Error(`OpenAPI operation ID is not unique: ${operationId}`);
  }
  return matches[0]!;
}

/**
 * Parses repeatable key=value CLI values without losing repeated query keys.
 * @param values - Repeatable CLI values such as `name=value`.
 * @param label - Human-readable option label used in validation errors.
 * @returns A deterministic key/value map.
 */
export function parseKeyValueOptions(
  values: string[] | undefined,
  label: string,
): Record<string, string | string[]> {
  const result: Record<string, string | string[]> = {};
  for (const value of values ?? []) {
    const separator = value.indexOf('=');
    if (separator <= 0) {
      throw new Error(`${label} must use key=value syntax: ${value}`);
    }
    const key = value.slice(0, separator).trim();
    const entryValue = value.slice(separator + 1);
    if (!key) {
      throw new Error(`${label} key must not be empty`);
    }
    const previous = result[key];
    result[key] = previous === undefined
      ? entryValue
      : Array.isArray(previous)
        ? [...previous, entryValue]
        : [previous, entryValue];
  }
  return result;
}

function scalarValue(
  values: Record<string, string | string[]>,
  key: string,
): string | undefined {
  const value = values[key];
  if (Array.isArray(value)) {
    throw new Error(`Path parameter may be specified only once: ${key}`);
  }
  return value;
}

/**
 * Validates and materializes path, query, and body inputs for an exact operation.
 * @param operation - Exact OpenAPI operation contract.
 * @param pathParameters - Values substituted into `{parameter}` path segments.
 * @param query - Query values validated against declared OpenAPI parameters.
 * @param body - Optional parsed JSON request body.
 * @returns Same-origin request values ready for execution.
 */
export function prepareApiOperation(
  operation: ResolvedApiOperation,
  pathParameters: Record<string, string | string[]>,
  query: Record<string, string | string[]>,
  body?: unknown,
): PreparedApiOperation {
  const pathNames = operation.parameters
    .filter((parameter) => parameter.location === 'path')
    .map((parameter) => parameter.name);
  const unknownPathNames = Object.keys(pathParameters).filter(
    (name) => !pathNames.includes(name),
  );
  if (unknownPathNames.length > 0) {
    throw new Error(`Unknown path parameter(s): ${unknownPathNames.join(', ')}`);
  }

  let path = operation.pathTemplate;
  for (const name of pathNames) {
    const value = scalarValue(pathParameters, name);
    if (value === undefined || value.length === 0) {
      throw new Error(`Missing required path parameter: ${name}`);
    }
    path = path.replaceAll(`{${name}}`, encodeURIComponent(value));
  }
  if (/\{[^}]+\}/u.test(path)) {
    throw new Error(`Missing path parameter for template: ${operation.pathTemplate}`);
  }

  const queryParameters = operation.parameters.filter(
    (parameter) => parameter.location === 'query',
  );
  const queryNames = queryParameters.map((parameter) => parameter.name);
  const unknownQueryNames = Object.keys(query).filter((name) => !queryNames.includes(name));
  if (unknownQueryNames.length > 0) {
    throw new Error(`Unknown query parameter(s): ${unknownQueryNames.join(', ')}`);
  }
  for (const parameter of queryParameters) {
    if (parameter.required && query[parameter.name] === undefined) {
      throw new Error(`Missing required query parameter: ${parameter.name}`);
    }
  }

  if (operation.requestBodyRequired && body === undefined) {
    throw new Error('This operation requires a JSON request body');
  }
  if (!operation.requestBodyAllowed && body !== undefined) {
    throw new Error('This operation does not declare a request body');
  }
  return { method: operation.method, path, query, body };
}
