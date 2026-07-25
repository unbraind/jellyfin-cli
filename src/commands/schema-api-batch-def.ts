const BATCH_RESULT_SCHEMA = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    operation_id: { type: 'string' },
    ok: { type: 'boolean' },
    status: { type: ['number', 'null'] },
    content_type: { type: ['string', 'null'] },
    encoding: { enum: ['json', 'text', 'base64', 'empty'] },
    response_bytes: { type: 'number' },
    error: { type: 'string' },
    data: {},
  },
  required: ['id', 'operation_id', 'ok', 'status'],
};

/** Output schema for a fully resolved API batch dry run. */
export const API_BATCH_PLAN_SCHEMA = {
  type: 'object',
  properties: {
    type: { const: 'api_batch_plan' },
    data: {
      type: 'object',
      properties: {
        dry_run: { const: true },
        openapi_source: { type: 'string' },
        request_count: { type: 'number' },
        requests: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              operation_id: { type: 'string' },
              method: { enum: ['GET', 'HEAD', 'OPTIONS'] },
              path: { type: 'string' },
              query: { type: 'object' },
              deprecated: { type: 'boolean' },
            },
            required: ['id', 'operation_id', 'method', 'path', 'query', 'deprecated'],
          },
        },
      },
      required: ['dry_run', 'openapi_source', 'request_count', 'requests'],
    },
  },
  required: ['type', 'data'],
};

/** Output schema for deterministic ordered API batch execution results. */
export const API_BATCH_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    type: { const: 'api_batch_response' },
    data: {
      type: 'object',
      properties: {
        dry_run: { const: false },
        openapi_source: { type: 'string' },
        request_count: { type: 'number' },
        success_count: { type: 'number' },
        failure_count: { type: 'number' },
        response_bytes: { type: 'number' },
        results: { type: 'array', items: BATCH_RESULT_SCHEMA },
      },
      required: [
        'dry_run',
        'openapi_source',
        'request_count',
        'success_count',
        'failure_count',
        'response_bytes',
        'results',
      ],
    },
  },
  required: ['type', 'data'],
};
