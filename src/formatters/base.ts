import YAML from 'yaml';

export interface ToonOutput {
  type: string;
  data: unknown;
  meta?: {
    timestamp: string;
    format: 'toon';
    version: string;
  };
}

const VERSION = '1.0.0';

export function createToonOutput(type: string, data: unknown): ToonOutput {
  return {
    type,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      format: 'toon',
      version: VERSION,
    },
  };
}

export function formatToon(output: unknown, typeHint?: string): string {
  const type = typeHint ?? detectType(output);
  const toonOutput = createToonOutput(type, output);
  return YAML.stringify(toonOutput, { lineWidth: 0 });
}

function detectType(output: unknown): string {
  if (output === null || output === undefined) {
    return 'empty';
  }
  if (typeof output === 'string') {
    return 'message';
  }
  if (typeof output === 'number' || typeof output === 'boolean') {
    return 'value';
  }
  if (Array.isArray(output)) {
    if (output.length === 0) {
      return 'list';
    }
    const first = output[0];
    if (first && typeof first === 'object') {
      if ('Type' in first || 'type' in first) {
        return 'items';
      }
      if ('Name' in first && 'Id' in first) {
        if ('SessionId' in first || 'PlayState' in first) {
          return 'sessions';
        }
        if ('IsAdministrator' in first) {
          return 'users';
        }
        return 'items';
      }
    }
    return 'list';
  }
  if (typeof output === 'object') {
    const obj = output as Record<string, unknown>;
    if ('ServerName' in obj && 'Version' in obj) {
      return 'system_info';
    }
    if ('Items' in obj && 'TotalRecordCount' in obj) {
      return 'query_result';
    }
    if ('SearchHints' in obj) {
      return 'search_result';
    }
    if ('PlayState' in obj) {
      return 'session';
    }
    if ('Name' in obj && 'Id' in obj) {
      if ('CollectionType' in obj) {
        return 'library';
      }
      if ('Policy' in obj) {
        return 'user';
      }
      if ('RunTimeTicks' in obj || 'MediaType' in obj) {
        return 'item';
      }
    }
    if ('Id' in obj && 'Name' in obj) {
      return 'item';
    }
    return 'object';
  }
  return 'unknown';
}

export function formatMessage(message: string, success = true): string {
  return formatToon({ message, success }, 'message');
}

export function formatError(error: string, code?: number, details?: unknown): string {
  return formatToon({ error, code, details, success: false }, 'error');
}
