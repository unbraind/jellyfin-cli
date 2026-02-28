import type { OutputFormat } from '../types/index.js';
import * as toon from './toon.js';

export { toon };

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
    case 'toon':
    default:
      return toon.formatToon(data, typeHint);
  }
}

function formatTable(data: unknown): string {
  let tableData: unknown[] = [];
  
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

  const colWidths = keys.map((_, i) => Math.max(...rows.map((row) => String(row[i] ?? '').length)));
  
  const lines = rows.map((row, idx) => {
    const cells = row.map((cell, i) => String(cell ?? '').padEnd(colWidths[i]!));
    const line = cells.join(' | ');
    return idx === 0 ? `${line}\n${colWidths.map((w) => '-'.repeat(w)).join('-+-')}` : line;
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

export function formatSuccess(message: string, format: OutputFormat): string {
  if (format === 'json') {
    return JSON.stringify({ success: true, message });
  }
  if (format === 'raw') {
    return message;
  }
  return toon.formatMessage(message, true);
}

export function formatError(error: string, format: OutputFormat, code?: number, details?: unknown): string {
  if (format === 'json') {
    return JSON.stringify({ success: false, error, code, details });
  }
  if (format === 'raw') {
    return `Error: ${error}`;
  }
  return toon.formatError(error, code, details);
}
