import { describe, expect, it } from 'vitest';
import type { JellyfinEventSubscription } from '../../src/types/events.js';
import {
  buildJellyfinWebSocketUrl,
  parseJellyfinSocketMessage,
  watchJellyfinEvents,
} from '../../src/utils/websocket-events.js';

class FakeSocket {
  readyState = 0;
  readonly sent: string[] = [];
  readonly closeCalls: { code?: number; reason?: string }[] = [];
  private readonly target = new EventTarget();

  addEventListener(type: string, listener: (event: Event) => void): void {
    this.target.addEventListener(type, listener);
  }

  removeEventListener(type: string, listener: (event: Event) => void): void {
    this.target.removeEventListener(type, listener);
  }

  send(data: string): void {
    this.sent.push(data);
  }

  close(code?: number, reason?: string): void {
    this.readyState = 3;
    this.closeCalls.push({ code, reason });
    this.target.dispatchEvent(new Event('close'));
  }

  open(): void {
    this.readyState = 1;
    this.target.dispatchEvent(new Event('open'));
  }

  message(data: unknown): void {
    const event = new Event('message') as Event & { data: unknown };
    event.data = data;
    this.target.dispatchEvent(event);
  }

  error(): void {
    this.target.dispatchEvent(new Event('error'));
  }
}

const baseOptions = {
  serverUrl: 'https://media.example.test/jellyfin',
  accessToken: 'secret token',
  eventTypes: [] as string[],
  subscriptions: [] as JellyfinEventSubscription[],
  includeControl: false,
  count: 1,
  durationMs: 10_000,
  connectTimeoutMs: 1_000,
  maxMessageBytes: 1024,
  intervalMs: 1000,
};

