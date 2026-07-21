/**
 * Defines the jellyfin config contract used across typed Jellyfin boundaries.
 */
export interface JellyfinConfig {
  serverUrl: string;
  apiKey?: string;
  username?: string;
  password?: string;
  userId?: string;
  timeout?: number;
  outputFormat?: OutputFormat;
}

/**
 * Represents the output format values accepted by the typed Jellyfin interface.
 */
export type OutputFormat = 'toon' | 'json' | 'table' | 'raw' | 'yaml' | 'markdown';
