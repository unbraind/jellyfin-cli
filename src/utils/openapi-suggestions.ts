import type { OpenApiOperationEntry } from './openapi.js';

type SuggestionIntent = 'list' | 'get' | 'search' | 'latest' | 'info' | 'status' | 'create' | 'update' | 'delete';

export type OpenApiCommandSuggestion = {
  suggestedCommand: string;
  intent: SuggestionIntent;
  confidence: 'high' | 'medium' | 'low';
  rationale: string[];
};

const SKIP_PATH_TOKENS = new Set([
  'api',
  'emby',
  'jellyfin',
  'system',
  'users',
  'items',
]);

const PREFERRED_INTENT_TOKENS: ReadonlyArray<{ token: string; intent: SuggestionIntent }> = [
  { token: 'latest', intent: 'latest' },
  { token: 'search', intent: 'search' },
  { token: 'query', intent: 'search' },
  { token: 'recommend', intent: 'search' },
  { token: 'status', intent: 'status' },
  { token: 'health', intent: 'status' },
  { token: 'info', intent: 'info' },
  { token: 'metadata', intent: 'info' },
] as const;

function normalizeToken(token: string): string {
  return token
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-');
}

function singularize(token: string): string {
  if (token.endsWith('ies') && token.length > 4) {
    return `${token.slice(0, -3)}y`;
  }
  if (token.endsWith('s') && token.length > 3) {
    return token.slice(0, -1);
  }
  return token;
}

function pathTokens(path: string): string[] {
  return path
    .split('/')
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0 && !segment.startsWith('{') && !segment.endsWith('}'))
    .map(normalizeToken)
    .filter((token) => token.length > 1);
}

function pickDomain(tokens: string[]): string {
  return tokens.find((token) => !SKIP_PATH_TOKENS.has(token)) ?? tokens[0] ?? 'api';
}

function inferIntent(operation: OpenApiOperationEntry, tokens: string[]): SuggestionIntent {
  const signal = [operation.operationId, operation.summary, ...tokens].join(' ').toLowerCase();
  for (const matcher of PREFERRED_INTENT_TOKENS) {
    if (signal.includes(matcher.token)) {
      return matcher.intent;
    }
  }

  const hasPathParameter = operation.path.includes('{');
  if (operation.method === 'GET') {
    return hasPathParameter ? 'get' : 'list';
  }
  if (operation.method === 'POST') {
    return 'create';
  }
  if (operation.method === 'PUT' || operation.method === 'PATCH') {
    return 'update';
  }
  if (operation.method === 'DELETE') {
    return 'delete';
  }

  return 'info';
}

function pickTarget(tokens: string[], domain: string): string | undefined {
  const candidates = tokens.filter((token) => token !== domain && !SKIP_PATH_TOKENS.has(token));
  return candidates.at(-1);
}

export function suggestCommandFromOperation(operation: OpenApiOperationEntry): OpenApiCommandSuggestion {
  const tokens = pathTokens(operation.path);
  const domain = pickDomain(tokens);
  const intent = inferIntent(operation, tokens);
  const target = pickTarget(tokens, domain);

  const base = singularize(domain);
  let suggestedCommand = `${base} ${intent}`;
  if (target && !['list', 'latest', 'status', 'info'].includes(intent)) {
    suggestedCommand = `${suggestedCommand} ${singularize(target)}`;
  }

  const rationale = [`method=${operation.method}`, `path=${operation.path}`, `intent=${intent}`];
  if (!operation.readOnlySafe) {
    rationale.push('mutating_operation=true');
  }

  const confidence: OpenApiCommandSuggestion['confidence'] =
    operation.readOnlySafe && ['list', 'get', 'search', 'latest', 'info', 'status'].includes(intent)
      ? 'high'
      : operation.readOnlySafe
        ? 'medium'
        : 'low';

  return {
    suggestedCommand,
    intent,
    confidence,
    rationale,
  };
}
