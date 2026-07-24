import type { JellyfinConfig } from '../types/index.js';
import packageJson from '../../package.json' with { type: 'json' };
import { buildQueryString, JellyfinApiError } from './types.js';
import {
  buildExplainRequestPayload,
  emitExplainRequest,
  isExplainModeEnabled,
} from '../utils/explain.js';

/** Structured response returned by exact OpenAPI operation execution. */
export type ApiOperationResponse = {
  status: number;
  contentType: string | null;
  encoding: 'json' | 'text' | 'base64' | 'empty';
  data: unknown;
};

/**
 * Provides api client base behavior for the Jellyfin client and command runtime.
 */
export class ApiClientBase {
  protected baseUrl: string;
  protected apiKey?: string;
  protected userId?: string;
  protected timeout: number;

  private readonly clientAuthorization = [
    'MediaBrowser Client="jellyfin-cli"',
    'Device="CLI"',
    'DeviceId="jellyfin-cli"',
    `Version="${packageJson.version}"`,
  ].join(', ');

  /**
   * Creates an instance with the collaborators required by its runtime behavior.
   * @param config - The resolved Jellyfin client configuration.
   */
  constructor(config: JellyfinConfig) {
    this.baseUrl = config.serverUrl.replace(/\/$/, '');
    this.apiKey = config.apiKey;
    this.userId = config.userId;
    this.timeout = config.timeout ?? 30000;
  }

  /**
   * Performs the set user id operation through the typed Jellyfin API boundary.
   * @param userId - The stable Jellyfin user identifier.
   */
  setUserId(userId: string): void {
    this.userId = userId;
  }

  /**
   * Retrieves or derives user id without mutating Jellyfin state.
   * @returns - The normalized string representation.
   */
  getUserId(): string | undefined {
    return this.userId;
  }

  /**
   * Retrieves or derives backend url without mutating Jellyfin state.
   * @returns - The normalized string representation.
   */
  getBackendUrl(): string {
    return this.baseUrl;
  }

  protected async request<T>(
    method: string,
    path: string,
    params?: Record<string, unknown>,
    body?: unknown
  ): Promise<T> {
    const response = await this.fetchResponse(method, path, params, body);
    if (response.status === 204) {
      return undefined as T;
    }

    const contentType = response.headers?.get?.('content-type');
    if (contentType?.includes('application/json')) {
      return response.json() as Promise<T>;
    }

    const text = await response.text();
    if (!text) {
      return undefined as T;
    }
    try {
      return JSON.parse(text) as T;
    } catch {
      return text as T;
    }
  }

  /**
   * Executes a validated same-origin OpenAPI operation and preserves its response encoding.
   * @param method - HTTP method resolved from the configured server's OpenAPI document.
   * @param path - Relative Jellyfin API path with all template parameters materialized.
   * @param params - Validated OpenAPI query parameters.
   * @param body - Optional JSON request body declared by the operation.
   * @param bodyContentType - OpenAPI-declared media type for the serialized request body.
   * @param maxResponseBytes - Maximum buffered response size accepted by the CLI.
   * @returns A structured status, content type, encoding, and response payload envelope.
   */
  async executeOperation(
    method: string,
    path: string,
    params: Record<string, unknown>,
    body: unknown,
    bodyContentType: string | undefined,
    maxResponseBytes: number,
  ): Promise<ApiOperationResponse> {
    const response = await this.fetchResponse(
      method,
      path,
      params,
      body,
      bodyContentType,
      true,
    );
    const contentType = response.headers.get('content-type');
    const declaredLength = Number(response.headers.get('content-length'));
    if (Number.isFinite(declaredLength) && declaredLength > maxResponseBytes) {
      throw new JellyfinApiError(
        `API response exceeds --max-bytes (${declaredLength} > ${maxResponseBytes})`,
        response.status,
      );
    }
    if (method === 'HEAD' || response.status === 204) {
      return { status: response.status, contentType, encoding: 'empty', data: null };
    }

    const chunks: Uint8Array[] = [];
    let byteLength = 0;
    const reader = response.body?.getReader();
    if (reader) {
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) {
          break;
        }
        byteLength += chunk.value.byteLength;
        if (byteLength > maxResponseBytes) {
          await reader.cancel();
          throw new JellyfinApiError(
            `API response exceeds --max-bytes (${byteLength} > ${maxResponseBytes})`,
            response.status,
          );
        }
        chunks.push(chunk.value);
      }
    }
    if (byteLength === 0) {
      return { status: response.status, contentType, encoding: 'empty', data: null };
    }
    const bytes = new Uint8Array(byteLength);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }

    const text = new TextDecoder().decode(bytes);
    if (contentType?.includes('json')) {
      try {
        return {
          status: response.status,
          contentType,
          encoding: 'json',
          data: JSON.parse(text) as unknown,
        };
      } catch {
        throw new JellyfinApiError('API returned invalid JSON', response.status, text);
      }
    }
    if (
      contentType?.startsWith('text/') ||
      contentType?.includes('xml') ||
      contentType?.includes('mpegurl')
    ) {
      return { status: response.status, contentType, encoding: 'text', data: text };
    }
    return {
      status: response.status,
      contentType,
      encoding: 'base64',
      data: Buffer.from(bytes).toString('base64'),
    };
  }

  private async fetchResponse(
    method: string,
    path: string,
    params?: Record<string, unknown>,
    body?: unknown,
    contentType: string | undefined = 'application/json',
    rawBody = false,
  ): Promise<Response> {
    if (isExplainModeEnabled(undefined, process.env.JELLYFIN_EXPLAIN)) {
      const encodedBody = rawBody && body !== undefined
        ? body instanceof Uint8Array
          ? body.byteLength
          : Buffer.byteLength(typeof body === 'string' ? body : JSON.stringify(body))
        : undefined;
      emitExplainRequest(
        buildExplainRequestPayload({
          method,
          path,
          params,
          body: encodedBody === undefined
            ? body
            : { content_type: contentType, byte_length: encodedBody },
          timeoutMs: this.timeout,
        }),
      );
    }

    const url = `${this.baseUrl}${path}${params ? buildQueryString(params) : ''}`;
    
    const headers: Record<string, string> = {
      Authorization: this.clientAuthorization,
    };
    if (contentType) {
      headers['Content-Type'] = contentType;
    }
    
    if (this.apiKey) {
      headers['X-Emby-Token'] = this.apiKey;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body === undefined
          ? undefined
          : rawBody
            ? body as RequestInit['body']
            : JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorDetails: unknown;
        try {
          const text = await response.text();
          try {
            errorDetails = JSON.parse(text);
          } catch {
            errorDetails = text || response.statusText;
          }
        } catch {
          errorDetails = response.statusText;
        }
        throw new JellyfinApiError(
          `API request failed: ${response.status} ${response.statusText}`,
          response.status,
          errorDetails
        );
      }
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof JellyfinApiError) {
        throw error;
      }
      if (error instanceof Error) {
        throw new JellyfinApiError(error.message, undefined, error);
      }
      throw new JellyfinApiError('Unknown error occurred');
    }
  }
}
