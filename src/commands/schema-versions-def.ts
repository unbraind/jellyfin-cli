const RELEASE_SCHEMA = {
  type: 'object',
  properties: {
    version: { type: 'string' },
    tag: { type: 'string' },
    name: { type: 'string' },
    release_url: { type: 'string' },
    published_at: { type: 'string' },
    prerelease: { type: 'boolean' },
    openapi_available: { type: 'boolean' },
    openapi_source_kind: { enum: ['official', 'cache'] },
  },
  required: [
    'version', 'tag', 'name', 'release_url', 'published_at', 'prerelease',
    'openapi_available', 'openapi_source_kind',
  ],
};

/** Strict output contract for current official Jellyfin release discovery. */
export const JELLYFIN_VERSIONS_SCHEMA = {
  type: 'object',
  properties: {
    type: { const: 'jellyfin_versions' },
    data: {
      type: 'object',
      properties: {
        live_version: { type: ['string', 'null'] },
        stable: RELEASE_SCHEMA,
        preview: { anyOf: [RELEASE_SCHEMA, { type: 'null' }] },
        aliases: {
          type: 'object',
          properties: {
            latest_stable: { type: 'string' },
            latest_preview: { type: ['string', 'null'] },
          },
          required: ['latest_stable', 'latest_preview'],
        },
        compatibility_commands: {
          type: 'object',
          properties: {
            stable: { type: 'array', items: { type: 'string' } },
            preview: { type: ['array', 'null'], items: { type: 'string' } },
          },
          required: ['stable', 'preview'],
        },
      },
      required: ['live_version', 'stable', 'preview', 'aliases', 'compatibility_commands'],
    },
  },
  required: ['type', 'data'],
};
