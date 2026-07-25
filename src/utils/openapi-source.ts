import {
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import type { JellyfinConfig } from '../types/index.js';
import { getConfigDir } from './config.js';

const LOCAL_OPENAPI_PATHS = [
  '/api-docs/openapi.json',
  '/openapi.json',
  '/swagger/v1/swagger.json',
] as const;
const OFFICIAL_OPENAPI_BASE = 'https://repo.jellyfin.org/files/openapi/stable';
const VERSION_PATTERN = /^\d+\.\d+\.\d+(?:\.\d+)?$/;
const ARTIFACT_VERSION_PATTERN = /^\d+\.\d+(?:\.\d+){0,2}(?:-(?:alpha|beta|rc)\d+)?$/i;

type OpenApiOperation = {
  tags?: string[] | undefined;
  summary?: string | undefined;
  operationId?: string | undefined;
  deprecated?: boolean | undefined;
};

/** Minimal OpenAPI shape required for discovery, matching, and provenance reporting. */
export type OpenApiDocument = {
  info?: {
    version?: string | undefined;
    title?: string | undefined;
  } | undefined;
  paths?: Record<string, Partial<Record<string, OpenApiOperation>>> | undefined;
  components?: {
    schemas?: Record<string, unknown> | undefined;
  } | undefined;
};

/** Trusted location from which an OpenAPI document was resolved. */
export type OpenApiSourceKind = 'server' | 'official' | 'cache';

/** OpenAPI document together with its user-visible source and optional private cache path. */
export type OpenApiProbeResult = {
  sourcePath: string;
  sourceKind: OpenApiSourceKind;
  cachePath?: string | undefined;
  document: OpenApiDocument;
};

/** Controls local endpoint probing and the opt-out official fallback. */
export type OpenApiFetchOptions = {
  endpointPath?: string | undefined;
  officialFallback?: boolean | undefined;
};

/** Controls exact official artifact resolution for stable and opted-in preview versions. */
export type OfficialOpenApiFetchOptions = {
  allowPrerelease?: boolean | undefined;
};

function isDocument(value: unknown): value is OpenApiDocument {
  return typeof value === 'object' && value !== null &&
    typeof (value as OpenApiDocument).paths === 'object' &&
    (value as OpenApiDocument).paths !== null;
}

function parseDocument(text: string): OpenApiDocument | undefined {
  try {
    const value: unknown = JSON.parse(text);
    return isDocument(value) ? value : undefined;
  } catch {
    return undefined;
  }
}

function matchesVersion(document: OpenApiDocument, version: string): boolean {
  return document.info?.version === version;
}

function expectedDocumentVersion(artifactVersion: string): string {
  const stablePart = artifactVersion.replace(/-(?:alpha|beta|rc)\d+$/i, '');
  return stablePart.split('.').length === 2 ? `${stablePart}.0` : stablePart;
}

function localPaths(endpointPath: string | undefined): string[] {
  const custom = endpointPath?.trim();
  const normalized = custom ? (custom.startsWith('/') ? custom : `/${custom}`) : undefined;
  return [...new Set([normalized, ...LOCAL_OPENAPI_PATHS].filter((path): path is string => Boolean(path)))];
}

async function fetchText(url: string, config: JellyfinConfig, authenticated: boolean): Promise<Response> {
  return fetch(url, {
    headers: authenticated && config.apiKey ? { 'X-Emby-Token': config.apiKey } : undefined,
    signal: AbortSignal.timeout(Math.max(5000, Math.min(60000, config.timeout ?? 30000))),
  });
}

async function resolveServerVersion(config: JellyfinConfig, failures: string[]): Promise<string | undefined> {
  const path = '/System/Info/Public';
  try {
    const response = await fetchText(`${config.serverUrl}${path}`, config, false);
    if (!response.ok) {
      failures.push(`${path} => HTTP ${response.status}`);
      return undefined;
    }
    const payload = await response.json() as { Version?: unknown };
    if (typeof payload.Version !== 'string' || !VERSION_PATTERN.test(payload.Version)) {
      failures.push(`${path} => Invalid server version`);
      return undefined;
    }
    return payload.Version;
  } catch (error) {
    failures.push(`${path} => ${error instanceof Error ? error.message : 'Unknown version probe error'}`);
    return undefined;
  }
}

function writeCache(path: string, document: OpenApiDocument): void {
  const directory = join(getConfigDir(), 'cache', 'openapi');
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  const temporaryPath = `${path}.${process.pid}.tmp`;
  writeFileSync(temporaryPath, `${JSON.stringify(document)}\n`, { encoding: 'utf-8', mode: 0o600 });
  renameSync(temporaryPath, path);
  chmodSync(path, 0o600);
}

/**
 * Resolves one trusted official Jellyfin OpenAPI artifact without forwarding credentials.
 * Prerelease artifact names require explicit opt-in and are validated against their stable API
 * version because preview filenames such as 12.0-rc3 report `info.version` as 12.0.0.
 * @param config - Request timeout configuration; credentials are deliberately ignored.
 * @param artifactVersion - Exact official artifact version embedded in the trusted URL.
 * @param options - Stable-by-default prerelease policy.
 * @returns The validated official or private-cache document and provenance.
 */
export async function fetchOfficialOpenApiDocument(
  config: JellyfinConfig,
  artifactVersion: string,
  options: OfficialOpenApiFetchOptions = {},
): Promise<OpenApiProbeResult> {
  const version = validateOfficialOpenApiArtifactVersion(
    artifactVersion,
    options.allowPrerelease,
  );
  const expectedVersion = expectedDocumentVersion(version);
  const cachePath = join(getConfigDir(), 'cache', 'openapi', `jellyfin-openapi-${version}.json`);
  const cached = existsSync(cachePath) ? parseDocument(readFileSync(cachePath, 'utf-8')) : undefined;
  if (cached && matchesVersion(cached, expectedVersion)) {
    return { sourcePath: cachePath, sourceKind: 'cache', cachePath, document: cached };
  }

  const officialUrl = `${OFFICIAL_OPENAPI_BASE}/jellyfin-openapi-${version}.json`;
  const response = await fetchText(officialUrl, config, false);
  if (!response.ok) {
    throw new Error(`Official OpenAPI artifact unavailable for ${version}: HTTP ${response.status}`);
  }
  const document = parseDocument(await response.text());
  if (!document || !matchesVersion(document, expectedVersion)) {
    throw new Error(`Official OpenAPI artifact has an invalid API version for ${version}`);
  }
  writeCache(cachePath, document);
  return { sourcePath: officialUrl, sourceKind: 'official', cachePath, document };
}

/**
 * Validates one official artifact identifier before any local or remote schema probe.
 * @param artifactVersion - Exact stable or prerelease artifact identifier.
 * @param allowPrerelease - Whether alpha, beta, or release-candidate artifacts are permitted.
 * @returns The trimmed safe artifact identifier.
 */
export function validateOfficialOpenApiArtifactVersion(
  artifactVersion: string,
  allowPrerelease = false,
): string {
  const version = artifactVersion.trim();
  if (!ARTIFACT_VERSION_PATTERN.test(version)) {
    throw new Error(`Invalid official OpenAPI artifact version: ${artifactVersion}`);
  }
  if (version.includes('-') && !allowPrerelease) {
    throw new Error('Prerelease OpenAPI artifacts require --allow-prerelease');
  }
  return version;
}

/**
 * Resolves Jellyfin OpenAPI from the configured server, then an exact-version official artifact.
 * Credentials are used only for same-origin local probes; official requests are unauthenticated.
 * @param config - Configured server URL, credentials, and request timeout.
 * @param options - Optional custom local path and official-fallback override.
 * @returns The validated document and provenance needed by agent-facing diagnostics.
 */
export async function fetchOpenApiDocument(
  config: JellyfinConfig,
  options: OpenApiFetchOptions = {},
): Promise<OpenApiProbeResult> {
  if (!config.serverUrl) throw new Error('Missing server URL');

  const failures: string[] = [];
  const candidates = localPaths(options.endpointPath);
  for (const path of candidates) {
    try {
      const response = await fetchText(`${config.serverUrl}${path}`, config, true);
      if (!response.ok) {
        failures.push(`${path} => HTTP ${response.status}`);
        continue;
      }
      const document = parseDocument(await response.text());
      if (!document) {
        failures.push(`${path} => Invalid OpenAPI payload`);
        continue;
      }
      return { sourcePath: path, sourceKind: 'server', document };
    } catch (error) {
      failures.push(`${path} => ${error instanceof Error ? error.message : 'Unknown OpenAPI probe error'}`);
    }
  }

  const officialFallback = options.officialFallback ?? process.env.JELLYFIN_OPENAPI_OFFICIAL_FALLBACK !== '0';
  if (!officialFallback) {
    throw new Error(`OpenAPI schema not reachable. Tried ${candidates.length} path(s): ${failures.join('; ')}`);
  }

  const version = await resolveServerVersion(config, failures);
  if (version) {
    const path = join(getConfigDir(), 'cache', 'openapi', `jellyfin-openapi-${version}.json`);
    const cached = existsSync(path) ? parseDocument(readFileSync(path, 'utf-8')) : undefined;
    if (cached && matchesVersion(cached, version)) {
      return { sourcePath: path, sourceKind: 'cache', cachePath: path, document: cached };
    }

    const officialUrl = `${OFFICIAL_OPENAPI_BASE}/jellyfin-openapi-${version}.json`;
    try {
      const response = await fetchText(officialUrl, config, false);
      if (!response.ok) {
        failures.push(`${officialUrl} => HTTP ${response.status}`);
      } else {
        const document = parseDocument(await response.text());
        if (document && matchesVersion(document, version)) {
          writeCache(path, document);
          return { sourcePath: officialUrl, sourceKind: 'official', cachePath: path, document };
        }
        failures.push(`${officialUrl} => Invalid or version-mismatched OpenAPI payload`);
      }
    } catch (error) {
      failures.push(`${officialUrl} => ${error instanceof Error ? error.message : 'Unknown official schema error'}`);
    }
  }

  throw new Error(`OpenAPI schema not reachable. Tried ${candidates.length} local path(s): ${failures.join('; ')}`);
}

export const fetchOpenApiDocumentWithOptions = fetchOpenApiDocument;
