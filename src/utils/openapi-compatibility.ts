import type { OpenApiDocument } from './openapi-source.js';

const HTTP_METHODS = new Set(['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'trace']);

type RawParameter = {
  name?: unknown;
  in?: unknown;
  required?: unknown;
  schema?: unknown;
};

type RawOperation = {
  operationId?: unknown;
  parameters?: unknown;
  requestBody?: {
    required?: unknown;
    content?: unknown;
  } | undefined;
  responses?: unknown;
};

type OperationContract = {
  operationId: string | null;
  parameters: Map<string, { required: boolean; schema: string }>;
  requestBodyRequired: boolean;
  requestContentTypes: Set<string>;
  requestContentSchemas: Map<string, string>;
  responseStatuses: Set<string>;
  responseSchemas: Map<string, string>;
};

/** One deterministic compatibility finding between two OpenAPI documents. */
export type OpenApiCompatibilityChange = {
  severity: 'breaking' | 'review' | 'non_breaking';
  kind: string;
  subject: string;
  detail: string;
};

/** Complete aggregate compatibility result; callers may truncate only the change list. */
export type OpenApiCompatibilityResult = {
  compatible: boolean;
  baselineOperationCount: number;
  targetOperationCount: number;
  baselineSchemaCount: number;
  targetSchemaCount: number;
  breakingCount: number;
  reviewCount: number;
  nonBreakingCount: number;
  countsByKind: Record<string, number>;
  changes: OpenApiCompatibilityChange[];
};

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${canonical(entry)}`)
      .join(',')}}`;
  }
  return JSON.stringify(value) ?? 'undefined';
}

function parameters(value: unknown): Map<string, { required: boolean; schema: string }> {
  const result = new Map<string, { required: boolean; schema: string }>();
  if (!Array.isArray(value)) return result;
  for (const candidate of value) {
    if (!candidate || typeof candidate !== 'object') continue;
    const parameter = candidate as RawParameter;
    if (typeof parameter.name !== 'string' || typeof parameter.in !== 'string') continue;
    result.set(`${parameter.in}:${parameter.name}`, {
      required: parameter.required === true,
      schema: canonical(parameter.schema),
    });
  }
  return result;
}

function stringKeys(value: unknown): Set<string> {
  return value && typeof value === 'object'
    ? new Set(Object.keys(value as Record<string, unknown>).sort())
    : new Set();
}

function canonicalEntries(value: unknown): Map<string, string> {
  if (!value || typeof value !== 'object') return new Map();
  return new Map(Object.entries(value as Record<string, unknown>)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, entry]) => [key, canonical(entry)]));
}

function operations(document: OpenApiDocument): Map<string, OperationContract> {
  const result = new Map<string, OperationContract>();
  for (const [path, pathValue] of Object.entries(document.paths ?? {})) {
    const pathItem = pathValue as Record<string, unknown>;
    const inheritedParameters = parameters(pathItem.parameters);
    for (const [method, operationValue] of Object.entries(pathItem)) {
      if (!HTTP_METHODS.has(method.toLowerCase()) || !operationValue || typeof operationValue !== 'object') continue;
      const operation = operationValue as RawOperation;
      const mergedParameters = new Map(inheritedParameters);
      for (const [key, value] of parameters(operation.parameters)) mergedParameters.set(key, value);
      result.set(`${method.toUpperCase()} ${path}`, {
        operationId: typeof operation.operationId === 'string' ? operation.operationId : null,
        parameters: mergedParameters,
        requestBodyRequired: operation.requestBody?.required === true,
        requestContentTypes: stringKeys(operation.requestBody?.content),
        requestContentSchemas: canonicalEntries(operation.requestBody?.content),
        responseStatuses: stringKeys(operation.responses),
        responseSchemas: canonicalEntries(operation.responses),
      });
    }
  }
  return result;
}

function add(
  changes: OpenApiCompatibilityChange[],
  severity: OpenApiCompatibilityChange['severity'],
  kind: string,
  subject: string,
  detail: string,
): void {
  changes.push({ severity, kind, subject, detail });
}

function compareSet(
  changes: OpenApiCompatibilityChange[],
  baseline: Set<string>,
  target: Set<string>,
  subject: string,
  removedKind: string,
  addedKind: string,
): void {
  for (const value of baseline) {
    if (!target.has(value)) add(changes, 'breaking', removedKind, subject, value);
  }
  for (const value of target) {
    if (!baseline.has(value)) add(changes, 'non_breaking', addedKind, subject, value);
  }
}

