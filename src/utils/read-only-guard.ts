import type { Command } from 'commander';
import { MUTATING_VERBS, READ_ONLY_ALLOWED } from './read-only-policy.js';

function normalizedPath(command: Command): string {
  return command
    .name()
    .split(' ')
    .join('-')
    .trim()
    .toLowerCase();
}

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

export function buildReadOnlyError(path: string): string {
  return [
    'type: error',
    'data:',
    '  error: Command blocked by read-only mode',
    `  command: ${path}`,
    '  hint: Disable --read-only or set JELLYFIN_READ_ONLY=0 to allow mutating operations.',
    '  success: false',
  ].join('\n');
}
