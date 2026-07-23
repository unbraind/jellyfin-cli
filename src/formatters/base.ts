import { encode } from '@toon-format/toon';

/**
 * Defines the toon output contract used across typed Jellyfin boundaries.
 */
export interface ToonOutput {
  type: string;
  data: unknown;
}

/**
 * Performs the create toon output operation through the typed Jellyfin API boundary.
 * @param type - The type value required by this operation.
 * @param data - The typed payload to format or submit.
 * @returns - The normalized string representation.
 */
export function createToonOutput(type: string, data: unknown): ToonOutput {
  return { type, data: compact(data) };
}

function compact(obj: unknown): unknown {
  if (obj === undefined) return undefined;
  if (obj === null) return null;
  if (Array.isArray(obj)) {
    return obj.map(compact).filter((value) => value !== undefined);
  }
  if (typeof obj === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      const cleaned = compact(v);
      if (cleaned !== undefined) {
        out[k] = cleaned;
      }
    }
    return out;
  }
  return obj;
}

/**
 * Produces the validated format toon result used by CLI automation.
 * @param output - The output value required by this operation.
 * @param typeHint - The type hint value required by this operation.
 * @returns - The normalized string representation.
 */
export function formatToon(output: unknown, typeHint?: string): string {
  const type = typeHint ?? detectType(output);
  const toonOutput = createToonOutput(type, output);
  return encode(toonOutput);
}

/**
 * Produces the validated detect type result used by CLI automation.
 * @param output - The output value required by this operation.
 * @returns - The normalized string representation.
 */
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
      if ('ItemId' in first && 'CollectionType' in first) return 'libraries';
      if ('Id' in first || 'id' in first) return 'items';
    }
    return 'list';
  }
  if (typeof output === 'object') {
    const obj = output as Record<string, unknown>;
    if ('ServerName' in obj || 'Version' in obj) return 'system_info';
    if ('Items' in obj) return 'items';
    if ('SearchHints' in obj) return 'search';
    if ('PlayState' in obj) return 'session';
    if ('message' in obj && 'success' in obj) return obj.success ? 'message' : 'error';
    if ('error' in obj) return 'error';
    if ('Id' in obj || 'id' in obj) return 'item';
    return 'obj';
  }
  return 'unknown';
}

/**
 * Produces the validated format message result used by CLI automation.
 * @param message - The message value required by this operation.
 * @param success - The success value required by this operation.
 * @returns - The normalized string representation.
 */
export function formatMessage(message: string, success = true): string {
  if (success) {
    return formatToon({ message, success: true }, 'message');
  }
  return formatToon({ error: message, success: false }, 'error');
}

/**
 * Produces the validated format error result used by CLI automation.
 * @param error - The error value to normalize for structured output.
 * @param code - The code value required by this operation.
 * @param details - Optional structured diagnostic details.
 * @returns - The normalized string representation.
 */
export function formatError(error: string, code?: number, details?: unknown): string {
  const data: Record<string, unknown> = { error, success: false };
  if (code) data.code = code;
  if (details !== undefined) data.details = details;
  return formatToon(data, 'error');
}
