import { Command } from 'commander';
import { parse as parseYaml } from 'yaml';
import { JellyfinApiClient } from '../api/client.js';
import { formatOutput } from '../formatters/index.js';
import { getConfig, getSettingsPath } from '../utils/config.js';
import { getOpenApiStats } from '../utils/openapi.js';
import type { JellyfinConfig, OutputFormat } from '../types/index.js';
import { sanitizeServerAddress } from './setup-utils.js';
import { resolveOutputFormat, type FormatOptions } from './schema-utils.js';

function detectAuthMode(config: JellyfinConfig): 'api_key' | 'username_password' | 'none' {
  if (config.apiKey) {
    return 'api_key';
  }
  if (config.username && config.password) {
    return 'username_password';
  }
  return 'none';
}

type FormatValidationResult = {
  ok: boolean;
  output_bytes: number;
  detail?: string | undefined;
};

type FormatValidationSummary = {
  enabled: boolean;
  all_ok: boolean;
  formats: Record<OutputFormat, FormatValidationResult>;
};

const VALIDATION_FORMATS: OutputFormat[] = ['toon', 'json', 'table', 'raw', 'yaml', 'markdown'];

function validateRenderedOutput(format: OutputFormat, rendered: string): void {
  if (rendered.trim().length === 0) {
    throw new Error('empty_output');
  }

  if (format === 'json' || format === 'raw') {
    JSON.parse(rendered);
    return;
  }

  if (format === 'yaml') {
    parseYaml(rendered);
    return;
  }

  if (format === 'toon') {
    const parsed = parseYaml(rendered);
    if (typeof parsed !== 'object' || parsed === null || !('type' in parsed)) {
      throw new Error('missing_toon_type_field');
    }
    return;
  }

  if (format === 'markdown') {
    if (!rendered.includes('**') && !rendered.includes('|') && !rendered.includes('- ')) {
      throw new Error('unexpected_markdown_shape');
    }
    return;
  }

  if (format === 'table') {
    if (!rendered.includes(':') && !rendered.includes('|') && !rendered.includes('\n')) {
      throw new Error('unexpected_table_shape');
    }
  }
}

function buildFormatValidationSummary(payload: Record<string, unknown>): FormatValidationSummary {
  const results = {} as Record<OutputFormat, FormatValidationResult>;

  for (const format of VALIDATION_FORMATS) {
    try {
      const rendered = formatOutput(payload, format, 'config_doctor');
      validateRenderedOutput(format, rendered);
      results[format] = {
        ok: true,
        output_bytes: Buffer.byteLength(rendered, 'utf-8'),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'validation_failed';
      results[format] = {
        ok: false,
        output_bytes: 0,
        detail: message,
      };
    }
  }

  return {
    enabled: true,
    all_ok: VALIDATION_FORMATS.every((format) => results[format].ok),
    formats: results,
  };
}

export function addConfigDoctorCommand(cmd: Command): void {
  cmd
    .command('doctor')
    .description('Run config/auth/connectivity diagnostics for agent-safe automation')
    .option('-f, --format <format>', 'Output format')
    .option(
      '--validate-formats',
      'Validate toon/json/table/raw/yaml/markdown formatter outputs for automation safety',
    )
    .option('--name <name>', 'Server name')
    .action(
      async function (
        this: Command,
        options: FormatOptions & {
          name?: string | undefined;
          validateFormats?: boolean | undefined;
        },
      ) {
      const config = getConfig(options.name);
      const runtimeFormat = resolveOutputFormat(this, { format: options.format ?? config.outputFormat });
      const authMode = detectAuthMode(config);
      const warnings: string[] = [];

      if (!config.serverUrl) {
        const payload: Record<string, unknown> = {
          configured: false,
          settings_path: getSettingsPath(),
          auth_mode: authMode,
          message: 'No server URL configured',
        };
        if (options.validateFormats) {
          payload.format_validations = buildFormatValidationSummary(payload);
        }
        console.log(
          formatOutput(payload, runtimeFormat, 'config_doctor'),
        );
        return;
      }

      const client = new JellyfinApiClient(config);
      let connectionOk = false;
      let authOk = false;
      let serverName: string | null | undefined;
      let serverVersion: string | null | undefined;
      let localAddressRaw: string | null | undefined;

      try {
        const info = await client.getPublicSystemInfo();
        connectionOk = true;
        serverName = info.ServerName;
        serverVersion = info.Version;
        localAddressRaw = info.LocalAddress;
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

      if (localAddressRaw?.startsWith('http://http://') || localAddressRaw?.startsWith('https://https://')) {
        warnings.push('server_local_address_looks_malformed');
      }
      if (!config.userId) {
        warnings.push('missing_user_id');
      }

      const openapi = await getOpenApiStats(config);
      if (!openapi.available) {
        warnings.push('openapi_schema_not_reachable');
      }

      const payload: Record<string, unknown> = {
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
          local_address: sanitizeServerAddress(localAddressRaw),
        },
        openapi: {
          source_path: openapi.sourcePath,
          path_count: openapi.pathCount,
          operation_count: openapi.operationCount,
          top_tags: openapi.topTags,
        },
        warnings,
      };

      if (options.validateFormats) {
        payload.format_validations = buildFormatValidationSummary(payload);
      }

      console.log(formatOutput(payload, runtimeFormat, 'config_doctor'));
    },
    );
}
