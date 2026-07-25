import { describe, expect, it } from 'vitest';
import { compareOpenApiDocuments } from '../../src/utils/openapi-compatibility.js';
import type { OpenApiDocument } from '../../src/utils/openapi-source.js';

function document(
  paths: Record<string, Record<string, unknown>>,
  schemas: Record<string, unknown> = {},
): OpenApiDocument {
  return {
    info: { title: 'Jellyfin API', version: '10.11.11' },
    paths,
    components: { schemas },
  } as OpenApiDocument;
}

describe('OpenAPI compatibility analysis', () => {
  it('classifies operation, parameter, body, response, and component drift', () => {
    const baseline = document({
      '/Items/{itemId}': {
        parameters: [
          { name: 'itemId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        get: {
          operationId: 'GetItem',
          parameters: [
            { name: 'userId', in: 'query', required: false, schema: { type: 'string' } },
            { name: 'legacy', in: 'query', schema: { type: 'boolean' } },
          ],
          requestBody: {
            content: {
              'application/json': { schema: { type: 'string' } },
              'text/plain': {},
            },
          },
          responses: { 200: { description: 'old' }, 404: {} },
        },
      },
      '/Removed': {
        get: { operationId: 'Removed', responses: { 200: {} } },
      },
    }, {
      RemovedModel: { type: 'object' },
      ChangedModel: { type: 'string' },
    });
    const target = document({
      '/Items/{itemId}': {
        parameters: [
          { name: 'itemId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        get: {
          operationId: 'GetItemById',
          parameters: [
            { name: 'userId', in: 'query', required: true, schema: { type: 'integer' } },
            { name: 'requiredNew', in: 'query', required: true, schema: { type: 'string' } },
            { name: 'optionalNew', in: 'query', schema: { type: 'string' } },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json-patch+json': {},
              'application/json': { schema: { type: 'integer' } },
            },
          },
          responses: { 200: { description: 'new' }, 201: {} },
        },
      },
      '/Added': {
        get: { operationId: 'Added', responses: { 200: {} } },
      },
    }, {
      ChangedModel: { type: 'number' },
      AddedModel: { type: 'object' },
    });

    const result = compareOpenApiDocuments(baseline, target);

    expect(result.compatible).toBe(false);
    expect(result.baselineOperationCount).toBe(2);
    expect(result.targetOperationCount).toBe(2);
    expect(result.countsByKind).toMatchObject({
      component_schema_added: 1,
      component_schema_changed: 1,
      component_schema_removed: 1,
      operation_added: 1,
      operation_id_changed: 1,
      operation_removed: 1,
      optional_parameter_added: 1,
      parameter_became_required: 1,
      parameter_removed: 1,
      parameter_schema_changed: 1,
      request_body_became_required: 1,
      request_content_schema_changed: 1,
      request_content_type_added: 1,
      request_content_type_removed: 1,
      required_parameter_added: 1,
      response_schema_changed: 1,
      response_status_added: 1,
      response_status_removed: 1,
    });
    expect(result.changes).toEqual([...result.changes].sort((left, right) =>
      left.severity.localeCompare(right.severity) ||
      left.kind.localeCompare(right.kind) ||
      left.subject.localeCompare(right.subject) ||
      left.detail.localeCompare(right.detail)));
  });

  it('reports identical contracts as compatible', () => {
    const contract = document({
      '/System/Info/Public': {
        get: { operationId: 'GetPublicSystemInfo', responses: { 200: {} } },
      },
    }, {
      PublicSystemInfo: { properties: { Version: { type: 'string' } } },
    });

    expect(compareOpenApiDocuments(contract, contract)).toMatchObject({
      compatible: true,
      breakingCount: 0,
      reviewCount: 0,
      nonBreakingCount: 0,
      changes: [],
    });
  });

  it('classifies relaxed requiredness as non-breaking', () => {
    const baseline = document({
      '/Relaxed': {
        post: {
          parameters: [{ name: 'id', in: 'query', required: true }],
          requestBody: { required: true, content: { 'application/json': {} } },
          responses: { 200: {} },
        },
      },
    });
    const target = document({
      '/Relaxed': {
        post: {
          parameters: [{ name: 'id', in: 'query' }],
          requestBody: { content: { 'application/json': {} } },
          responses: { 200: {} },
        },
      },
    });

    expect(compareOpenApiDocuments(baseline, target)).toMatchObject({
      compatible: true,
      countsByKind: {
        parameter_became_optional: 1,
        request_body_became_optional: 1,
      },
    });
  });
});
