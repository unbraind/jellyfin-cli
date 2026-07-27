import type {
  JellyfinEventRecord,
  JellyfinEventStopReason,
  JellyfinEventSubscription,
  JellyfinEventWatchResult,
  JellyfinSocketMessage,
} from '../types/events.js';

const OPEN_STATE = 1;
const CONTROL_TYPES = new Set(['ForceKeepAlive', 'KeepAlive']);
const SUBSCRIPTION_MESSAGES: Record<
  JellyfinEventSubscription,
  { start: string; stop: string }
> = {
  activity: { start: 'ActivityLogEntryStart', stop: 'ActivityLogEntryStop' },
  sessions: { start: 'SessionsStart', stop: 'SessionsStop' },
  tasks: { start: 'ScheduledTasksInfoStart', stop: 'ScheduledTasksInfoStop' },
};

interface EventSocket {
  readonly readyState: number;
  addEventListener(type: string, listener: (event: Event) => void): void;
  removeEventListener(type: string, listener: (event: Event) => void): void;
  send(data: string): void;
  close(code?: number, reason?: string): void;
}

interface SocketMessageEvent extends Event {
  readonly data: unknown;
}

/** Configuration and bounded-stop controls for one authenticated event watch. */
export interface WatchJellyfinEventsOptions {
  serverUrl: string;
  accessToken: string;
  eventTypes: string[];
  subscriptions: JellyfinEventSubscription[];
  includeControl: boolean;
  count: number;
  durationMs: number;
  connectTimeoutMs: number;
  maxMessageBytes: number;
  intervalMs: number;
  signal?: AbortSignal;
  onEvent?: (event: JellyfinEventRecord) => void;
}

interface WatchJellyfinEventsDependencies {
  createSocket?: (url: string) => EventSocket;
  now?: () => number;
}

/**
 * Builds the credential-bearing WebSocket URL without logging or persisting it.
 * @param serverUrl - Configured Jellyfin HTTP or HTTPS base URL.
 * @param accessToken - In-memory API key or authenticated session token.
 * @returns The official `/socket?ApiKey=...` transport URL.
 */
export function buildJellyfinWebSocketUrl(serverUrl: string, accessToken: string): string {
  const base = new URL(serverUrl.endsWith('/') ? serverUrl : `${serverUrl}/`);
  if (base.protocol !== 'http:' && base.protocol !== 'https:') {
    throw new Error('Jellyfin server URL must use http or https');
  }
  base.protocol = base.protocol === 'https:' ? 'wss:' : 'ws:';
  base.pathname = `${base.pathname.replace(/\/+$/u, '')}/socket`;
  base.search = '';
  base.hash = '';
  base.searchParams.set('ApiKey', accessToken);
  return base.toString();
}

/**
 * Strictly decodes a Jellyfin WebSocket message envelope.
 * @param text - Raw UTF-8 JSON text received from Jellyfin.
 * @param maxMessageBytes - Maximum accepted encoded message size.
 * @returns A validated message type and optional payload.
 */
export function parseJellyfinSocketMessage(text: string, maxMessageBytes: number): JellyfinSocketMessage {
  if (Buffer.byteLength(text) > maxMessageBytes) {
    throw new Error(`WebSocket message exceeds --max-message-bytes (${maxMessageBytes})`);
  }
  let decoded: unknown;
  try {
    decoded = JSON.parse(text) as unknown;
  } catch {
    throw new Error('Jellyfin WebSocket returned invalid JSON');
  }
  if (typeof decoded !== 'object' || decoded === null || Array.isArray(decoded)) {
    throw new Error('Jellyfin WebSocket message must be an object');
  }
  const message = decoded as Record<string, unknown>;
  if (typeof message.MessageType !== 'string' || message.MessageType.length === 0) {
    throw new Error('Jellyfin WebSocket message is missing MessageType');
  }
  return { MessageType: message.MessageType, Data: message.Data };
}

function nativeSocket(url: string): EventSocket {
  return new WebSocket(url) as unknown as EventSocket;
}

async function messageText(data: unknown): Promise<string> {
  if (typeof data === 'string') return data;
  if (data instanceof ArrayBuffer) return new TextDecoder().decode(data);
  if (ArrayBuffer.isView(data)) {
    return new TextDecoder().decode(new Uint8Array(data.buffer, data.byteOffset, data.byteLength));
  }
  if (data instanceof Blob) return data.text();
  throw new Error('Jellyfin WebSocket returned an unsupported message encoding');
}

