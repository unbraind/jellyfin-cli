import { Command } from 'commander';
import { parse as parseYaml } from 'yaml';
import { JellyfinApiClient } from '../api/client.js';
import { formatOutput } from '../formatters/index.js';
import type { OutputFormat } from '../types/index.js';
import { getConfig, getSettingsPath } from '../utils/config.js';
import { getOpenApiStats } from '../utils/openapi.js';
import { resolveOutputFormat, type FormatOptions } from './schema-utils.js';

type SetupValidateOptions = FormatOptions & {
  name?: string | undefined;
  requireAll?: boolean | undefined;
  validateFormats?: boolean | undefined;
};

type ValidationSummary = {
  enabled: boolean;
  all_ok: boolean;
  formats: Record<OutputFormat, { ok: boolean; output_bytes: number; detail?: string | undefined }>;
};

const VALIDATION_FORMATS: OutputFormat[] = ['toon', 'json', 'table', 'raw', 'yaml', 'markdown'];

function detectAuthMode(hasApiKey: boolean, hasUsernamePassword: boolean): 'api_key' | 'username_password' | 'none' {
  if (hasApiKey) {
    return 'api_key';
  }
  if (hasUsernamePassword) {
    return 'username_password';
  }
  return 'none';
}

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

  if (!rendered.includes(':') && !rendered.includes('|') && !rendered.includes('\n')) {
    throw new Error('unexpected_table_shape');
  }
}

function buildFormatValidationSummary(payload: Record<string, unknown>): ValidationSummary {
  const results = {} as ValidationSummary['formats'];
  for (const format of VALIDATION_FORMATS) {
    try {
      const rendered = formatOutput(payload, format, 'setup_validate');
      validateRenderedOutput(format, rendered);
      results[format] = {
        ok: true,
        output_bytes: Buffer.byteLength(rendered, 'utf-8'),
      };
    } catch (error) {
      results[format] = {
        ok: false,
        output_bytes: 0,
        detail: error instanceof Error ? error.message : 'validation_failed',
      };
    }
  }

  return {
    enabled: true,
    all_ok: VALIDATION_FORMATS.every((format) => results[format].ok),
    formats: results,
  };
}

export function attachSetupValidateSubcommand(cmd: Command): void {
  cmd
    .command('validate')
    .description('Validate setup readiness (config/connectivity/auth/OpenAPI/format checks)')
    .option('--name <name>', 'Server name')
    .option('--require-all', 'Exit non-zero when any setup check fails')
    .option('--validate-formats', 'Validate toon/json/table/raw/yaml/markdown formatter output')
    .option('-f, --format <format>', 'Output format')
    .action(async function (this: Command, options: SetupValidateOptions) {
      const config = getConfig(options.name);
      const runtimeFormat = resolveOutputFormat(this, options);
      const hasApiKey = Boolean(config.apiKey);
      const hasUsernamePassword = Boolean(config.username && config.password);
      const authMode = detectAuthMode(hasApiKey, hasUsernamePassword);

      let connectionOk = false;
      let authOk = false;
      let openapiAvailable = false;
      let openapiSource: string | null = null;
      let openapiError: string | null = null;
      let serverName: string | null = null;
      let serverVersion: string | null = null;

      if (config.serverUrl) {
        try {
          const client = new JellyfinApiClient(config);
          const info = await client.getPublicSystemInfo();
          connectionOk = true;
          serverName = info.ServerName ?? null;
          serverVersion = info.Version ?? null;
        } catch {
          connectionOk = false;
        }

        if (hasApiKey || hasUsernamePassword) {
          try {
            const client = new JellyfinApiClient(config);
            await client.getSystemInfo();
            authOk = true;
          } catch {
            authOk = false;
          }
        }

        const stats = await getOpenApiStats(config);
        openapiAvailable = stats.available;
        openapiSource = stats.sourcePath ?? null;
        openapiError = stats.available ? null : (stats.error ?? 'OpenAPI not reachable');
      }

      const payload: Record<string, unknown> = {
        settings_path: getSettingsPath(),
        configured: Boolean(config.serverUrl),
        server_url: config.serverUrl || null,
        server_name: serverName,
        server_version: serverVersion,
        auth_mode: authMode,
        checks: {
          connection_ok: connectionOk,
          auth_ok: authOk,
          openapi_available: openapiAvailable,
        },
        openapi: {
          source_path: openapiSource,
          error: openapiError,
        },
      };

      if (options.validateFormats) {
        payload.format_validations = buildFormatValidationSummary(payload);
      }

      const allOk = Boolean(config.serverUrl) &&
        connectionOk &&
        authOk &&
        openapiAvailable &&
        (!options.validateFormats ||
          ((payload.format_validations as ValidationSummary | undefined)?.all_ok ?? false));

      payload.all_ok = allOk;
      payload.require_all = Boolean(options.requireAll);

      console.log(formatOutput(payload, runtimeFormat, 'setup_validate'));
      if (options.requireAll && !allOk) {
        process.exit(1);
      }
    });
}
