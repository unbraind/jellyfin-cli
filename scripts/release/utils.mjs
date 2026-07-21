import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const pmCliPackage = '@unbrained/pm-cli@2026.7.21';

export function commandFor(binary) {
  return process.platform === 'win32' && !binary.endsWith('.cmd') ? `${binary}.cmd` : binary;
}

export function runCommand(command, args, options = {}) {
  const {
    allowFailure = false,
    capture = false,
    cwd = repoRoot,
    env = {},
  } = options;
  const result = spawnSync(command, args, {
    cwd,
    env: { ...process.env, ...env },
    encoding: 'utf8',
    stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
  });
  if (result.error && !allowFailure) {
    throw new Error(`Command failed to start: ${command} ${args.join(' ')}\n${result.error.message}`);
  }
  const status = result.status ?? 1;
  if (status !== 0 && !allowFailure) {
    const detail = [result.stderr, result.stdout].filter(Boolean).join('\n').trim();
    throw new Error(`Command failed (${status}): ${command} ${args.join(' ')}${detail ? `\n${detail}` : ''}`);
  }
  return {
    status,
    stdout: capture ? result.stdout ?? '' : '',
    stderr: capture ? result.stderr ?? '' : '',
    error: result.error ?? null,
  };
}

export function parseFlags(argv) {
  const flags = new Map();
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith('--')) {
      flags.set(key, true);
    } else {
      flags.set(key, next);
      index += 1;
    }
  }
  return flags;
}

export function flagString(flags, key, fallback = null) {
  const value = flags.get(key);
  return value === undefined || value === true ? fallback : String(value);
}

export function flagBool(flags, key, fallback = false) {
  const value = flags.get(key);
  if (value === undefined) return fallback;
  if (value === true) return true;
  if (['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase())) return true;
  if (['0', 'false', 'no', 'off'].includes(String(value).toLowerCase())) return false;
  return fallback;
}

export function utcDateKey(now = new Date()) {
  return `${now.getUTCFullYear()}.${now.getUTCMonth() + 1}.${now.getUTCDate()}`;
}
