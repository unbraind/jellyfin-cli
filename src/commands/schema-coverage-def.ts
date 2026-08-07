const TOOL_CLASSIFICATION_SCHEMA = {
  type: 'object',
  properties: {
    command: { type: 'string' },
    read_only_safe: { type: 'boolean' },
    reason: {
      enum: [
        'no_openapi_match_above_min_score',
        'local_only_command',
        'openapi_orchestration',
        'websocket_transport',
        'optional_plugin_api',
      ],
    },
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

const VERSION_UNAVAILABLE_TOOL_SCHEMA = {
  type: 'object',
  properties: {
    command: { type: 'string' },
    read_only_safe: { type: 'boolean' },
    reason: { const: 'server_version_unavailable' },
    required_method: { type: 'string' },
    required_path: { type: 'string' },
  },
  required: ['command', 'read_only_safe', 'reason', 'required_method', 'required_path'],
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
  unmatched_operations_truncated: { type: 'boolean' },
  unmatched_tools_total: { type: 'number' },
  unmatched_tools_truncated: { type: 'boolean' },
  local_only_tools_total: { type: 'number' },
  local_only_tools_truncated: { type: 'boolean' },
  non_endpoint_tools_total: { type: 'number' },
  non_endpoint_tools_truncated: { type: 'boolean' },
  version_unavailable_tools_total: { type: 'number' },
  version_unavailable_tools_truncated: { type: 'boolean' },
  unmatched_tools: { type: 'array', items: TOOL_CLASSIFICATION_SCHEMA },
  local_only_tools: { type: 'array', items: TOOL_CLASSIFICATION_SCHEMA },
  non_endpoint_tools: { type: 'array', items: TOOL_CLASSIFICATION_SCHEMA },
  version_unavailable_tools: { type: 'array', items: VERSION_UNAVAILABLE_TOOL_SCHEMA },
  unmatched_operations: { type: 'array', items: OPERATION_SCHEMA },
  unmatched_by_tag_total: { type: 'number' },
  unmatched_by_tag: {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        tag: { type: 'string' },
        operations: { type: 'number' },
        sample_paths: { type: 'array', items: { type: 'string' } },
      },
      required: ['tag', 'operations', 'sample_paths'],
    },
  },
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
  'unmatched_tools_truncated',
  'local_only_tools_total',
  'local_only_tools_truncated',
  'non_endpoint_tools_total',
  'non_endpoint_tools_truncated',
  'version_unavailable_tools_total',
  'version_unavailable_tools_truncated',
  'unmatched_tools',
  'local_only_tools',
  'non_endpoint_tools',
  'version_unavailable_tools',
  'unmatched_by_tag_total',
  'unmatched_by_tag',
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
        'unmatched_operations',
        'unmatched_operations_truncated',
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
