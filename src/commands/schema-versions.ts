import { Command } from 'commander';
import { formatOutput } from '../formatters/index.js';
import { getConfig } from '../utils/config.js';
import {
  discoverJellyfinReleases,
  probeConfiguredJellyfinVersion,
  type JellyfinRelease,
} from '../utils/jellyfin-releases.js';
import { fetchOfficialOpenApiDocument, type OpenApiSourceKind } from '../utils/openapi-source.js';
import { resolveOutputFormat, type FormatOptions } from './schema-utils.js';

type VerifiedRelease = JellyfinRelease & {
  openapi_available: true;
  openapi_source_kind: Exclude<OpenApiSourceKind, 'server'>;
};

/**
 * Builds a directly executable compatibility command for an official release channel.
 * @param selector - Stable or preview moving selector resolved by the compatibility command.
 * @returns CLI argument vector with the required preview opt-in when applicable.
 */
function compatibilityArgv(selector: 'latest-stable' | 'latest-preview'): string[] {
  const argv = ['jf', 'schema', 'compatibility', '--target-version', selector];
  return selector === 'latest-preview' ? [...argv, '--allow-prerelease'] : argv;
}

/**
 * Attaches authoritative current Jellyfin release and OpenAPI artifact discovery.
 * @param cmd - Parent schema command receiving the versions subcommand.
 */
export function attachSchemaVersionsSubcommand(cmd: Command): void {
  cmd
    .command('versions')
    .description('Discover current official Jellyfin stable and preview API contracts')
    .option('-f, --format <format>', 'Output format (toon, json, table, raw, yaml, markdown)', 'toon')
    .option('--name <name>', 'Server name used only for a public live-version comparison')
    .action(async function (this: Command, options: FormatOptions & Record<string, unknown>) {
      const outputFormat = resolveOutputFormat(this, options);
      const config = getConfig(options.name as string | undefined);
      try {
        const releases = await discoverJellyfinReleases(config.timeout);
        const [liveVersion, stableArtifact, previewArtifact] = await Promise.all([
          probeConfiguredJellyfinVersion(config),
          fetchOfficialOpenApiDocument(config, releases.stable.version),
          releases.preview
            ? fetchOfficialOpenApiDocument(config, releases.preview.version, { allowPrerelease: true })
            : Promise.resolve(null),
        ]);
        const stable: VerifiedRelease = {
          ...releases.stable,
          openapi_available: true,
          openapi_source_kind: stableArtifact.sourceKind === 'server' ? 'official' : stableArtifact.sourceKind,
        };
        const preview: VerifiedRelease | null = releases.preview && previewArtifact ? {
          ...releases.preview,
          openapi_available: true,
          openapi_source_kind: previewArtifact.sourceKind === 'server' ? 'official' : previewArtifact.sourceKind,
        } : null;
        console.log(formatOutput({
          live_version: liveVersion,
          stable,
          preview,
          aliases: {
            latest_stable: stable.version,
            latest_preview: preview?.version ?? null,
          },
          compatibility_commands: {
            stable: compatibilityArgv('latest-stable'),
            preview: preview ? compatibilityArgv('latest-preview') : null,
          },
        }, outputFormat, 'jellyfin_versions'));
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Jellyfin version discovery failed';
        console.error(formatOutput({ error: message }, outputFormat, 'error'));
        process.exit(1);
      }
    });
}
