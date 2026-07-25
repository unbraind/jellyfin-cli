import type { OpenApiDocument } from './openapi-source.js';
import {
  prepareApiOperation,
  resolveApiOperation,
  type PreparedApiOperation,
  type ResolvedApiOperation,
} from './api-operation.js';

/** One caller-named read request in a versioned API batch manifest. */
export type ApiBatchRequest = {
  id: string;
  operationId: string;
  pathParameters: Record<string, string>;
  query: Record<string, string | string[]>;
};

/** A fully validated read request ready for deterministic execution. */
export type PreparedApiBatchRequest = {
  id: string;
  operation: ResolvedApiOperation;
  request: PreparedApiOperation;
};

type JsonObject = Record<string, unknown>;

/**
 * Narrows a decoded JSON value to a non-array object.
 * @param value - Candidate decoded JSON value.
 * @param label - Human-readable location for validation errors.
 * @returns The validated JSON object.
 */
function objectValue(value: unknown, label: string): JsonObject {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`${label} must be a JSON object`);
  }
  return value as JsonObject;
}

/**
 * Rejects fields outside a strict manifest contract.
 * @param value - Object whose keys are inspected.
 * @param allowed - Exact supported field names.
 * @param label - Human-readable location for validation errors.
 */
function rejectUnknownKeys(value: JsonObject, allowed: string[], label: string): void {
  const unknown = Object.keys(value).filter((key) => !allowed.includes(key));
  if (unknown.length > 0) {
    throw new Error(`${label} contains unknown field(s): ${unknown.join(', ')}`);
  }
}

/**
 * Validates a JSON object whose values must all be strings.
 * @param value - Optional decoded map value.
 * @param label - Human-readable location for validation errors.
 * @returns A normalized string map.
 */
function stringMap(value: unknown, label: string): Record<string, string> {
  if (value === undefined) {
    return {};
  }
  const object = objectValue(value, label);
  const result: Record<string, string> = {};
  for (const [key, entry] of Object.entries(object)) {
    if (typeof entry !== 'string') {
      throw new Error(`${label}.${key} must be a string`);
    }
    result[key] = entry;
  }
  return result;
}

/**
 * Validates query values as strings or repeated string values.
 * @param value - Optional decoded query map.
 * @param label - Human-readable location for validation errors.
 * @returns A normalized query map.
 */
function queryMap(value: unknown, label: string): Record<string, string | string[]> {
  if (value === undefined) {
    return {};
  }
  const object = objectValue(value, label);
  const result: Record<string, string | string[]> = {};
  for (const [key, entry] of Object.entries(object)) {
    if (typeof entry === 'string') {
      result[key] = entry;
      continue;
    }
    if (Array.isArray(entry) && entry.every((item) => typeof item === 'string')) {
      result[key] = entry;
      continue;
    }
    throw new Error(`${label}.${key} must be a string or an array of strings`);
  }
  return result;
}

/**
 * Parses a strict, versioned JSON manifest without accepting undeclared input fields.
 * @param value - Decoded JSON input supplied by a file or standard input.
 * @param maxOperations - Maximum requests allowed by the current command invocation.
 * @returns Caller-named request contracts in manifest order.
 */
export function parseApiBatchManifest(value: unknown, maxOperations: number): ApiBatchRequest[] {
  const manifest = objectValue(value, 'Batch manifest');
  rejectUnknownKeys(manifest, ['version', 'requests'], 'Batch manifest');
  if (manifest.version !== 1) {
    throw new Error('Batch manifest version must be 1');
  }
  if (!Array.isArray(manifest.requests) || manifest.requests.length === 0) {
    throw new Error('Batch manifest requests must be a non-empty array');
  }
  if (manifest.requests.length > maxOperations) {
    throw new Error(
      `Batch manifest exceeds --max-operations (${manifest.requests.length} > ${maxOperations})`,
    );
  }

  const ids = new Set<string>();
  return manifest.requests.map((entry, index) => {
    const label = `Batch request ${index + 1}`;
    const request = objectValue(entry, label);
    rejectUnknownKeys(
      request,
      ['id', 'operation_id', 'path_params', 'query'],
      label,
    );
    if (
      typeof request.id !== 'string' ||
      !/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/u.test(request.id)
    ) {
      throw new Error(`${label}.id must be 1-64 URL-safe identifier characters`);
    }
    if (ids.has(request.id)) {
      throw new Error(`Batch request id must be unique: ${request.id}`);
    }
    ids.add(request.id);
    if (typeof request.operation_id !== 'string' || request.operation_id.trim() === '') {
      throw new Error(`${label}.operation_id must be a non-empty string`);
    }
    return {
      id: request.id,
      operationId: request.operation_id,
      pathParameters: stringMap(request.path_params, `${label}.path_params`),
      query: queryMap(request.query, `${label}.query`),
    };
  });
}

/**
 * Resolves and validates every manifest request before any server operation executes.
 * @param document - Exact OpenAPI document for the configured Jellyfin server.
 * @param requests - Parsed batch requests in caller order.
 * @returns Fully materialized read-only operations in caller order.
 */
export function prepareApiBatch(
  document: OpenApiDocument,
  requests: ApiBatchRequest[],
): PreparedApiBatchRequest[] {
  return requests.map((request) => {
    const operation = resolveApiOperation(document, request.operationId);
    if (!operation.readOnlySafe) {
      throw new Error(
        `Batch request ${request.id} uses ${operation.method}; only GET, HEAD, and OPTIONS are allowed`,
      );
    }
    return {
      id: request.id,
      operation,
      request: prepareApiOperation(
        operation,
        request.pathParameters,
        request.query,
      ),
    };
  });
}
