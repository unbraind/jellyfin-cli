import type { OutputFormat } from '../types/index.js';

export const OUTPUT_FORMATS = [
  'toon',
  'json',
  'table',
  'raw',
  'yaml',
  'markdown',
] as const;

export const OUTPUT_FORMAT_SET: ReadonlySet<string> = new Set(OUTPUT_FORMATS);

export function isOutputFormat(value: string): value is OutputFormat {
  return OUTPUT_FORMAT_SET.has(value);
}

export function parseOutputFormat(value: string | undefined, fallback: OutputFormat = 'toon'): OutputFormat {
  if (!value) {
    return fallback;
  }

  return isOutputFormat(value) ? value : fallback;
}

export function outputFormatChoices(): string {
  return OUTPUT_FORMATS.join(', ');
}