/**
 * Watches authenticated Jellyfin events until an explicit, bounded stop condition is met.
 * @param options - Authentication, filters, subscriptions, and resource limits.
 * @param dependencies - Optional transport and clock adapters for deterministic tests.
 * @returns The ordered event records and terminal watch summary.
 */
export function watchJellyfinEvents(
  options: WatchJellyfinEventsOptions,
  dependencies: WatchJellyfinEventsDependencies = {},
): Promise<JellyfinEventWatchResult> {
  const createSocket = dependencies.createSocket ?? nativeSocket;
  const now = dependencies.now ?? Date.now;
  const startedAt = now();
  const records: JellyfinEventRecord[] = [];
  const acceptedTypes = new Set(options.eventTypes);
  let socket: EventSocket;
  try {
    socket = createSocket(buildJellyfinWebSocketUrl(options.serverUrl, options.accessToken));
  } catch {
    return Promise.reject(new Error('Failed to create Jellyfin WebSocket connection'));
  }

  return new Promise((resolve, reject) => {
    let settled = false;
    let keepAliveTimer: ReturnType<typeof setTimeout> | undefined;
    const connectTimer = setTimeout(
      () => finishError(new Error('Timed out connecting to Jellyfin WebSocket')),
      options.connectTimeoutMs,
    );
    const durationTimer = setTimeout(
      () => finish('duration_reached'),
      options.durationMs,
    );

    function cleanup(): void {
      clearTimeout(connectTimer);
      clearTimeout(durationTimer);
      if (keepAliveTimer) clearTimeout(keepAliveTimer);
      options.signal?.removeEventListener('abort', onAbort);
      socket.removeEventListener('open', onOpen);
      socket.removeEventListener('message', onMessage);
      socket.removeEventListener('error', onError);
      socket.removeEventListener('close', onClose);
    }

    function finish(reason: JellyfinEventStopReason): void {
      if (settled) return;
      settled = true;
      if (socket.readyState === OPEN_STATE) {
        for (const subscription of options.subscriptions) {
          socket.send(JSON.stringify({ MessageType: SUBSCRIPTION_MESSAGES[subscription].stop }));
        }
        socket.close(1000, 'bounded watch complete');
      }
      cleanup();
      resolve({
        kind: 'summary',
        stop_reason: reason,
        event_count: records.length,
        duration_ms: Math.max(0, now() - startedAt),
        subscriptions: options.subscriptions,
        event_types: options.eventTypes,
        events: records,
      });
    }

    function finishError(error: Error): void {
      if (settled) return;
      settled = true;
      if (socket.readyState === OPEN_STATE) socket.close(1011, 'event watch failed');
      cleanup();
      reject(error);
    }

    function onOpen(): void {
      clearTimeout(connectTimer);
      for (const subscription of options.subscriptions) {
        socket.send(JSON.stringify({
          MessageType: SUBSCRIPTION_MESSAGES[subscription].start,
          Data: `0,${options.intervalMs}`,
        }));
      }
    }

    function onMessage(event: Event): void {
      void messageText((event as SocketMessageEvent).data).then((text) => {
        const message = parseJellyfinSocketMessage(text, options.maxMessageBytes);
        if (message.MessageType === 'ForceKeepAlive' && typeof message.Data === 'number') {
          if (keepAliveTimer) clearTimeout(keepAliveTimer);
          keepAliveTimer = setTimeout(() => {
            if (socket.readyState === OPEN_STATE) {
              socket.send(JSON.stringify({ MessageType: 'KeepAlive' }));
            }
          }, Math.max(1, message.Data / 2));
        }
        const selected = acceptedTypes.size === 0 || acceptedTypes.has(message.MessageType);
        if (!selected || (!options.includeControl && CONTROL_TYPES.has(message.MessageType))) return;
        const record: JellyfinEventRecord = {
          kind: 'event',
          sequence: records.length + 1,
          received_at: new Date(now()).toISOString(),
          message_type: message.MessageType,
          data: message.Data ?? null,
        };
        records.push(record);
        options.onEvent?.(record);
        if (records.length >= options.count) finish('count_reached');
      }).catch((error: unknown) => {
        finishError(error instanceof Error ? error : new Error('Failed to process WebSocket message'));
      });
    }

    function onError(): void {
      finishError(new Error('Jellyfin WebSocket connection failed'));
    }

    function onClose(): void {
      finish('socket_closed');
    }

    function onAbort(): void {
      finish('aborted');
    }

    socket.addEventListener('open', onOpen);
    socket.addEventListener('message', onMessage);
    socket.addEventListener('error', onError);
    socket.addEventListener('close', onClose);
    options.signal?.addEventListener('abort', onAbort, { once: true });
    if (options.signal?.aborted) onAbort();
  });
}
