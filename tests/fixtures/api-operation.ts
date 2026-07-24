import type { OpenApiDocument } from '../../src/utils/openapi-source.js';

/** Minimal OpenAPI fixture covering exact read-only, JSON mutation, and binary response paths. */
export const apiOperationDocument = {
  info: { version: '10.11.11' },
  paths: {
    '/Users/{userId}': {
      get: {
        operationId: 'GetUserById',
        summary: 'Get a user',
        tags: ['User'],
        parameters: [
          { name: 'userId', in: 'path', required: true },
          { name: 'includeDisabled', in: 'query', required: false },
        ],
      },
    },
    '/Users/New': {
      post: {
        operationId: 'CreateUser',
        tags: ['User'],
        requestBody: {
          required: true,
          content: { 'application/json': {} },
        },
      },
    },
    '/Binary': {
      get: { operationId: 'GetBinary', tags: ['Image'] },
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
} as OpenApiDocument;
