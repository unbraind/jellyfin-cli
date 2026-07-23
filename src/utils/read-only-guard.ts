import type { Command } from 'commander';
import { formatToon } from '../formatters/base.js';
import { MUTATING_VERBS, READ_ONLY_ALLOWED } from './read-only-policy.js';

function normalizedPath(command: Command): string {
  return command
    .name()
    .split(' ')
    .join('-')
    .trim()
    .toLowerCase();
}

/**
 * Retrieves or derives command path without mutating Jellyfin state.
 * @param command - The Commander command whose path or behavior is inspected.
 * @returns - The normalized string representation.
 */
export function getCommandPath(command: Command): string {
  const parts: string[] = [];
  let cursor: Command | null = command;
  while (cursor) {
    const name = normalizedPath(cursor);
    if (name && name !== 'jellyfin-cli' && name !== 'jf' && name !== 'jf-cli') {
      parts.push(name);
    }
    const parent: Command | undefined = cursor.parent as Command | undefined;
    cursor = parent ?? null;
  }

  return parts.reverse().join(' ').trim();
}

/**
 * Produces the validated is read only mode enabled result used by CLI automation.
 * @param option - The option value required by this operation.
 * @param envValue - The env value value required by this operation.
 * @returns - Whether the inspected value satisfies the documented condition.
 */
export function isReadOnlyModeEnabled(option: unknown, envValue: string | undefined): boolean {
  if (typeof option === 'boolean' && option) {
    return true;
  }

  if (!envValue) {
    return false;
  }

  const normalized = envValue.trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on';
}

/**
 * Produces the validated is command blocked in read only result used by CLI automation.
 * @param path - The API, command, or filesystem path to process.
 * @returns - Whether the inspected value satisfies the documented condition.
 */
export function isCommandBlockedInReadOnly(path: string): boolean {
  if (!path) {
    return false;
  }

  if (READ_ONLY_ALLOWED.has(path)) {
    return false;
  }

  const parts = path.split(' ');

  return parts.some((part) =>
    part
      .split(/[^a-z0-9]+/g)
      .filter((segment) => segment.length > 0)
      .some((segment) => MUTATING_VERBS.has(segment)),
  );
}

/**
 * Produces the validated build read only error result used by CLI automation.
 * @param path - The API, command, or filesystem path to process.
 * @returns - The normalized string representation.
 */
export function buildReadOnlyError(path: string): string {
  return formatToon({
    error: 'Command blocked by read-only mode',
    command: path,
    hint: 'Disable --read-only or set JELLYFIN_READ_ONLY=0 to allow mutating operations.',
    success: false,
  }, 'error');
}
