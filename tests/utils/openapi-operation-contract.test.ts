import { describe, expect, it } from 'vitest';
import { resolveApiOperation } from '../../src/utils/api-operation.js';
import { buildApiInvocationContract } from '../../src/utils/openapi-operation-contract.js';
import { apiOperationDocument } from '../fixtures/api-operation.js';

describe('OpenAPI invocation contracts', () => {
  it('merges path parameters and emits deterministic rich metadata', () => {
    const operation = resolveApiOperation(apiOperationDocument, 'GetUserById');
    expect(buildApiInvocationContract(apiOperationDocument, operation)).toEqual({
      parameters: [
        {
          name: 'userId',
          in: 'path',
          required: true,
          description: 'Operation-specific user identifier.',
          style: undefined,
          explode: undefined,
          allow_empty_value: undefined,
          schema: { type: 'string', format: 'uuid' },
        },
        {
          name: 'includeDisabled',
          in: 'query',
          required: false,
          description: undefined,
          style: undefined,
          explode: undefined,
          allow_empty_value: undefined,
          schema: { type: 'boolean', default: false },
        },
      ],
      request_bodies: [],
      responses: [
        { status: '200', description: 'User details.', content_types: ['application/json'] },
        { status: '404', description: 'User not found.', content_types: [] },
      ],
      security: [['CustomAuthentication']],
      invocation: {
        command: 'get',
        argv_template: ['jf', 'api', 'get', 'GetUserById', '--path-param', 'userId=<userId>'],
        requires_confirmation: false,
      },
    });
  });

  it('bounds nested schemas and rejects inconsistent operation identity', () => {
    const operation = resolveApiOperation(apiOperationDocument, 'CreateUser');
    const contract = buildApiInvocationContract(apiOperationDocument, operation);
    expect(contract.request_bodies[0]?.schema).toMatchObject({
      ref: '#/components/schemas/CreateUserByName',
      type: 'object',
      required: ['Name'],
      properties: { Name: { type: 'string', minLength: 1 } },
    });
    expect(() => buildApiInvocationContract({ paths: {} }, operation)).toThrow('disappeared');
  });
});
