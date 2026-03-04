import type { JellyfinConfig } from '../types/index.js';
import { LOW_SIGNAL_TOKENS, isReadOnlyIntent } from './openapi-intent.js';
import { tokenizeIntentValue, tokenizePathValue } from './openapi-tokenize.js';

const HTTP_METHODS = new Set(['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'trace']);
const OPENAPI_CANDIDATES = ['/api-docs/openapi.json', '/openapi.json', '/swagger/v1/swagger.json'] as const;

type OpenApiOperation = {
  tags?: string[] | undefined;
  summary?: string | undefined;
  operationId?: string | undefined;
  deprecated?: boolean | undefined;
};

type OpenApiPathItem = Partial<Record<string, OpenApiOperation>>;

type OpenApiDocument = {
  info?: {
    version?: string | undefined;
    title?: string | undefined;
  } | undefined;
  paths?: Record<string, OpenApiPathItem> | undefined;
};

export type OpenApiStats = {
  available: boolean;
  sourcePath?: string | undefined;
  pathCount?: number | undefined;
  operationCount?: number | undefined;
  topTags?: Array<{ tag: string; operations: number }> | undefined;
  serverVersion?: string | undefined;
  error?: string | undefined;
};

export type OpenApiProbeResult = {
  sourcePath: string;
  document: OpenApiDocument;
};

export type OpenApiFetchOptions = {
  endpointPath?: string | undefined;
};

export type OpenApiOperationEntry = {
  method: string;
  path: string;
  operationId?: string | undefined;
  summary?: string | undefined;
  tags: string[];
  deprecated: boolean;
  readOnlySafe: boolean;
};

export type OpenApiOperationFilter = {
  method?: string | undefined;
  pathPrefix?: string | undefined;
  tag?: string | undefined;
  search?: string | undefined;
  readOnlySafe?: boolean | undefined;
};

export type CommandOperationMatch = OpenApiOperationEntry & {
  score: number;
  matchedOn: string[];
};

function getTimeout(config: JellyfinConfig): number {
  return Math.max(5000, Math.min(60000, config.timeout ?? 30000));
}

function authHeader(config: JellyfinConfig): Record<string, string> | undefined {
  return config.apiKey ? { 'X-Emby-Token': config.apiKey } : undefined;
}

function buildCandidatePaths(endpointPath: string | undefined): string[] {
  const custom = endpointPath?.trim();
  const normalizedCustom = custom ? (custom.startsWith('/') ? custom : `/${custom}`) : undefined;
  const candidates = [normalizedCustom, ...OPENAPI_CANDIDATES];
  const unique: string[] = [];
  const seen = new Set<string>();
  for (const candidate of candidates) {
    if (!candidate || seen.has(candidate)) {
      continue;
    }
    unique.push(candidate);
    seen.add(candidate);
  }
  return unique;
}

export async function fetchOpenApiDocument(
  config: JellyfinConfig,
  options: OpenApiFetchOptions = {},
): Promise<OpenApiProbeResult> {
  if (!config.serverUrl) {
    throw new Error('Missing server URL');
  }

  const probeFailures: string[] = [];
  const candidates = buildCandidatePaths(options.endpointPath);
  for (const path of candidates) {
    try {
      const response = await fetch(`${config.serverUrl}${path}`, {
        headers: authHeader(config),
        signal: AbortSignal.timeout(getTimeout(config)),
      });
      if (!response.ok) {
        probeFailures.push(`${path} => HTTP ${response.status}`);
        continue;
      }

      const document = (await response.json()) as OpenApiDocument;
      if (!document || typeof document !== 'object' || !document.paths || typeof document.paths !== 'object') {
        probeFailures.push(`${path} => Invalid OpenAPI payload`);
        continue;
      }

      return {
        sourcePath: path,
        document,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown OpenAPI probe error';
      probeFailures.push(`${path} => ${message}`);
    }
  }

  const reason = probeFailures.join('; ');
  throw new Error(`OpenAPI schema not reachable. Tried ${candidates.length} path(s): ${reason}`);
}

export const fetchOpenApiDocumentWithOptions = fetchOpenApiDocument;

export function summarizeOpenApi(document: OpenApiDocument): Omit<OpenApiStats, 'available'> {
  const paths = document.paths ?? {};
  const tagCounts = new Map<string, number>();
  let operationCount = 0;

  for (const pathItem of Object.values(paths)) {
    for (const [methodName, operation] of Object.entries(pathItem ?? {})) {
      if (!HTTP_METHODS.has(methodName.toLowerCase())) {
        continue;
      }
      operationCount += 1;

      const tags = operation?.tags ?? [];
      for (const tag of tags) {
        const current = tagCounts.get(tag) ?? 0;
        tagCounts.set(tag, current + 1);
      }
    }
  }

  const topTags = Array.from(tagCounts.entries())
    .map(([tag, operations]) => ({ tag, operations }))
    .sort((a, b) => b.operations - a.operations)
    .slice(0, 10);

  return {
    pathCount: Object.keys(paths).length,
    operationCount,
    topTags: topTags.length > 0 ? topTags : undefined,
    serverVersion: document.info?.version,
  };
}

function isReadOnlyMethod(method: string): boolean {
  return method === 'GET' || method === 'HEAD' || method === 'OPTIONS';
}

export function extractOpenApiOperations(document: OpenApiDocument): OpenApiOperationEntry[] {
  const paths = document.paths ?? {};
  const operations: OpenApiOperationEntry[] = [];

  for (const [path, pathItem] of Object.entries(paths)) {
    for (const [methodName, operation] of Object.entries(pathItem ?? {})) {
      if (!HTTP_METHODS.has(methodName.toLowerCase())) {
        continue;
      }

      const method = methodName.toUpperCase();
      operations.push({
        method,
        path,
        operationId: operation?.operationId,
        summary: operation?.summary,
        tags: operation?.tags ?? [],
        deprecated: operation?.deprecated ?? false,
        readOnlySafe: isReadOnlyMethod(method),
      });
    }
  }

  return operations.sort((a, b) => {
    if (a.path === b.path) {
      return a.method.localeCompare(b.method);
    }
    return a.path.localeCompare(b.path);
  });
}

export function filterOpenApiOperations(
  operations: OpenApiOperationEntry[],
  filters: OpenApiOperationFilter,
): OpenApiOperationEntry[] {
  const method = filters.method?.trim().toUpperCase();
  const pathPrefix = filters.pathPrefix?.trim().toLowerCase();
  const tag = filters.tag?.trim().toLowerCase();
  const search = filters.search?.trim().toLowerCase();
  const readOnlySafe = filters.readOnlySafe;

  return operations.filter((operation) => {
    if (method && operation.method !== method) {
      return false;
    }
    if (pathPrefix && !operation.path.toLowerCase().startsWith(pathPrefix)) {
      return false;
    }
    if (tag && !operation.tags.some((entry) => entry.toLowerCase() === tag)) {
      return false;
    }
    if (search) {
      const haystack = [
        operation.path,
        operation.summary ?? '',
        operation.operationId ?? '',
        operation.tags.join(' '),
      ].join(' ').toLowerCase();
      if (!haystack.includes(search)) {
        return false;
      }
    }
    if (typeof readOnlySafe === 'boolean' && operation.readOnlySafe !== readOnlySafe) {
      return false;
    }
    return true;
  });
}

export function matchOperationsForCommandIntent(
  operations: OpenApiOperationEntry[],
  commandPath: string,
): CommandOperationMatch[] {
  const tokens = tokenizeIntentValue(commandPath);
  if (tokens.length === 0) {
    return [];
  }

  const matches: CommandOperationMatch[] = [];
  const preferReadOnlyMatches = isReadOnlyIntent(tokens);
  const tailSignalTokens = tokens.slice(1).filter((token) => !LOW_SIGNAL_TOKENS.has(token));
  for (const operation of operations) {
    const pathTokens = tokenizePathValue(operation.path);
    const tagTokens = new Set(operation.tags.flatMap((tag) => tokenizeIntentValue(tag)));
    const summaryLower = operation.summary?.toLowerCase() ?? '';
    const operationIdLower = operation.operationId?.toLowerCase() ?? '';
    const matchedTokens = new Set<string>();
    let score = 0;
    const matchedOn: string[] = [];

    for (const [index, token] of tokens.entries()) {
      const lowSignal = LOW_SIGNAL_TOKENS.has(token);
      const domainBoost = index === 0 ? 2 : 0;
      if (pathTokens.has(token)) {
        score += (lowSignal ? 0 : 3) + domainBoost;
        matchedOn.push(`path:${token}`);
        matchedTokens.add(token);
        continue;
      }
      if (!lowSignal && tagTokens.has(token)) {
        score += 2 + domainBoost;
        matchedOn.push(`tag:${token}`);
        matchedTokens.add(token);
        continue;
      }
      if (!lowSignal && (summaryLower.includes(token) || operationIdLower.includes(token))) {
        score += 1;
        matchedOn.push(`meta:${token}`);
        matchedTokens.add(token);
      }
    }

    if (score > 0) {
      if (tailSignalTokens.length > 0) {
        const hasSpecificTailMatch = tailSignalTokens.some((token) => matchedTokens.has(token));
        if (!hasSpecificTailMatch) {
          score -= 3;
        }
      }
      if (preferReadOnlyMatches) {
        score += operation.readOnlySafe ? 1 : -1;
      }
      if (score > 0) {
        matches.push({
          ...operation,
          score,
          matchedOn,
        });
      }
    }
  }

  return matches.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    const depthA = a.path.split('/').filter((segment) => segment.length > 0).length;
    const depthB = b.path.split('/').filter((segment) => segment.length > 0).length;
    if (depthA !== depthB) {
      return depthA - depthB;
    }
    if (a.path === b.path) {
      return a.method.localeCompare(b.method);
    }
    return a.path.localeCompare(b.path);
  });
}

export async function getOpenApiStats(config: JellyfinConfig): Promise<OpenApiStats> {
  try {
    const result = await fetchOpenApiDocument(config);
    return {
      available: true,
      sourcePath: result.sourcePath,
      ...summarizeOpenApi(result.document),
    };
  } catch (err) {
    return {
      available: false,
      error: err instanceof Error ? err.message : 'Unknown OpenAPI probe error',
    };
  }
}
