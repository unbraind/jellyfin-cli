import type { ResolvedApiOperation } from './api-operation.js';
import type { OpenApiDocument } from './openapi-source.js';

type ObjectValue = Record<string, unknown>;

/** Bounded JSON Schema metadata useful when constructing an API argument. */
export type ApiSchemaContract = {
  ref?: string | undefined;
  type?: string | string[] | undefined;
  format?: string | undefined;
  description?: string | undefined;
  nullable?: boolean | undefined;
  enum?: unknown[] | undefined;
  default?: unknown;
  example?: unknown;
  minimum?: number | undefined;
  maximum?: number | undefined;
  minLength?: number | undefined;
  maxLength?: number | undefined;
  pattern?: string | undefined;
  items?: ApiSchemaContract | undefined;
  required?: string[] | undefined;
  properties?: Record<string, ApiSchemaContract> | undefined;
  truncated?: boolean | undefined;
};

/** Rich OpenAPI parameter contract for an exact operation. */
export type ApiParameterContract = {
  name: string;
  in: 'path' | 'query';
  required: boolean;
  description?: string | undefined;
  style?: string | undefined;
  explode?: boolean | undefined;
  allow_empty_value?: boolean | undefined;
  schema?: ApiSchemaContract | undefined;
};

/** Agent-ready exact operation contract derived from the live OpenAPI document. */
export type ApiInvocationContract = {
  parameters: ApiParameterContract[];
  request_bodies: Array<{ content_type: string; schema?: ApiSchemaContract | undefined }>;
  responses: Array<{ status: string; description?: string | undefined; content_types: string[] }>;
  security: string[][];
  invocation: {
    command: 'get' | 'mutate';
    argv_template: string[];
    requires_confirmation: boolean;
  };
};

