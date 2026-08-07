import { describe, expect, it } from 'vitest';
import {
  parseApiBatchManifest,
  prepareApiBatch,
} from '../../src/utils/api-batch.js';
import { apiOperationDocument } from '../fixtures/api-operation.js';

describe('API batch manifests', () => {
  it('parses and preflights ordered read-only requests', () => {
    const requests = parseApiBatchManifest({
      version: 1,
      requests: [
        {
          id: 'user',
          operation_id: 'GetUserById',
          path_params: { userId: 'user 1' },
          query: { includeDisabled: 'true' },
        },
        {
          id: 'binary',
          operation_id: 'GetBinary',
        },
      ],
    }, 25);
    const prepared = prepareApiBatch(apiOperationDocument, requests);
    expect(prepared.map((entry) => entry.id)).toEqual(['user', 'binary']);
    expect(prepared[0]?.request).toEqual({
      method: 'GET',
      path: '/Users/user%201',
      query: { includeDisabled: 'true' },
      body: undefined,
    });
  });

  it.each([
    [{ requests: [] }, 'version must be 1'],
    [{ version: 1, requests: [] }, 'non-empty array'],
    [{ version: 1, requests: [{ id: 'bad id', operation_id: 'GetBinary' }] }, 'URL-safe'],
    [{
      version: 1,
      requests: [
        { id: 'same', operation_id: 'GetBinary' },
        { id: 'same', operation_id: 'GetBinary' },
      ],
    }, 'must be unique'],
    [{
      version: 1,
      requests: [{ id: 'read', operation_id: 'GetBinary', extra: true }],
    }, 'unknown field'],
  ])('rejects invalid manifest shape %#', (manifest, message) => {
    expect(() => parseApiBatchManifest(manifest, 25)).toThrow(message);
  });

  it('enforces the configured request budget', () => {
    expect(() => parseApiBatchManifest({
      version: 1,
      requests: [
        { id: 'one', operation_id: 'GetBinary' },
        { id: 'two', operation_id: 'GetBinary' },
      ],
    }, 1)).toThrow('exceeds --max-operations');
  });

  it('rejects mutating operations before any execution', () => {
    const requests = parseApiBatchManifest({
      version: 1,
      requests: [{ id: 'mutation', operation_id: 'CreateUser' }],
    }, 25);
    expect(() => prepareApiBatch(apiOperationDocument, requests))
      .toThrow('classified state-changing');

    const stateChangingGet = parseApiBatchManifest({
      version: 1,
      requests: [{ id: 'plugin-mutation', operation_id: 'Reindex' }],
    }, 25);
    expect(() => prepareApiBatch(apiOperationDocument, stateChangingGet))
      .toThrow('GET /meilisearch/reindex');
  });

  it('validates path and query values against the OpenAPI operation', () => {
    const missingPath = parseApiBatchManifest({
      version: 1,
      requests: [{ id: 'user', operation_id: 'GetUserById' }],
    }, 25);
    expect(() => prepareApiBatch(apiOperationDocument, missingPath))
      .toThrow('Missing required path parameter');

    const unknownQuery = parseApiBatchManifest({
      version: 1,
      requests: [{
        id: 'user',
        operation_id: 'GetUserById',
        path_params: { userId: 'user-1' },
        query: { unknown: 'value' },
      }],
    }, 25);
    expect(() => prepareApiBatch(apiOperationDocument, unknownQuery))
      .toThrow('Unknown query parameter');
  });
});
