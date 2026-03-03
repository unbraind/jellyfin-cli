const SENSITIVE_KEY_PATTERN = /(api[_-]?key|token|password|secret|authorization|cookie|pin|pw)/i;
const MAX_STRING_LENGTH = 120;
const MAX_DEPTH = 4;
const MAX_KEYS = 30;
const MAX_ARRAY_ITEMS = 20;

export const EXPLAIN_ENV_KEY = 'JELLYFIN_EXPLAIN';

export type ExplainRequestPayload = {
  type: 'request_explain';
  data: {
    method: string;
    path: string;
    query?: unknown;
    body?: unknown;
    read_only_safe: boolean;
    timeout_ms: number;
  };
};

export function isExplainModeEnabled(
  explainOption: unknown,
  explainEnvValue = process.env[EXPLAIN_ENV_KEY],
): boolean {
  if (typeof explainOption === 'boolean') {
    return explainOption;
  }
  if (typeof explainOption === 'string') {
    const normalized = explainOption.trim().toLowerCase();
    return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on';
  }

  if (!explainEnvValue) {
    return false;
  }
  const normalized = explainEnvValue.trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on';
}

function truncateString(value: string): string {
  if (value.length <= MAX_STRING_LENGTH) {
    return value;
  }
  return `${value.slice(0, MAX_STRING_LENGTH)}...`;
}

function redactValue(value: unknown, keyHint?: string, depth = 0): unknown {
  if (keyHint && SENSITIVE_KEY_PATTERN.test(keyHint)) {
    return '[REDACTED]';
  }
  if (value == null) {
    return value;
  }
  if (typeof value === 'string') {
    return truncateString(value);
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  if (depth >= MAX_DEPTH) {
    return '[TRUNCATED]';
  }
  if (Array.isArray(value)) {
    return value.slice(0, MAX_ARRAY_ITEMS).map((entry) => redactValue(entry, undefined, depth + 1));
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).slice(0, MAX_KEYS);
    const out: Record<string, unknown> = {};
    for (const [key, entry] of entries) {
      out[key] = redactValue(entry, key, depth + 1);
    }
    return out;
  }
  return String(value);
}

function isReadOnlyMethod(method: string): boolean {
  const upper = method.toUpperCase();
  return upper === 'GET' || upper === 'HEAD' || upper === 'OPTIONS';
}

export function buildExplainRequestPayload(input: {
  method: string;
  path: string;
  params?: Record<string, unknown>;
  body?: unknown;
  timeoutMs: number;
}): ExplainRequestPayload {
  return {
    type: 'request_explain',
    data: {
      method: input.method.toUpperCase(),
      path: input.path,
      query: input.params ? redactValue(input.params) : undefined,
      body: input.body === undefined ? undefined : redactValue(input.body),
      read_only_safe: isReadOnlyMethod(input.method),
      timeout_ms: input.timeoutMs,
    },
  };
}

export function emitExplainRequest(payload: ExplainRequestPayload): void {
  process.stderr.write(`${JSON.stringify(payload)}\n`);
}
