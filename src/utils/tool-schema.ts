import type { Argument, Command, Option } from 'commander';
import { getCommandPath, isCommandBlockedInReadOnly } from './read-only-guard.js';

type JsonSchema = {
  type: 'object';
  properties: Record<string, unknown>;
  required?: string[] | undefined;
  additionalProperties: false;
};

export type CliToolSchema = {
  name: string;
  command: string;
  description: string;
  read_only_safe: boolean;
  input_schema: JsonSchema;
  args: Array<{
    name: string;
    description: string;
    required: boolean;
    variadic: boolean;
  }>;
  options: Array<{
    key: string;
    flags: string;
    description: string;
    required: boolean;
    boolean: boolean;
    variadic: boolean;
  }>;
};

function collectLeafCommands(command: Command): Command[] {
  const subcommands = command.commands.filter((cmd) => cmd.name() !== 'help');
  if (subcommands.length === 0) {
    return [command];
  }
  return subcommands.flatMap((child) => collectLeafCommands(child));
}

function commandAncestors(command: Command): Command[] {
  const lineage: Command[] = [];
  let cursor: Command | undefined = command;
  while (cursor) {
    lineage.push(cursor);
    cursor = cursor.parent as Command | undefined;
  }
  return lineage.reverse();
}

function toSchemaForArgument(arg: Argument): unknown {
  const choices = arg.argChoices;
  if (arg.variadic) {
    if (choices && choices.length > 0) {
      return { type: 'array', items: { type: 'string', enum: choices } };
    }
    return { type: 'array', items: { type: 'string' } };
  }
  if (choices && choices.length > 0) {
    return { type: 'string', enum: choices };
  }
  return { type: 'string' };
}

function toSchemaForOption(option: Option): unknown {
  if (option.isBoolean()) {
    return { type: 'boolean' };
  }

  const choices = option.argChoices;
  if (option.variadic) {
    if (choices && choices.length > 0) {
      return { type: 'array', items: { type: 'string', enum: choices } };
    }
    return { type: 'array', items: { type: 'string' } };
  }

  if (choices && choices.length > 0) {
    return { type: 'string', enum: choices };
  }
  return { type: 'string' };
}

function safeSchemaKey(name: string, taken: Set<string>): string {
  if (!taken.has(name)) {
    taken.add(name);
    return name;
  }
  let index = 2;
  while (taken.has(`${name}_${index}`)) {
    index += 1;
  }
  const key = `${name}_${index}`;
  taken.add(key);
  return key;
}

export function generateCliToolSchemas(root: Command, prefix?: string): CliToolSchema[] {
  const normalizedPrefix = prefix?.trim().toLowerCase();
  const leaves = collectLeafCommands(root);
  const tools: CliToolSchema[] = [];

  for (const leaf of leaves) {
    const commandPath = getCommandPath(leaf);
    if (!commandPath) {
      continue;
    }
    if (normalizedPrefix && !commandPath.startsWith(normalizedPrefix)) {
      continue;
    }

    const required: string[] = [];
    const properties: Record<string, unknown> = {};
    const args: CliToolSchema['args'] = [];
    const options: CliToolSchema['options'] = [];
    const usedKeys = new Set<string>();

    for (const arg of leaf.registeredArguments) {
      const baseName = arg.name().replaceAll('-', '_');
      const key = safeSchemaKey(baseName, usedKeys);
      properties[key] = toSchemaForArgument(arg);
      if (arg.required) {
        required.push(key);
      }
      args.push({
        name: key,
        description: arg.description || '',
        required: arg.required,
        variadic: arg.variadic,
      });
    }

    const lineage = commandAncestors(leaf);
    const optionMap = new Map<string, Option>();
    for (const ancestor of lineage) {
      for (const option of ancestor.options) {
        if (option.long === '--help') {
          continue;
        }
        optionMap.set(option.attributeName(), option);
      }
    }

    for (const option of optionMap.values()) {
      const key = safeSchemaKey(option.attributeName(), usedKeys);
      properties[key] = toSchemaForOption(option);
      if (option.mandatory) {
        required.push(key);
      }
      options.push({
        key,
        flags: option.flags,
        description: option.description || '',
        required: option.mandatory,
        boolean: option.isBoolean(),
        variadic: option.variadic,
      });
    }

    const toolName = `jf_${commandPath.replaceAll(' ', '_').replaceAll('-', '_')}`;
    tools.push({
      name: toolName,
      command: `jf ${commandPath}`,
      description: leaf.description() || `Execute "${commandPath}"`,
      read_only_safe: !isCommandBlockedInReadOnly(commandPath),
      input_schema: {
        type: 'object',
        properties,
        required: required.length > 0 ? required : undefined,
        additionalProperties: false,
      },
      args,
      options,
    });
  }

  return tools.sort((a, b) => a.command.localeCompare(b.command));
}
