/** JSON Schema for rich, side-effect-free exact operation inspection output. */
export const API_OPERATION_SCHEMA = {
  type: 'object',
  properties: {
    type: { const: 'api_operation' },
    data: {
      type: 'object',
      properties: {
        operation_id: { type: 'string' },
        method: { type: 'string' },
        path_template: { type: 'string' },
        read_only_safe: { type: 'boolean' },
        deprecated: { type: 'boolean' },
        parameters: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              in: { enum: ['path', 'query'] },
              required: { type: 'boolean' },
              description: { type: 'string' },
              style: { type: 'string' },
              explode: { type: 'boolean' },
              allow_empty_value: { type: 'boolean' },
              schema: { type: 'object' },
            },
            required: ['name', 'in', 'required'],
          },
        },
        request_bodies: {
          type: 'array',
          items: {
            type: 'object',
            properties: { content_type: { type: 'string' }, schema: { type: 'object' } },
            required: ['content_type'],
          },
        },
        responses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              status: { type: 'string' },
              description: { type: 'string' },
              content_types: { type: 'array', items: { type: 'string' } },
            },
            required: ['status', 'content_types'],
          },
        },
        security: {
          type: 'array',
          items: { type: 'array', items: { type: 'string' } },
        },
        invocation: {
          type: 'object',
          properties: {
            command: { enum: ['get', 'mutate'] },
            argv_template: { type: 'array', items: { type: 'string' } },
            requires_confirmation: { type: 'boolean' },
          },
          required: ['command', 'argv_template', 'requires_confirmation'],
        },
        request_body_allowed: { type: 'boolean' },
        request_body_required: { type: 'boolean' },
        request_body_content_types: { type: 'array' },
        openapi_source: { type: 'string' },
      },
      required: [
        'operation_id',
        'method',
        'path_template',
        'read_only_safe',
        'deprecated',
        'parameters',
        'request_bodies',
        'responses',
        'security',
        'invocation',
        'request_body_allowed',
        'request_body_required',
        'request_body_content_types',
        'openapi_source',
      ],
    },
  },
  required: ['type', 'data'],
};

