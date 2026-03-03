import { Command } from 'commander';
import { text } from 'node:stream/consumers';
import YAML from 'yaml';
import { formatOutput } from '../formatters/index.js';
import { getSchema } from './schema-defs.js';
import { isOutputFormat, parseOutputFormat } from '../utils/output-format.js';
import { validateJsonSchema } from '../utils/schema-validate.js';
import type { OutputFormat } from '../types/index.js';

type FormatOptions = {
  format?: string | undefined;
};

function resolveFormatCandidate(command: Command, options: FormatOptions): string {
  const localSource = command.getOptionValueSource('format');
  if (localSource && localSource !== 'default' && typeof options.format === 'string') {
    return options.format;
  }

  let parent: Command | null = command.parent;
  while (parent) {
    const parentValue = parent.opts().format;
    const parentSource = parent.getOptionValueSource('format');
    if (parentSource && parentSource !== 'default' && typeof parentValue === 'string') {
      return parentValue;
    }
    parent = parent.parent;
  }

  if (typeof options.format === 'string') {
    return options.format;
  }

  return 'toon';
}

function resolveOutputFormat(command: Command, options: FormatOptions): OutputFormat {
  const candidate = resolveFormatCandidate(command, options);
  if (!isOutputFormat(candidate)) {
    console.error(formatOutput({ error: `Invalid format: ${candidate}` }, 'toon', 'error'));
    process.exit(1);
  }
  return parseOutputFormat(candidate, 'toon');
}

async function readValidationInput(input: string | undefined): Promise<string> {
  if (typeof input === 'string') {
    return input;
  }
  if (process.stdin.isTTY) {
    throw new Error('Validation input is required. Use --input or pipe data via stdin.');
  }
  return text(process.stdin);
}

function parseValidationInput(value: string, sourceFormat: string): unknown {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error('Validation input is empty.');
  }

  if (sourceFormat === 'json') {
    return JSON.parse(trimmed);
  }
  if (sourceFormat === 'yaml' || sourceFormat === 'toon') {
    return YAML.parse(trimmed);
  }
  if (sourceFormat !== 'auto') {
    throw new Error(`Invalid input format: ${sourceFormat}. Use one of: auto, json, yaml, toon.`);
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    return YAML.parse(trimmed);
  }
}

export function createSchemaValidateCommand(): Command {
  return new Command('validate')
    .description('Validate Toon/JSON/YAML payloads against CLI output schemas')
    .argument('[type]', 'Output type to validate against (optional, auto-detected from payload type)')
    .option('-f, --format <format>', 'Output format (toon, json, table, raw, yaml, markdown)', 'toon')
    .option('--input <value>', 'Payload to validate as inline string (otherwise read from stdin)')
    .option('--from <sourceFormat>', 'Input format: auto, json, yaml, toon', 'auto')
    .action(async function (
      this: Command,
      type: string | undefined,
      options: FormatOptions & { input?: string; from?: string },
    ) {
      const outputFormat = resolveOutputFormat(this, options);

      try {
        const rawInput = await readValidationInput(options.input);
        const sourceFormat = String(options.from ?? 'auto').trim().toLowerCase();
        const payload = parseValidationInput(rawInput, sourceFormat);
        const payloadType = typeof payload === 'object' && payload !== null && 'type' in payload
          ? String((payload as Record<string, unknown>).type)
          : undefined;
        const expectedType = type || payloadType;
        const schema = getSchema(expectedType);
        const validation = validateJsonSchema(payload, schema);
        const data = {
          valid: validation.valid,
          expected_type: expectedType ?? null,
          detected_type: payloadType ?? null,
          error_count: validation.errors.length,
          errors: validation.errors.map((entry) => `${entry.path}: ${entry.message}`),
        };

        if (!validation.valid) {
          console.error(formatOutput(data, outputFormat, 'schema_validation'));
          process.exit(1);
        }

        console.log(formatOutput(data, outputFormat, 'schema_validation'));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Schema validation failed';
        console.error(formatOutput({ error: message }, outputFormat, 'error'));
        process.exit(1);
      }
    });
}