describe('Jellyfin WebSocket events', () => {
  it('builds the official same-origin socket URL with an encoded token', () => {
    const url = new URL(buildJellyfinWebSocketUrl(
      'https://media.example.test/jellyfin/',
      'token with spaces',
    ));

    expect(url.protocol).toBe('wss:');
    expect(url.pathname).toBe('/jellyfin/socket');
    expect(url.searchParams.get('ApiKey')).toBe('token with spaces');
    expect(() => buildJellyfinWebSocketUrl('ftp://media.example.test', 'token')).toThrow(
      'must use http or https',
    );
  });

  it('strictly validates message encoding, size, JSON, object shape, and type', () => {
    expect(parseJellyfinSocketMessage(
      '{"MessageType":"LibraryChanged","Data":{"FoldersAdded":[]}}',
      1024,
    )).toEqual({
      MessageType: 'LibraryChanged',
      Data: { FoldersAdded: [] },
    });
    expect(() => parseJellyfinSocketMessage('not json', 1024)).toThrow('invalid JSON');
    expect(() => parseJellyfinSocketMessage('[]', 1024)).toThrow('must be an object');
    expect(() => parseJellyfinSocketMessage('{}', 1024)).toThrow('missing MessageType');
    expect(() => parseJellyfinSocketMessage('{"MessageType":"Sessions"}', 5)).toThrow(
      'exceeds --max-message-bytes',
    );
  });

  it('subscribes, filters, handles keepalive, and stops at the requested count', async () => {
    const socket = new FakeSocket();
    const emitted: string[] = [];
    const resultPromise = watchJellyfinEvents({
      ...baseOptions,
      eventTypes: ['Sessions'],
      subscriptions: ['sessions'],
      onEvent: (event) => emitted.push(event.message_type),
    }, {
      createSocket: (url) => {
        expect(url).toContain('/jellyfin/socket?ApiKey=');
        return socket;
      },
      now: () => Date.parse('2026-07-27T20:00:00.000Z'),
    });

    socket.open();
    socket.message('{"MessageType":"ForceKeepAlive","Data":1}');
    await new Promise((resolve) => setTimeout(resolve, 510));
    expect(socket.sent.some((value) => value.includes('"MessageType":"KeepAlive"'))).toBe(true);
    socket.message('{"MessageType":"LibraryChanged","Data":{}}');
    socket.message(new Blob(['{"MessageType":"Sessions","Data":[]}']));
    const result = await resultPromise;

    expect(JSON.parse(socket.sent[0] ?? '{}')).toEqual({
      MessageType: 'SessionsStart',
      Data: '0,1000',
    });
    expect(emitted).toEqual(['Sessions']);
    expect(result.stop_reason).toBe('count_reached');
    expect(result.events[0]).toMatchObject({
      kind: 'event',
      sequence: 1,
      message_type: 'Sessions',
      data: [],
    });
    expect(socket.closeCalls[0]?.code).toBe(1000);
  });

  it('supports control records, binary messages, duration, close, abort, and errors', async () => {
    const controlSocket = new FakeSocket();
    const controlPromise = watchJellyfinEvents({
      ...baseOptions,
      includeControl: true,
    }, { createSocket: () => controlSocket });
    controlSocket.open();
    controlSocket.message(new TextEncoder().encode('{"MessageType":"KeepAlive"}'));
    expect((await controlPromise).events[0]?.message_type).toBe('KeepAlive');

    const durationSocket = new FakeSocket();
    const duration = await watchJellyfinEvents({
      ...baseOptions,
      durationMs: 1,
    }, { createSocket: () => durationSocket });
    expect(duration.stop_reason).toBe('duration_reached');

    const closeSocket = new FakeSocket();
    const closePromise = watchJellyfinEvents(baseOptions, { createSocket: () => closeSocket });
    closeSocket.close();
    expect((await closePromise).stop_reason).toBe('socket_closed');

    const controller = new AbortController();
    const abortSocket = new FakeSocket();
    const abortPromise = watchJellyfinEvents({
      ...baseOptions,
      signal: controller.signal,
    }, { createSocket: () => abortSocket });
    controller.abort();
    expect((await abortPromise).stop_reason).toBe('aborted');
    expect(abortSocket.closeCalls[0]?.code).toBe(1000);

    const errorSocket = new FakeSocket();
    const errorPromise = watchJellyfinEvents(baseOptions, { createSocket: () => errorSocket });
    errorSocket.error();
    await expect(errorPromise).rejects.toThrow('connection failed');
  });

  it('rejects connection timeouts and unsupported message encodings without leaking the URL', async () => {
    const timeoutSocket = new FakeSocket();
    await expect(watchJellyfinEvents({
      ...baseOptions,
      connectTimeoutMs: 1,
    }, { createSocket: () => timeoutSocket })).rejects.toThrow(
      'Timed out connecting to Jellyfin WebSocket',
    );
    expect(timeoutSocket.closeCalls[0]?.code).toBe(1011);

    const encodingSocket = new FakeSocket();
    const encodingPromise = watchJellyfinEvents(baseOptions, {
      createSocket: () => encodingSocket,
    });
    encodingSocket.open();
    encodingSocket.message({ unsupported: true });
    await expect(encodingPromise).rejects.toThrow('unsupported message encoding');

    class RejectingBlob extends Blob {
      override text(): Promise<string> {
        return Promise.reject('synthetic non-error rejection');
      }
    }
    const rejectionSocket = new FakeSocket();
    const rejectionPromise = watchJellyfinEvents(baseOptions, {
      createSocket: () => rejectionSocket,
    });
    rejectionSocket.open();
    rejectionSocket.message(new RejectingBlob());
    await expect(rejectionPromise).rejects.toThrow('Failed to process WebSocket message');
  });

  it('preserves receive order across asynchronously decoded frames', async () => {
    class DelayedBlob extends Blob {
      override async text(): Promise<string> {
        await new Promise((resolve) => setTimeout(resolve, 5));
        return super.text();
      }
    }
    const socket = new FakeSocket();
    const resultPromise = watchJellyfinEvents({
      ...baseOptions,
      count: 2,
    }, { createSocket: () => socket });
    socket.open();
    socket.message(new DelayedBlob(['{"MessageType":"LibraryChanged"}']));
    socket.message('{"MessageType":"Sessions"}');

    expect((await resultPromise).events.map((event) => event.message_type)).toEqual([
      'LibraryChanged',
      'Sessions',
    ]);
  });

  it('uses the native WebSocket constructor when no transport adapter is supplied', async () => {
    const originalWebSocket = globalThis.WebSocket;
    const socket = new FakeSocket();
    let constructedUrl = '';
    const constructor = function (this: unknown, url: string): FakeSocket {
      constructedUrl = url;
      return socket;
    } as unknown as typeof WebSocket;
    Object.defineProperty(globalThis, 'WebSocket', {
      value: constructor,
      configurable: true,
      writable: true,
    });

    try {
      const resultPromise = watchJellyfinEvents(baseOptions);
      socket.open();
      socket.message('{"MessageType":"LibraryChanged","Data":{}}');
      expect((await resultPromise).stop_reason).toBe('count_reached');
      expect(constructedUrl).toContain('/jellyfin/socket?ApiKey=');
    } finally {
      Object.defineProperty(globalThis, 'WebSocket', {
        value: originalWebSocket,
        configurable: true,
        writable: true,
      });
    }
  });

  it('redacts credential-bearing WebSocket constructor failures', async () => {
    try {
      await watchJellyfinEvents(baseOptions, {
        createSocket: (url) => {
          throw new Error(`Cannot connect to ${url}`);
        },
      });
      throw new Error('Expected WebSocket construction to fail');
    } catch (error) {
      expect(String(error)).toContain('Failed to create Jellyfin WebSocket connection');
      expect(String(error)).not.toContain('secret');
    }
  });
});
