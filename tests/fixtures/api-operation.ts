import type { OpenApiDocument } from '../../src/utils/openapi-source.js';

/** Minimal OpenAPI fixture covering exact read-only, JSON mutation, and binary response paths. */
export const apiOperationDocument = {
  info: { version: '10.11.11' },
  security: [{ CustomAuthentication: [] }],
  paths: {
    '/Users/{userId}': {
      parameters: [{
        name: 'userId',
        in: 'path',
        required: true,
        description: 'User identifier.',
        schema: { type: 'string', format: 'uuid' },
      }],
      get: {
        operationId: 'GetUserById',
        summary: 'Get a user',
        tags: ['User'],
        parameters: [
          {
            name: 'userId',
            in: 'path',
            required: true,
            description: 'Operation-specific user identifier.',
            schema: { type: 'string', format: 'uuid' },
          },
          {
            name: 'includeDisabled',
            in: 'query',
            required: false,
            schema: { type: 'boolean', default: false },
          },
        ],
        responses: {
          200: {
            description: 'User details.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/UserDto' } } },
          },
          404: { description: 'User not found.' },
        },
      },
    },
    '/Users/New': {
      post: {
        operationId: 'CreateUser',
        tags: ['User'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateUserByName' },
            },
          },
        },
        responses: { 204: { description: 'User created.' } },
      },
    },
    '/Binary': {
      get: { operationId: 'GetBinary', tags: ['Image'] },
    },
    '/meilisearch/reindex': {
      get: { operationId: 'Reindex', tags: ['Meilisearch'] },
    },
    '/Audio/{itemId}/Lyrics': {
      post: {
        operationId: 'UploadLyrics',
        parameters: [{ name: 'itemId', in: 'path', required: true }],
        requestBody: { required: true, content: { 'text/plain': {} } },
      },
    },
    '/Items/{itemId}/Images/{imageType}': {
      post: {
        operationId: 'SetItemImage',
        parameters: [
          { name: 'itemId', in: 'path', required: true },
          { name: 'imageType', in: 'path', required: true },
        ],
        requestBody: { required: true, content: { 'image/*': {} } },
      },
    },
  },
  components: {
    schemas: {
      UserDto: { type: 'object' },
      CreateUserByName: {
        type: 'object',
        required: ['Name'],
        properties: {
          Name: { type: 'string', minLength: 1, example: 'New user' },
        },
      },
    },
  },
} as OpenApiDocument;
