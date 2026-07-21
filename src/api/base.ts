import type { JellyfinConfig } from '../types/index.js';
import packageJson from '../../package.json' with { type: 'json' };
import { buildQueryString, JellyfinApiError } from './types.js';
import {
  buildExplainRequestPayload,
  emitExplainRequest,
  isExplainModeEnabled,
} from '../utils/explain.js';

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
      Authorization: this.clientAuthorization,
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
