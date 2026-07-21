import type { JellyfinConfig } from '../types/index.js';
import { LOW_SIGNAL_TOKENS, isReadOnlyIntent } from './openapi-intent.js';
import { tokenizeIntentValue, tokenizePathValue } from './openapi-tokenize.js';
import {
  fetchOpenApiDocument,
  type OpenApiDocument,
} from './openapi-source.js';

export {
  fetchOpenApiDocument,
  fetchOpenApiDocumentWithOptions,
  type OpenApiDocument,
  type OpenApiFetchOptions,
  type OpenApiProbeResult,
} from './openapi-source.js';

const HTTP_METHODS = new Set(['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'trace']);

/**
 * Represents the open api stats values accepted by the typed Jellyfin interface.
 */
export type OpenApiStats = {
  available: boolean;
  sourcePath?: string | undefined;
  pathCount?: number | undefined;
  operationCount?: number | undefined;
  topTags?: Array<{ tag: string; operations: number }> | undefined;
  serverVersion?: string | undefined;
  sourceKind?: 'server' | 'official' | 'cache' | undefined;
  cachePath?: string | undefined;
  error?: string | undefined;
};

/**
 * Represents the open api operation entry values accepted by the typed Jellyfin interface.
 */
export type OpenApiOperationEntry = {
  method: string;
  path: string;
  operationId?: string | undefined;
  summary?: string | undefined;
  tags: string[];
  deprecated: boolean;
  readOnlySafe: boolean;
};

/**
 * Represents the open api operation filter values accepted by the typed Jellyfin interface.
 */
export type OpenApiOperationFilter = {
  method?: string | undefined;
  pathPrefix?: string | undefined;
  tag?: string | undefined;
  search?: string | undefined;
  readOnlySafe?: boolean | undefined;
};

/**
 * Represents the command operation match values accepted by the typed Jellyfin interface.
 */
export type CommandOperationMatch = OpenApiOperationEntry & {
  score: number;
  matchedOn: string[];
};


/**
 * Retrieves or derives summarize open api without mutating Jellyfin state.
 * @param document - The validated OpenAPI document to inspect.
 * @returns - The typed summarize open api result.
 */
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

/**
 * Retrieves or derives extract open api operations without mutating Jellyfin state.
 * @param document - The validated OpenAPI document to inspect.
 * @returns - The typed extract open api operations result.
 */
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

/**
 * Retrieves or derives filter open api operations without mutating Jellyfin state.
 * @param operations - The operations value required by this operation.
 * @param filters - The filters value required by this operation.
 * @returns - The typed filter open api operations result.
 */
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

/**
 * Retrieves or derives match operations for command intent without mutating Jellyfin state.
 * @param operations - The operations value required by this operation.
 * @param commandPath - The command path value required by this operation.
 * @returns - The normalized string representation.
 */
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

/**
 * Retrieves or derives open api stats without mutating Jellyfin state.
 * @param config - The resolved Jellyfin client configuration.
 * @returns - The typed get open api stats result.
 */
export async function getOpenApiStats(config: JellyfinConfig): Promise<OpenApiStats> {
  try {
    const result = await fetchOpenApiDocument(config);
    return {
      available: true,
      sourcePath: result.sourcePath,
      sourceKind: result.sourceKind,
      cachePath: result.cachePath,
      ...summarizeOpenApi(result.document),
    };
  } catch (err) {
    return {
      available: false,
      error: err instanceof Error ? err.message : 'Unknown OpenAPI probe error',
    };
  }
}
