import { Command } from 'commander';
import { JellyfinApiClient } from '../api/client.js';
import { toon } from '../formatters/index.js';
import { getConfig, getSettingsPath } from '../utils/config.js';
import { getOpenApiStats } from '../utils/openapi.js';
import type { JellyfinConfig } from '../types/index.js';

function detectAuthMode(config: JellyfinConfig): 'api_key' | 'username_password' | 'none' {
  if (config.apiKey) {
    return 'api_key';
  }
  if (config.username && config.password) {
    return 'username_password';
  }
  return 'none';
}

export function addConfigDoctorCommand(cmd: Command): void {
  cmd
    .command('doctor')
    .description('Run config/auth/connectivity diagnostics for agent-safe automation')
    .option('--name <name>', 'Server name')
    .action(async (options) => {
      const config = getConfig(options.name);
      const authMode = detectAuthMode(config);
      const warnings: string[] = [];

      if (!config.serverUrl) {
        console.log(
          toon.formatToon(
            {
              configured: false,
              settings_path: getSettingsPath(),
              auth_mode: authMode,
              message: 'No server URL configured',
            },
            'config_doctor',
          ),
        );
        return;
      }

      const client = new JellyfinApiClient(config);
      let connectionOk = false;
      let authOk = false;
      let serverName: string | null | undefined;
      let serverVersion: string | null | undefined;
      let localAddress: string | null | undefined;

      try {
        const info = await client.getPublicSystemInfo();
        connectionOk = true;
        serverName = info.ServerName;
        serverVersion = info.Version;
        localAddress = info.LocalAddress;
      } catch {
        connectionOk = false;
      }

      try {
        if (authMode === 'username_password') {
          await client.authenticate(config.username!, config.password!);
        }
        if (authMode !== 'none') {
          await client.getUsers();
          authOk = true;
        }
      } catch {
        authOk = false;
      }

      if (localAddress?.startsWith('http://http://') || localAddress?.startsWith('https://https://')) {
        warnings.push('server_local_address_looks_malformed');
      }
      if (!config.userId) {
        warnings.push('missing_user_id');
      }

      const openapi = await getOpenApiStats(config);
      if (!openapi.available) {
        warnings.push('openapi_schema_not_reachable');
      }

      console.log(
        toon.formatToon(
          {
            configured: true,
            settings_path: getSettingsPath(),
            server_url: config.serverUrl,
            auth_mode: authMode,
            has_user_id: Boolean(config.userId),
            output_format: config.outputFormat ?? 'toon',
            timeout_ms: config.timeout ?? 30000,
            checks: {
              connection_ok: connectionOk,
              auth_ok: authMode === 'none' ? false : authOk,
              openapi_available: openapi.available,
            },
            server: {
              name: serverName,
              version: serverVersion,
              local_address: localAddress,
            },
            openapi: {
              source_path: openapi.sourcePath,
              path_count: openapi.pathCount,
              operation_count: openapi.operationCount,
              top_tags: openapi.topTags,
            },
            warnings,
          },
          'config_doctor',
        ),
      );
    });
}