function objectValue(value: unknown): ObjectValue | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as ObjectValue
    : undefined;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function numberValue(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function referencedValue(root: ObjectValue, ref: string): unknown {
  if (!ref.startsWith('#/')) return undefined;
  let current: unknown = root;
  for (const rawSegment of ref.slice(2).split('/')) {
    const segment = rawSegment.replaceAll('~1', '/').replaceAll('~0', '~');
    const object = objectValue(current);
    if (!object) return undefined;
    current = object[segment];
  }
  return current;
}

function schemaContract(
  value: unknown,
  root: ObjectValue,
  depth = 0,
  seenRefs: ReadonlySet<string> = new Set(),
): ApiSchemaContract | undefined {
  const schema = objectValue(value);
  if (!schema) return undefined;
  const ref = stringValue(schema.$ref);
  if (ref) {
    if (seenRefs.has(ref) || depth >= 4) return { ref, truncated: true };
    const target = referencedValue(root, ref);
    const resolved = schemaContract(target, root, depth + 1, new Set([...seenRefs, ref]));
    return resolved ? { ...resolved, ref } : { ref };
  }
  const contract: ApiSchemaContract = {};
  const type = schema.type;
  if (typeof type === 'string' || (Array.isArray(type) && type.every((entry) => typeof entry === 'string'))) {
    contract.type = type as string | string[];
  }
  contract.format = stringValue(schema.format);
  contract.description = stringValue(schema.description);
  contract.nullable = typeof schema.nullable === 'boolean' ? schema.nullable : undefined;
  contract.enum = Array.isArray(schema.enum) ? schema.enum : undefined;
  if ('default' in schema) contract.default = schema.default;
  if ('example' in schema) contract.example = schema.example;
  contract.minimum = numberValue(schema.minimum);
  contract.maximum = numberValue(schema.maximum);
  contract.minLength = numberValue(schema.minLength);
  contract.maxLength = numberValue(schema.maxLength);
  contract.pattern = stringValue(schema.pattern);
  if (depth >= 4) {
    contract.truncated = schema.items !== undefined || schema.properties !== undefined || undefined;
    return contract;
  }
  contract.items = schemaContract(schema.items, root, depth + 1, seenRefs);
  contract.required = Array.isArray(schema.required)
    ? schema.required.filter((entry): entry is string => typeof entry === 'string')
    : undefined;
  const properties = objectValue(schema.properties);
  if (properties) {
    const entries = Object.entries(properties).sort(([left], [right]) => left.localeCompare(right));
    contract.properties = Object.fromEntries(entries.slice(0, 100).flatMap(([name, child]) => {
      const normalized = schemaContract(child, root, depth + 1, seenRefs);
      return normalized ? [[name, normalized]] : [];
    }));
    contract.truncated = entries.length > 100 || undefined;
  }
  return contract;
}

function findOperation(document: OpenApiDocument, operation: ResolvedApiOperation): ObjectValue {
  const pathItem = objectValue(document.paths?.[operation.pathTemplate]);
  const candidate = objectValue(pathItem?.[operation.method.toLowerCase()]);
  if (!candidate || candidate.operationId !== operation.operationId) {
    throw new Error(`OpenAPI operation contract disappeared: ${operation.operationId}`);
  }
  const pathParameters = Array.isArray(pathItem?.parameters) ? pathItem.parameters : [];
  const operationParameters = Array.isArray(candidate.parameters) ? candidate.parameters : [];
  return { ...candidate, parameters: [...pathParameters, ...operationParameters] };
}

function parameterContracts(
  raw: ObjectValue,
  operation: ResolvedApiOperation,
  root: ObjectValue,
): ApiParameterContract[] {
  const rawParameters = Array.isArray(raw.parameters) ? raw.parameters : [];
  return operation.parameters.map((parameter) => {
    const source = rawParameters.slice().reverse().map(objectValue).find((candidate) =>
      candidate?.name === parameter.name && candidate.in === parameter.location);
    return {
      name: parameter.name,
      in: parameter.location,
      required: parameter.required,
      description: stringValue(source?.description),
      style: stringValue(source?.style),
      explode: typeof source?.explode === 'boolean' ? source.explode : undefined,
      allow_empty_value: typeof source?.allowEmptyValue === 'boolean' ? source.allowEmptyValue : undefined,
      schema: schemaContract(source?.schema, root),
    };
  });
}

function requestBodies(raw: ObjectValue, root: ObjectValue): ApiInvocationContract['request_bodies'] {
  const content = objectValue(objectValue(raw.requestBody)?.content);
  if (!content) return [];
  return Object.entries(content).sort(([left], [right]) => left.localeCompare(right)).map(([contentType, media]) => ({
    content_type: contentType,
    schema: schemaContract(objectValue(media)?.schema, root),
  }));
}

function responseContracts(raw: ObjectValue): ApiInvocationContract['responses'] {
  const responses = objectValue(raw.responses);
  if (!responses) return [];
  return Object.entries(responses).sort(([left], [right]) => left.localeCompare(right)).map(([status, value]) => {
    const response = objectValue(value);
    return {
      status,
      description: stringValue(response?.description),
      content_types: Object.keys(objectValue(response?.content) ?? {}).sort(),
    };
  });
}

function securityRequirements(raw: ObjectValue, document: OpenApiDocument): string[][] {
  const root = document as ObjectValue;
  const value = raw.security ?? root.security;
  if (!Array.isArray(value)) return [];
  return value.map(objectValue).filter((entry): entry is ObjectValue => Boolean(entry))
    .map((entry) => Object.keys(entry).sort());
}

function invocationTemplate(operation: ResolvedApiOperation, bodies: ApiInvocationContract['request_bodies']): ApiInvocationContract['invocation'] {
  const command = operation.readOnlySafe ? 'get' : 'mutate';
  const argv = ['jf', 'api', command, operation.operationId];
  if (!operation.readOnlySafe) argv.push('--confirm');
  for (const parameter of operation.parameters.filter((entry) => entry.required)) {
    argv.push(parameter.location === 'path' ? '--path-param' : '--query', `${parameter.name}=<${parameter.name}>`);
  }
  if (operation.requestBodyRequired) {
    const contentType = bodies[0]?.content_type ?? 'application/json';
    argv.push(contentType.includes('json') ? '--body-json' : '--body-file', `<${contentType.includes('json') ? 'json' : 'path'}>`);
    if (!contentType.includes('json')) argv.push('--content-type', contentType);
  }
  return { command, argv_template: argv, requires_confirmation: !operation.readOnlySafe };
}

/**
 * Builds a deterministic, bounded invocation contract for one exact operation.
 * @param document - Complete OpenAPI document containing the operation metadata.
 * @param operation - Exact resolved operation identity and routing contract.
 * @returns Rich parameter, body, response, security, and CLI invocation metadata.
 */
export function buildApiInvocationContract(
  document: OpenApiDocument,
  operation: ResolvedApiOperation,
): ApiInvocationContract {
  const raw = findOperation(document, operation);
  const root = document as unknown as ObjectValue;
  const bodies = requestBodies(raw, root);
  return {
    parameters: parameterContracts(raw, operation, root),
    request_bodies: bodies,
    responses: responseContracts(raw),
    security: securityRequirements(raw, document),
    invocation: invocationTemplate(operation, bodies),
  };
}
