import { Command } from 'commander';
import { formatOutput } from '../formatters/index.js';
import { isOutputFormat, parseOutputFormat } from '../utils/output-format.js';
import type { OutputFormat } from '../types/index.js';

export type FormatOptions = {
  format?: string | undefined;
};

function resolveFormatCandidate(command: Command, options: FormatOptions): string {
  const localSource = command.getOptionValueSource('format');
  if (localSource && localSource !== 'default' && typeof options.format === 'string') {
    return options.format;
  }

  let parent: Command | null = command.parent;
  while (parent) {
    const parentValue = parent.opts().format;
    const parentSource = parent.getOptionValueSource('format');
    if (parentSource && parentSource !== 'default' && typeof parentValue === 'string') {
      return parentValue;
    }
    parent = parent.parent;
  }

  if (typeof options.format === 'string') {
    return options.format;
  }

  return 'toon';
}

export function resolveOutputFormat(command: Command, options: FormatOptions): OutputFormat {
  const candidate = resolveFormatCandidate(command, options);
  if (!isOutputFormat(candidate)) {
    console.error(formatOutput({ error: `Invalid format: ${candidate}` }, 'toon', 'error'));
    process.exit(1);
  }
  return parseOutputFormat(candidate, 'toon');
}

export function parsePositiveInteger(value: string, label: string, outputFormat: OutputFormat): number {
  const parsed = parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    console.error(formatOutput({ error: `${label} must be a positive integer` }, outputFormat, 'error'));
    process.exit(1);
  }
  return parsed;
}

export function parseCoveragePercent(value: string, outputFormat: OutputFormat): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
    console.error(
      formatOutput({ error: 'Coverage requirement must be a number between 0 and 100' }, outputFormat, 'error'),
    );
    process.exit(1);
  }
  return Number(parsed.toFixed(2));
}
