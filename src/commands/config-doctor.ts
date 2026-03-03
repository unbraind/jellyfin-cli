import { Command } from 'commander';
import { JellyfinApiClient } from '../api/client.js';
import { toon } from '../formatters/index.js';
import { getConfig, getSettingsPath } from '../utils/config.js';
import type { JellyfinConfig } from '../types/index.js';

const HTTP_METHODS = new Set(['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'trace']);

function detectAuthMode(config: JellyfinConfig): 'api_key' | 'username_password' | 'none' {
  if (config.apiKey) {
    return 'api_key';
  }
  if (config.username && config.password) {
    return 'username_password';
  }
  return 'none';
}

async function getOpenApiStats(
  config: JellyfinConfig,
): Promise<{ available: boolean; pathCount?: number; operationCount?: number; error?: string }> {
  const candidates = ['/api-docs/openapi.json', '/openapi.json', '/swagger/v1/swagger.json'];
  let lastError: string | undefined;
  for (const path of candidates) {
    try {
      const res = await fetch(`${config.serverUrl}${path}`, {
        headers: config.apiKey ? { 'X-Emby-Token': config.apiKey } : undefined,
        signal: AbortSignal.timeout(Math.max(5000, Math.min(60000, config.timeout ?? 30000))),
      });
      if (!res.ok) {
        continue;
      }

      const doc = (await res.json()) as { paths?: Record<string, Record<string, unknown>> };
      const paths = doc.paths ?? {};
      let operationCount = 0;
      for (const methods of Object.values(paths)) {
        for (const methodName of Object.keys(methods ?? {})) {
          if (HTTP_METHODS.has(methodName.toLowerCase())) {
            operationCount++;
          }
        }
      }

      return {
        available: true,
        pathCount: Object.keys(paths).length,
        operationCount,
      };
    } catch (err) {
      lastError = err instanceof Error ? err.message : 'Unknown OpenAPI probe error';
    }
  }

  return { available: false, error: lastError };
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
              path_count: openapi.pathCount,
              operation_count: openapi.operationCount,
            },
            warnings,
          },
          'config_doctor',
        ),
      );
    });
}
