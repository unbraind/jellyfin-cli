import type { OutputFormat } from '../types/index.js';
import * as toon from './toon.js';
import { stringify } from 'yaml';

export { toon };

/**
 * Produces the validated format output result used by CLI automation.
 * @param data - The typed payload to format or submit.
 * @param format - The requested machine-readable or human-readable output format.
 * @param typeHint - The type hint value required by this operation.
 * @returns - The normalized string representation.
 */
export function formatOutput(data: unknown, format: OutputFormat, typeHint?: string): string {
  switch (format) {
    case 'json':
      return JSON.stringify(data, null, 2);
    case 'raw':
      if (typeof data === 'string') {
        return data;
      }
      return JSON.stringify(data);
    case 'table':
      return formatTable(data);
    case 'yaml':
      return stringify(data).trim();
    case 'markdown':
      return formatMarkdown(data);
    case 'toon':
    default:
      return toon.formatToon(data, typeHint);
  }
}

function formatMarkdown(data: unknown): string {
  if (Array.isArray(data)) {
    if (data.length === 0) return 'No items.';
    if (typeof data[0] === 'object' && data[0] !== null) {
      return formatMarkdownTable(data);
    }
    return data.map((item) => `- ${String(item)}`).join('\n');
  }
  
  if (typeof data === 'object' && data !== null) {
    const obj = data as Record<string, unknown>;
    if ('Items' in obj && Array.isArray(obj.Items)) {
      return formatMarkdownTable(obj.Items);
    }
    return Object.entries(obj)
      .map(([key, value]) => `**${key}**: ${formatValue(value)}`)
      .join('\n\n');
  }
  
  return String(data);
}

function formatMarkdownTable(items: unknown[]): string {
  if (items.length === 0) return 'No items.';
  const first = items[0] as Record<string, unknown>;
  const keys = Object.keys(first).slice(0, 5);
  
  const rows = items.map((item) => {
    const obj = item as Record<string, unknown>;
    return keys.map((k) =>
      String(formatValue(obj[k]))
        .replace(/[\\|]/g, '\\$&')
        .replace(/\r?\n/g, '<br>'),
    );
  });
  
  const header = `| ${keys.join(' | ')} |`;
  const separator = `| ${keys.map(() => '---').join(' | ')} |`;
  const body = rows.map(row => `| ${row.join(' | ')} |`).join('\n');
  
  return `${header}\n${separator}\n${body}`;
}

function formatTable(data: unknown): string {
  let tableData: unknown[];
  
  if (Array.isArray(data)) {
    tableData = data;
  } else if (typeof data === 'object' && data !== null) {
    const obj = data as Record<string, unknown>;
    if ('Items' in obj && Array.isArray(obj.Items)) {
      tableData = obj.Items;
    } else {
      return Object.entries(obj)
        .map(([key, value]) => `${key}: ${formatValue(value)}`)
        .join('\n');
    }
  } else {
    return String(data);
  }

  if (tableData.length === 0) {
    return 'No items';
  }

  const items = tableData;
  if (typeof items[0] !== 'object' || items[0] === null) {
    return items.map((item) => String(item)).join('\n');
  }

  const first = items[0] as Record<string, unknown>;
  const keys = Object.keys(first).slice(0, 5);
  
  const rows: string[][] = [keys];
  
  for (const item of items) {
    if (typeof item === 'object' && item !== null) {
      const obj = item as Record<string, unknown>;
      rows.push(keys.map((k) => formatValue(obj[k])));
    }
  }

  const colWidths: number[] = keys.map((_, i) => Math.max(1, ...rows.map((row) => String(row[i] ?? '').length)));
  
  const lines = rows.map((row, idx) => {
    const cells = row.map((cell, i) => String(cell ?? '').padEnd(colWidths[i] ?? 0));
    const line = cells.join(' | ');
    return idx === 0 ? `${line}\n${colWidths.map((w) => '-'.repeat(w ?? 1)).join('-+-')}` : line;
  });

  return lines.join('\n');
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  if (Array.isArray(value)) {
    return value.slice(0, 3).map(formatValue).join(', ') + (value.length > 3 ? '...' : '');
  }
  if (typeof value === 'object') {
    return '[Object]';
  }
  return String(value);
}

/**
 * Produces the validated format success result used by CLI automation.
 * @param message - The message value required by this operation.
 * @param format - The requested machine-readable or human-readable output format.
 * @returns - The normalized string representation.
 */
export function formatSuccess(message: string, format: OutputFormat): string {
  if (format === 'json') {
    return JSON.stringify({ success: true, message });
  }
  if (format === 'raw') {
    return message;
  }
  return toon.formatMessage(message, true);
}

/**
 * Produces the validated format error result used by CLI automation.
 * @param error - The error value to normalize for structured output.
 * @param format - The requested machine-readable or human-readable output format.
 * @param code - The code value required by this operation.
 * @param details - Optional structured diagnostic details.
 * @returns - The normalized string representation.
 */
export function formatError(error: string, format: OutputFormat, code?: number, details?: unknown): string {
  if (format === 'json') {
    return JSON.stringify({ success: false, error, code, details });
  }
  if (format === 'raw') {
    return `Error: ${error}`;
  }
  return toon.formatError(error, code, details);
}
