const TOOL_CLASSIFICATION_SCHEMA = {
  type: 'object',
  properties: {
    command: { type: 'string' },
    read_only_safe: { type: 'boolean' },
    reason: { type: 'string' },
  },
  required: ['command', 'read_only_safe', 'reason'],
};

const OPERATION_SCHEMA = {
  type: 'object',
  properties: {
    method: { type: 'string' },
    path: { type: 'string' },
    operation_id: { type: ['string', 'null'] },
    tags: { type: 'array', items: { type: 'string' } },
    read_only_safe: { type: 'boolean' },
    deprecated: { type: 'boolean' },
  },
  required: ['method', 'path', 'operation_id', 'tags', 'read_only_safe', 'deprecated'],
};

const COVERAGE_SNAPSHOT_PROPERTIES = {
  operation_scope_count: { type: 'number' },
  mapped_operation_count: { type: 'number' },
  unmapped_operation_count: { type: 'number' },
  unmapped_tool_count: { type: 'number' },
  coverage_percent: { type: 'number' },
  tool_scope_count: { type: 'number' },
  mapped_tool_count: { type: 'number' },
  unmatched_operations_total: { type: 'number' },
  unmatched_tools_total: { type: 'number' },
  unmatched_tools_truncated: { type: 'boolean' },
  local_only_tools_total: { type: 'number' },
  local_only_tools_truncated: { type: 'boolean' },
  non_endpoint_tools_total: { type: 'number' },
  non_endpoint_tools_truncated: { type: 'boolean' },
  unmatched_tools: { type: 'array', items: TOOL_CLASSIFICATION_SCHEMA },
  local_only_tools: { type: 'array', items: TOOL_CLASSIFICATION_SCHEMA },
  non_endpoint_tools: { type: 'array', items: TOOL_CLASSIFICATION_SCHEMA },
  unmatched_operations: { type: 'array', items: OPERATION_SCHEMA },
};

const COVERAGE_SNAPSHOT_REQUIRED = [
  'operation_scope_count',
  'mapped_operation_count',
  'unmapped_operation_count',
  'unmapped_tool_count',
  'coverage_percent',
  'tool_scope_count',
  'mapped_tool_count',
  'unmatched_operations_total',
  'unmatched_tools_total',
  'local_only_tools_total',
  'non_endpoint_tools_total',
];

/** TOON envelope schema for `jf schema coverage` output. */
export const OPENAPI_COVERAGE_SCHEMA = {
  type: 'object',
  properties: {
    type: { const: 'openapi_coverage' },
    data: {
      type: 'object',
      properties: {
        source_path: { type: 'string' },
        source_kind: { type: 'string' },
        server_version: { type: ['string', 'null'] },
        path_count: { type: 'number' },
        operation_count: { type: 'number' },
        ...COVERAGE_SNAPSHOT_PROPERTIES,
        min_score: { type: 'number' },
      },
      required: [
        'source_path',
        'source_kind',
        'path_count',
        'operation_count',
        ...COVERAGE_SNAPSHOT_REQUIRED,
        'min_score',
      ],
    },
  },
  required: ['type', 'data'],
};

/** TOON envelope schema for `jf schema research` output. */
export const OPENAPI_RESEARCH_SCHEMA = {
  type: 'object',
  properties: {
    type: { const: 'openapi_research' },
    data: {
      type: 'object',
      properties: {
        source_path: { type: 'string' },
        source_kind: { type: 'string' },
        server_version: { type: ['string', 'null'] },
        path_count: { type: 'number' },
        operation_count: { type: 'number' },
        min_score: { type: 'number' },
        full_scope: {
          type: 'object',
          properties: COVERAGE_SNAPSHOT_PROPERTIES,
          required: COVERAGE_SNAPSHOT_REQUIRED,
        },
        read_only_scope: {
          type: 'object',
          properties: COVERAGE_SNAPSHOT_PROPERTIES,
          required: COVERAGE_SNAPSHOT_REQUIRED,
        },
      },
      required: [
        'source_path',
        'source_kind',
        'path_count',
        'operation_count',
        'min_score',
        'full_scope',
        'read_only_scope',
      ],
    },
  },
  required: ['type', 'data'],
};
