export const OUTPUT_SCHEMAS: Record<string, unknown> = {
  message: {
    type: 'object',
    properties: {
      type: { const: 'message' },
      data: { type: 'object', properties: { message: { type: 'string' }, success: { type: 'boolean' } }, required: ['message', 'success'] },
      meta: { $ref: '#/definitions/meta' },
    },
    required: ['type', 'data'],
  },
  error: {
    type: 'object',
    properties: {
      type: { const: 'error' },
      data: { type: 'object', properties: { error: { type: 'string' }, code: { type: 'number' }, success: { const: false } }, required: ['error', 'success'] },
      meta: { $ref: '#/definitions/meta' },
    },
    required: ['type', 'data'],
  },
  system_info: {
    type: 'object',
    properties: {
      type: { const: 'system_info' },
      data: { type: 'object', properties: { name: { type: 'string' }, version: { type: 'string' }, id: { type: 'string' }, local_address: { type: 'string' } }, required: ['name', 'version'] },
      meta: { $ref: '#/definitions/meta' },
    },
    required: ['type', 'data'],
  },
  users: {
    type: 'object',
    properties: {
      type: { const: 'users' },
      data: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' }, is_admin: { type: 'boolean' } }, required: ['id', 'name'] } },
      meta: { $ref: '#/definitions/meta' },
    },
    required: ['type', 'data'],
  },
  user: {
    type: 'object',
    properties: {
      type: { const: 'user' },
      data: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' }, is_admin: { type: 'boolean' }, configuration: { type: 'object' }, policy: { type: 'object' } }, required: ['id', 'name'] },
      meta: { $ref: '#/definitions/meta' },
    },
    required: ['type', 'data'],
  },
  items: {
    type: 'object',
    properties: {
      type: { const: 'items' },
      data: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' }, type: { type: 'string' }, year: { type: 'number' }, rating: { type: 'number' } }, required: ['id', 'name', 'type'] } },
      meta: { $ref: '#/definitions/meta' },
    },
    required: ['type', 'data'],
  },
  item: {
    type: 'object',
    properties: {
      type: { const: 'item' },
      data: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' }, type: { type: 'string' }, path: { type: 'string' }, overview: { type: 'string' }, media_streams: { type: 'array' }, user_data: { type: 'object' } }, required: ['id', 'name', 'type'] },
      meta: { $ref: '#/definitions/meta' },
    },
    required: ['type', 'data'],
  },
  sessions: {
    type: 'object',
    properties: {
      type: { const: 'sessions' },
      data: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, user_name: { type: 'string' }, client: { type: 'string' }, device_name: { type: 'string' }, now_playing: { type: 'object' }, play_state: { type: 'object' } }, required: ['id'] } },
      meta: { $ref: '#/definitions/meta' },
    },
    required: ['type', 'data'],
  },
  libraries: {
    type: 'object',
    properties: {
      type: { const: 'libraries' },
      data: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, id: { type: 'string' }, collection_type: { type: 'string' } }, required: ['name', 'id'] } },
      meta: { $ref: '#/definitions/meta' },
    },
    required: ['type', 'data'],
  },
  tasks: {
    type: 'object',
    properties: {
      type: { const: 'tasks' },
      data: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' }, key: { type: 'string' }, state: { type: 'string' }, category: { type: 'string' } }, required: ['id', 'name', 'key', 'state'] } },
      meta: { $ref: '#/definitions/meta' },
    },
    required: ['type', 'data'],
  },
  search_result: {
    type: 'object',
    properties: {
      type: { const: 'search_result' },
      data: { type: 'object', properties: { total_count: { type: 'number' }, hints: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' }, type: { type: 'string' } }, required: ['id', 'name', 'type'] } } }, required: ['total_count', 'hints'] },
      meta: { $ref: '#/definitions/meta' },
    },
    required: ['type', 'data'],
  },
  plugins: {
    type: 'object',
    properties: {
      type: { const: 'plugins' },
      data: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' }, version: { type: 'string' }, status: { type: 'string' } }, required: ['id', 'name', 'version'] } },
      meta: { $ref: '#/definitions/meta' },
    },
    required: ['type', 'data'],
  },
  config: {
    type: 'object',
    properties: {
      type: { const: 'config' },
      data: { type: 'object', properties: { server_url: { type: 'string' }, username: { type: 'string' }, output_format: { type: 'string' }, user_id: { type: ['string', 'null'] }, timeout: { type: 'number' } }, required: ['server_url', 'output_format'] },
      meta: { $ref: '#/definitions/meta' },
    },
    required: ['type', 'data'],
  },
  recommendations: {
    type: 'object',
    properties: {
      type: { const: 'recommendations' },
      data: { type: 'array', items: { type: 'object', properties: { baseline_item: { type: 'string' }, category_id: { type: 'string' }, type: { type: 'string' }, items: { type: 'array' } } } },
      meta: { $ref: '#/definitions/meta' },
    },
    required: ['type', 'data'],
  },
  item_counts: {
    type: 'object',
    properties: {
      type: { const: 'item_counts' },
      data: { type: 'object', properties: { movies: { type: 'number' }, series: { type: 'number' }, episodes: { type: 'number' }, albums: { type: 'number' } } },
      meta: { $ref: '#/definitions/meta' },
    },
    required: ['type', 'data'],
  },
  activity_log: {
    type: 'object',
    properties: {
      type: { const: 'activity_log' },
      data: { type: 'array', items: { type: 'object', properties: { id: { type: 'number' }, name: { type: 'string' }, type: { type: 'string' }, date: { type: 'string' }, user_id: { type: 'string' } } } },
      meta: { $ref: '#/definitions/meta' },
    },
    required: ['type', 'data'],
  },
  schedules_direct_countries: {
    type: 'object',
    properties: {
      type: { const: 'schedules_direct_countries' },
      data: { type: ['object', 'array', 'string'] },
      meta: { $ref: '#/definitions/meta' },
    },
    required: ['type', 'data'],
  },
};

const DEFINITIONS = {
  meta: {
    type: 'object',
    properties: {
      timestamp: { type: 'string', format: 'date-time' },
      format: { const: 'toon' },
      version: { type: 'string', pattern: '^\\d+\\.\\d+\\.\\d+$' },
    },
    required: ['timestamp', 'format', 'version'],
  },
};

export function getSchema(type?: string): Record<string, unknown> {
  if (type) {
    const schema = OUTPUT_SCHEMAS[type];
    if (!schema) throw new Error(`Unknown type: ${type}`);
    return { $schema: 'http://json-schema.org/draft-07/schema#', ...schema, definitions: DEFINITIONS };
  }
  return { $schema: 'http://json-schema.org/draft-07/schema#', type: 'object', oneOf: Object.values(OUTPUT_SCHEMAS), definitions: DEFINITIONS, available_types: Object.keys(OUTPUT_SCHEMAS) };
}

export function getAvailableTypes(): string[] {
  return Object.keys(OUTPUT_SCHEMAS);
}
