import type { JellyfinConfig } from '../types/index.js';
import { buildQueryString, JellyfinApiError } from './types.js';
import {
  buildExplainRequestPayload,
  emitExplainRequest,
  isExplainModeEnabled,
} from '../utils/explain.js';

export class ApiClientBase {
  protected baseUrl: string;
  protected apiKey?: string;
  protected userId?: string;
  protected timeout: number;

  constructor(config: JellyfinConfig) {
    this.baseUrl = config.serverUrl.replace(/\/$/, '');
    this.apiKey = config.apiKey;
    this.userId = config.userId;
    this.timeout = config.timeout ?? 30000;
  }

  setUserId(userId: string): void {
    this.userId = userId;
  }

  getUserId(): string | undefined {
    return this.userId;
  }

  getBackendUrl(): string {
    return this.baseUrl;
  }

  protected async request<T>(
    method: string,
    path: string,
    params?: Record<string, unknown>,
    body?: unknown
  ): Promise<T> {
    if (isExplainModeEnabled(undefined, process.env.JELLYFIN_EXPLAIN)) {
      emitExplainRequest(
        buildExplainRequestPayload({
          method,
          path,
          params,
          body,
          timeoutMs: this.timeout,
        }),
      );
    }

    const url = `${this.baseUrl}${path}${params ? buildQueryString(params) : ''}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (this.apiKey) {
      headers['X-Emby-Token'] = this.apiKey;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
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
