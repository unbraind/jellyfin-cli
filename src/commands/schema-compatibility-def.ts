/** Strict output contract for version-aware OpenAPI compatibility manifests. */
export const OPENAPI_COMPATIBILITY_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    type: { const: 'openapi_compatibility' },
    data: {
      type: 'object',
      additionalProperties: false,
      properties: {
        compatible: { type: 'boolean' },
        baseline: {
          type: 'object',
          additionalProperties: false,
          properties: {
            source_kind: { enum: ['official', 'live'] },
            artifact_version: { type: ['string', 'null'] },
            api_version: { type: ['string', 'null'] },
            operation_count: { type: 'integer', minimum: 0 },
            component_schema_count: { type: 'integer', minimum: 0 },
          },
          required: [
            'source_kind',
            'artifact_version',
            'api_version',
            'operation_count',
            'component_schema_count',
          ],
        },
        target: {
          type: 'object',
          additionalProperties: false,
          properties: {
            source_kind: { enum: ['official', 'cache'] },
            artifact_version: { type: 'string' },
            api_version: { type: ['string', 'null'] },
            prerelease: { type: 'boolean' },
            operation_count: { type: 'integer', minimum: 0 },
            component_schema_count: { type: 'integer', minimum: 0 },
          },
          required: [
            'source_kind',
            'artifact_version',
            'api_version',
            'prerelease',
            'operation_count',
            'component_schema_count',
          ],
        },
        summary: {
          type: 'object',
          additionalProperties: false,
          properties: {
            breaking: { type: 'integer', minimum: 0 },
            review: { type: 'integer', minimum: 0 },
            non_breaking: { type: 'integer', minimum: 0 },
            total: { type: 'integer', minimum: 0 },
            counts_by_kind: {
              type: 'object',
              additionalProperties: { type: 'integer', minimum: 0 },
            },
          },
          required: ['breaking', 'review', 'non_breaking', 'total', 'counts_by_kind'],
        },
        changes: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            properties: {
              severity: { enum: ['breaking', 'review', 'non_breaking'] },
              kind: { type: 'string' },
              subject: { type: 'string' },
              detail: { type: 'string' },
            },
            required: ['severity', 'kind', 'subject', 'detail'],
          },
        },
        changes_truncated: { type: 'boolean' },
      },
      required: [
        'compatible',
        'baseline',
        'target',
        'summary',
        'changes',
        'changes_truncated',
      ],
    },
  },
  required: ['type', 'data'],
};
