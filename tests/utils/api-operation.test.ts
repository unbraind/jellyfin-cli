import { describe, expect, it } from 'vitest';
import {
  parseKeyValueOptions,
  prepareApiOperation,
  resolveApiOperation,
} from '../../src/utils/api-operation.js';
import type { OpenApiDocument } from '../../src/utils/openapi-source.js';
import { apiOperationDocument } from '../fixtures/api-operation.js';

describe('exact OpenAPI operation contracts', () => {
  it('resolves operation IDs case-insensitively with input metadata', () => {
    expect(resolveApiOperation(apiOperationDocument, 'getuserbyid')).toEqual({
      operationId: 'GetUserById',
      method: 'GET',
      pathTemplate: '/Users/{userId}',
      summary: 'Get a user',
      tags: ['User'],
      deprecated: false,
      readOnlySafe: true,
      parameters: [
        { name: 'userId', location: 'path', required: true },
        { name: 'includeDisabled', location: 'query', required: false },
      ],
      requestBodyAllowed: false,
      requestBodyRequired: false,
      requestBodyContentTypes: [],
    });
  });

  it('classifies known state-changing GET contracts as unsafe', () => {
    expect(resolveApiOperation(apiOperationDocument, 'Reindex')).toMatchObject({
      method: 'GET',
      pathTemplate: '/meilisearch/reindex',
      readOnlySafe: false,
    });
  });

  it('rejects empty, unknown, and duplicate operation IDs', () => {
    expect(() => resolveApiOperation(apiOperationDocument, '')).toThrow('must not be empty');
    expect(() => resolveApiOperation(apiOperationDocument, 'Missing')).toThrow('Unknown OpenAPI operation ID');
    const duplicate = {
      paths: {
        '/One': { get: { operationId: 'Duplicate' } },
        '/Two': { get: { operationId: 'Duplicate' } },
      },
    } as OpenApiDocument;
    expect(() => resolveApiOperation(duplicate, 'duplicate')).toThrow('not unique');
  });

  it('parses repeatable key=value options without losing values', () => {
    expect(parseKeyValueOptions(['limit=2', 'tag=one', 'tag=two'], '--query')).toEqual({
      limit: '2',
      tag: ['one', 'two'],
    });
    expect(() => parseKeyValueOptions(['invalid'], '--query')).toThrow('key=value');
    expect(() => parseKeyValueOptions(['=invalid'], '--query')).toThrow('key=value');
  });

  it('materializes declared path and query values', () => {
    const operation = resolveApiOperation(apiOperationDocument, 'GetUserById');
    expect(prepareApiOperation(
      operation,
      { userId: 'user / one' },
      { includeDisabled: 'true' },
    )).toEqual({
      method: 'GET',
      path: '/Users/user%20%2F%20one',
      query: { includeDisabled: 'true' },
      body: undefined,
    });
  });

  it('rejects undeclared, missing, repeated, and incompatible values', () => {
    const getUser = resolveApiOperation(apiOperationDocument, 'GetUserById');
    expect(() => prepareApiOperation(getUser, {}, {})).toThrow(
      'Missing required path parameter',
    );
    expect(() => prepareApiOperation(
      getUser,
      { userId: ['one', 'two'] },
      {},
    )).toThrow('only once');
    expect(() => prepareApiOperation(
      getUser,
      { userId: 'one', extra: 'two' },
      {},
    )).toThrow('Unknown path parameter');
    expect(() => prepareApiOperation(
      getUser,
      { userId: 'one' },
      { extra: 'two' },
    )).toThrow('Unknown query parameter');
    expect(() => prepareApiOperation(
      getUser,
      { userId: 'one' },
      {},
      {},
    )).toThrow('does not declare a request body');

    const createUser = resolveApiOperation(apiOperationDocument, 'CreateUser');
    expect(() => prepareApiOperation(createUser, {}, {})).toThrow(
      'requires a JSON request body',
    );
    expect(prepareApiOperation(createUser, {}, {}, { Name: 'New user' })).toEqual({
      method: 'POST',
      path: '/Users/New',
      query: {},
      body: { Name: 'New user' },
    });
  });
});
