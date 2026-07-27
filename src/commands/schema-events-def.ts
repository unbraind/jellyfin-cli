const EVENT_RECORD_SCHEMA = {
  type: 'object',
  properties: {
    kind: { const: 'event' },
    sequence: { type: 'number' },
    received_at: { type: 'string', format: 'date-time' },
    message_type: { type: 'string' },
    data: {},
  },
  required: ['kind', 'sequence', 'received_at', 'message_type', 'data'],
};

const EVENT_SUMMARY_PROPERTIES = {
  kind: { const: 'summary' },
  stop_reason: {
    enum: ['count_reached', 'duration_reached', 'socket_closed', 'aborted'],
  },
  event_count: { type: 'number' },
  duration_ms: { type: 'number' },
  subscriptions: { type: 'array', items: { enum: ['activity', 'sessions', 'tasks'] } },
  event_types: { type: 'array', items: { type: 'string' } },
};

/** TOON envelope schema for the supported Jellyfin event type catalog. */
export const EVENT_TYPES_SCHEMA = {
  type: 'object',
  properties: {
    type: { const: 'event_types' },
    data: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          message_type: { type: 'string' },
          category: {
            enum: ['control', 'library', 'playback', 'plugin', 'server', 'session', 'syncplay', 'user'],
          },
          periodic_subscription: {
            type: ['string', 'null'],
          },
          read_only_safe: { const: true },
        },
        required: ['message_type', 'category', 'periodic_subscription', 'read_only_safe'],
      },
    },
  },
  required: ['type', 'data'],
};

/** TOON envelope schema for one completed bounded event watch. */
export const EVENT_WATCH_SCHEMA = {
  type: 'object',
  properties: {
    type: { const: 'event_watch' },
    data: {
      type: 'object',
      properties: {
        ...EVENT_SUMMARY_PROPERTIES,
        events: { type: 'array', items: EVENT_RECORD_SCHEMA },
      },
      required: [
        'kind',
        'stop_reason',
        'event_count',
        'duration_ms',
        'subscriptions',
        'event_types',
        'events',
      ],
    },
  },
  required: ['type', 'data'],
};

/** Raw NDJSON record schema used by `jf events watch --stream --format json`. */
export const EVENT_STREAM_RECORD_SCHEMA = {
  oneOf: [
    EVENT_RECORD_SCHEMA,
    {
      type: 'object',
      properties: EVENT_SUMMARY_PROPERTIES,
      required: [
        'kind',
        'stop_reason',
        'event_count',
        'duration_ms',
        'subscriptions',
        'event_types',
      ],
    },
  ],
};
