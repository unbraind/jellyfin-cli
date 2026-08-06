import type { JellyfinConfig } from '../types/index.js';
import { validateOfficialOpenApiArtifactVersion } from './openapi-source.js';

const RELEASES_URL = 'https://api.github.com/repos/jellyfin/jellyfin/releases?per_page=30';
const VERSION_PATTERN = /^v?(\d+\.\d+(?:\.\d+)?(?:-(?:alpha|beta|rc)\d+)?)$/i;

type GitHubRelease = {
  tag_name?: unknown;
  name?: unknown;
  html_url?: unknown;
  published_at?: unknown;
  draft?: unknown;
  prerelease?: unknown;
};

/** Public Jellyfin release identity used by version and compatibility commands. */
export type JellyfinRelease = {
  version: string;
  tag: string;
  name: string;
  release_url: string;
  published_at: string;
  prerelease: boolean;
};

/** Latest official stable and preview releases from Jellyfin's GitHub repository. */
export type JellyfinReleaseChannels = {
  stable: JellyfinRelease;
  preview: JellyfinRelease | null;
};

function parseRelease(value: unknown): JellyfinRelease | undefined {
  if (typeof value !== 'object' || value === null) return undefined;
  const release = value as GitHubRelease;
  if (release.draft === true || typeof release.tag_name !== 'string') return undefined;
  const versionMatch = VERSION_PATTERN.exec(release.tag_name.trim());
  if (!versionMatch?.[1]) return undefined;
  if (
    typeof release.html_url !== 'string' ||
    typeof release.published_at !== 'string' ||
    typeof release.prerelease !== 'boolean'
  ) return undefined;

  return {
    version: versionMatch[1],
    tag: release.tag_name,
    name: typeof release.name === 'string' ? release.name : release.tag_name,
    release_url: release.html_url,
    published_at: release.published_at,
    prerelease: release.prerelease,
  };
}

/**
 * Discovers current stable and preview Jellyfin releases from the official repository.
 * No configured Jellyfin credential is attached to this cross-origin request.
 * @param timeoutMs - Bounded request timeout inherited from local CLI configuration.
 * @param fetcher - Fetch implementation, injectable for deterministic contract tests.
 * @returns Current stable release and newest available preview release.
 */
export async function discoverJellyfinReleases(
  timeoutMs = 30000,
  fetcher: typeof fetch = fetch,
): Promise<JellyfinReleaseChannels> {
  const response = await fetcher(RELEASES_URL, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'jellyfin-cli',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    signal: AbortSignal.timeout(Math.max(5000, Math.min(60000, timeoutMs))),
  });
  if (!response.ok) {
    throw new Error(`Official Jellyfin release discovery failed: HTTP ${response.status}`);
  }
  const payload: unknown = await response.json();
  if (!Array.isArray(payload)) {
    throw new Error('Official Jellyfin release discovery returned an invalid payload');
  }
  const releases = payload.map(parseRelease).filter((value): value is JellyfinRelease => Boolean(value));
  const stable = releases.find((release) => !release.prerelease);
  if (!stable) throw new Error('Official Jellyfin release discovery found no stable release');
  return { stable, preview: releases.find((release) => release.prerelease) ?? null };
}

/**
 * Resolves exact versions and moving latest-stable/latest-preview selectors safely.
 * @param config - Timeout configuration; authentication fields are never forwarded.
 * @param selector - Exact artifact version or a supported moving selector.
 * @param allowPrerelease - Explicit opt-in required for preview selection.
 * @param fetcher - Fetch implementation, injectable for deterministic contract tests.
 * @returns Exact official OpenAPI artifact version.
 */
export async function resolveJellyfinVersionSelector(
  config: JellyfinConfig,
  selector: string,
  allowPrerelease = false,
  fetcher: typeof fetch = fetch,
): Promise<string> {
  const normalized = selector.trim().toLowerCase();
  if (normalized !== 'latest-stable' && normalized !== 'latest-preview') {
    return validateOfficialOpenApiArtifactVersion(selector, allowPrerelease);
  }
  if (normalized === 'latest-preview' && !allowPrerelease) {
    throw new Error('latest-preview requires --allow-prerelease');
  }
  const releases = await discoverJellyfinReleases(config.timeout, fetcher);
  const selected = normalized === 'latest-stable' ? releases.stable : releases.preview;
  if (!selected) throw new Error('Official Jellyfin release discovery found no preview release');
  return validateOfficialOpenApiArtifactVersion(selected.version, allowPrerelease);
}

/**
 * Reads the configured server's public version without sending authentication.
 * @param config - Configured server origin and request timeout.
 * @param fetcher - Fetch implementation, injectable for deterministic tests.
 * @returns Exact live server version, or null when no server is configured.
 */
export async function probeConfiguredJellyfinVersion(
  config: JellyfinConfig,
  fetcher: typeof fetch = fetch,
): Promise<string | null> {
  if (!config.serverUrl) return null;
  const response = await fetcher(`${config.serverUrl.replace(/\/$/, '')}/System/Info/Public`, {
    signal: AbortSignal.timeout(Math.max(5000, Math.min(60000, config.timeout ?? 30000))),
  });
  if (!response.ok) throw new Error(`Configured Jellyfin version probe failed: HTTP ${response.status}`);
  const payload: unknown = await response.json();
  const version = typeof payload === 'object' && payload !== null
    ? (payload as { Version?: unknown }).Version
    : undefined;
  if (typeof version !== 'string' || !/^\d+\.\d+(?:\.\d+)?$/.test(version)) {
    throw new Error('Configured Jellyfin version probe returned an invalid version');
  }
  return version;
}
