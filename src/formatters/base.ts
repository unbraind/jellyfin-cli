import YAML from 'yaml';

export interface ToonOutput {
  type: string;
  data: unknown;
}

const VERSION = '1.0.0';

export function createToonOutput(type: string, data: unknown): ToonOutput {
  return { type, data: stripNulls(data) };
}

function stripNulls(obj: unknown): unknown {
  if (obj === null || obj === undefined) return undefined;
  if (Array.isArray(obj)) {
    const filtered = obj.map(stripNulls).filter(v => v !== undefined);
    return filtered.length > 0 ? filtered : undefined;
  }
  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      const cleaned = stripNulls(v);
      if (cleaned !== undefined && cleaned !== '' && !(Array.isArray(cleaned) && cleaned.length === 0)) {
        result[k] = cleaned;
      }
    }
    return Object.keys(result).length > 0 ? result : undefined;
  }
  return obj;
}

export function formatToon(output: unknown, typeHint?: string): string {
  const type = typeHint ?? detectType(output);
  const toonOutput = createToonOutput(type, output);
  return YAML.stringify(toonOutput, { 
    lineWidth: 0,
    defaultStringType: 'PLAIN',
    defaultKeyType: 'PLAIN',
    singleQuote: false,
    doubleQuote: { json: false },
  });
}

function detectType(output: unknown): string {
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
  if (details !== undefined) data.details = details;
  return formatToon(data, 'err');
}

export { VERSION };
