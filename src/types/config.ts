export interface JellyfinConfig {
  serverUrl: string;
  apiKey?: string;
  username?: string;
  password?: string;
  userId?: string;
  timeout?: number;
  outputFormat?: OutputFormat;
}

export type OutputFormat = 'toon' | 'json' | 'table' | 'raw';