function compareOperation(
  changes: OpenApiCompatibilityChange[],
  subject: string,
  baseline: OperationContract,
  target: OperationContract,
): void {
  if (baseline.operationId !== target.operationId) {
    add(changes, 'breaking', 'operation_id_changed', subject, `${baseline.operationId ?? '(none)'} -> ${target.operationId ?? '(none)'}`);
  }
  for (const [key, parameter] of baseline.parameters) {
    const next = target.parameters.get(key);
    if (!next) add(changes, 'breaking', 'parameter_removed', subject, key);
    else {
      if (!parameter.required && next.required) add(changes, 'breaking', 'parameter_became_required', subject, key);
      if (parameter.required && !next.required) add(changes, 'non_breaking', 'parameter_became_optional', subject, key);
      if (parameter.schema !== next.schema) add(changes, 'review', 'parameter_schema_changed', subject, key);
    }
  }
  for (const [key, parameter] of target.parameters) {
    if (!baseline.parameters.has(key)) {
      add(changes, parameter.required ? 'breaking' : 'non_breaking', parameter.required ? 'required_parameter_added' : 'optional_parameter_added', subject, key);
    }
  }
  if (!baseline.requestBodyRequired && target.requestBodyRequired) {
    add(changes, 'breaking', 'request_body_became_required', subject, 'request body');
  } else if (baseline.requestBodyRequired && !target.requestBodyRequired) {
    add(changes, 'non_breaking', 'request_body_became_optional', subject, 'request body');
  }
  compareSet(changes, baseline.requestContentTypes, target.requestContentTypes, subject, 'request_content_type_removed', 'request_content_type_added');
  for (const [contentType, schema] of baseline.requestContentSchemas) {
    const next = target.requestContentSchemas.get(contentType);
    if (next !== undefined && schema !== next) {
      add(changes, 'review', 'request_content_schema_changed', subject, contentType);
    }
  }
  compareSet(changes, baseline.responseStatuses, target.responseStatuses, subject, 'response_status_removed', 'response_status_added');
  for (const [status, schema] of baseline.responseSchemas) {
    const next = target.responseSchemas.get(status);
    if (next !== undefined && schema !== next) {
      add(changes, 'review', 'response_schema_changed', subject, status);
    }
  }
}

/**
 * Compares operation and component-schema contracts without executing either API.
 * @param baselineDocument - Currently deployed or older OpenAPI contract.
 * @param targetDocument - Candidate official OpenAPI contract.
 * @returns Deterministically sorted changes and complete aggregate risk counts.
 */
export function compareOpenApiDocuments(
  baselineDocument: OpenApiDocument,
  targetDocument: OpenApiDocument,
): OpenApiCompatibilityResult {
  const baseline = operations(baselineDocument);
  const target = operations(targetDocument);
  const changes: OpenApiCompatibilityChange[] = [];
  for (const [subject, operation] of baseline) {
    const next = target.get(subject);
    if (!next) add(changes, 'breaking', 'operation_removed', subject, 'operation unavailable');
    else compareOperation(changes, subject, operation, next);
  }
  for (const subject of target.keys()) {
    if (!baseline.has(subject)) add(changes, 'non_breaking', 'operation_added', subject, 'operation available');
  }

  const baselineSchemas = baselineDocument.components?.schemas ?? {};
  const targetSchemas = targetDocument.components?.schemas ?? {};
  for (const [name, schema] of Object.entries(baselineSchemas)) {
    if (!(name in targetSchemas)) add(changes, 'breaking', 'component_schema_removed', name, 'schema unavailable');
    else if (canonical(schema) !== canonical(targetSchemas[name])) add(changes, 'review', 'component_schema_changed', name, 'schema structure changed');
  }
  for (const name of Object.keys(targetSchemas)) {
    if (!(name in baselineSchemas)) add(changes, 'non_breaking', 'component_schema_added', name, 'schema available');
  }

  changes.sort((left, right) =>
    left.severity.localeCompare(right.severity) ||
    left.kind.localeCompare(right.kind) ||
    left.subject.localeCompare(right.subject) ||
    left.detail.localeCompare(right.detail));
  const countsByKind: Record<string, number> = {};
  for (const change of changes) countsByKind[change.kind] = (countsByKind[change.kind] ?? 0) + 1;
  const breakingCount = changes.filter((change) => change.severity === 'breaking').length;
  return {
    compatible: breakingCount === 0,
    baselineOperationCount: baseline.size,
    targetOperationCount: target.size,
    baselineSchemaCount: Object.keys(baselineSchemas).length,
    targetSchemaCount: Object.keys(targetSchemas).length,
    breakingCount,
    reviewCount: changes.filter((change) => change.severity === 'review').length,
    nonBreakingCount: changes.filter((change) => change.severity === 'non_breaking').length,
    countsByKind: Object.fromEntries(Object.entries(countsByKind).sort(([left], [right]) => left.localeCompare(right))),
    changes,
  };
}
