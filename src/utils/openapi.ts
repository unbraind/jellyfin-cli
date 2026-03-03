import type { JellyfinConfig } from '../types/index.js';

const HTTP_METHODS = new Set(['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'trace']);
const OPENAPI_CANDIDATES = ['/api-docs/openapi.json', '/openapi.json', '/swagger/v1/swagger.json'] as const;

type OpenApiOperation = {
  tags?: string[] | undefined;
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

function getTimeout(config: JellyfinConfig): number {
  return Math.max(5000, Math.min(60000, config.timeout ?? 30000));
}

function authHeader(config: JellyfinConfig): Record<string, string> | undefined {
  return config.apiKey ? { 'X-Emby-Token': config.apiKey } : undefined;
}

export async function fetchOpenApiDocument(config: JellyfinConfig): Promise<OpenApiProbeResult> {
  if (!config.serverUrl) {
    throw new Error('Missing server URL');
  }

  let lastError = 'OpenAPI schema not reachable';
  for (const path of OPENAPI_CANDIDATES) {
    try {
      const response = await fetch(`${config.serverUrl}${path}`, {
        headers: authHeader(config),
        signal: AbortSignal.timeout(getTimeout(config)),
      });
      if (!response.ok) {
        lastError = `HTTP ${response.status} at ${path}`;
        continue;
      }

      const document = (await response.json()) as OpenApiDocument;
      if (!document || typeof document !== 'object' || !document.paths || typeof document.paths !== 'object') {
        throw new Error(`Invalid OpenAPI payload from ${path}`);
      }

      return {
        sourcePath: path,
        document,
      };
    } catch (err) {
      lastError = err instanceof Error ? err.message : 'Unknown OpenAPI probe error';
    }
  }

  throw new Error(lastError);
}

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
