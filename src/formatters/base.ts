import YAML from 'yaml';

export interface ToonOutput {
  type: string;
  data: unknown;
}

export function createToonOutput(type: string, data: unknown): ToonOutput {
  return { type, data: compact(data) };
}

function compact(obj: unknown): unknown {
  if (obj === null || obj === undefined) return undefined;
  if (Array.isArray(obj)) {
    const arr = obj.map(compact).filter(v => v !== undefined);
    return arr.length > 0 ? arr : undefined;
  }
  if (typeof obj === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      const cleaned = compact(v);
      if (cleaned !== undefined && cleaned !== '' && !(Array.isArray(cleaned) && cleaned.length === 0)) {
        out[k] = cleaned;
      }
    }
    return Object.keys(out).length > 0 ? out : undefined;
  }
  return obj;
}

export function formatToon(output: unknown, typeHint?: string): string {
  const type = typeHint ?? detectType(output);
  const toonOutput = createToonOutput(type, output);
  return YAML.stringify(toonOutput, { 
    indent: 1,
    indentSeq: false,
    lineWidth: -1,
    minContentWidth: 0,
    defaultStringType: 'PLAIN',
    defaultKeyType: 'PLAIN',
    singleQuote: false,
  }).trim();
}

export function detectType(output: unknown): string {
  if (output === null || output === undefined) return 'empty';
  if (typeof output === 'string') return 'msg';
  if (typeof output === 'number' || typeof output === 'boolean') return 'val';
  if (Array.isArray(output)) {
    if (output.length === 0) return 'list';
    const first = output[0];
    if (first && typeof first === 'object') {
      if ('SessionId' in first || 'PlayState' in first) return 'sessions';
      if ('IsAdministrator' in first) return 'users';
      if ('ItemId' in first && 'CollectionType' in first) return 'libs';
      if ('Id' in first || 'id' in first) return 'items';
    }
    return 'list';
  }
  if (typeof output === 'object') {
    const obj = output as Record<string, unknown>;
    if ('ServerName' in obj || 'Version' in obj) return 'sys';
    if ('Items' in obj) return 'items';
    if ('SearchHints' in obj) return 'search';
    if ('PlayState' in obj) return 'session';
    if ('message' in obj && 'success' in obj) return obj.success ? 'ok' : 'err';
    if ('error' in obj) return 'err';
    if ('Id' in obj || 'id' in obj) return 'item';
    return 'obj';
  }
  return 'unknown';
}

export function formatMessage(message: string, success = true): string {
  if (success) {
    return formatToon({ msg: message }, 'ok');
  }
  return formatToon({ err: message }, 'err');
}

export function formatError(error: string, code?: number, details?: unknown): string {
  const data: Record<string, unknown> = { err: error };
  if (code) data.code = code;
  if (details !== undefined) data.ctx = details;
  return formatToon(data, 'err');
}
