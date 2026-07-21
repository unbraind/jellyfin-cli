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

/**
 * Produces the validated is output format result used by CLI automation.
 * @param value - The value value required by this operation.
 * @returns - Whether the inspected value satisfies the documented condition.
 */
export function isOutputFormat(value: string): value is OutputFormat {
  return OUTPUT_FORMAT_SET.has(value);
}

/**
 * Produces the validated parse output format result used by CLI automation.
 * @param value - The value value required by this operation.
 * @param fallback - The fallback value required by this operation.
 * @returns - The normalized string representation.
 */
export function parseOutputFormat(value: string | undefined, fallback: OutputFormat = 'toon'): OutputFormat {
  if (!value) {
    return fallback;
  }

  return isOutputFormat(value) ? value : fallback;
}

/**
 * Implements output format choices for the typed Jellyfin CLI runtime.
 * @returns - The normalized string representation.
 */
export function outputFormatChoices(): string {
  return OUTPUT_FORMATS.join(', ');
}
