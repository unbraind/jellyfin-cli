#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { commandFor, parseFlags, repoRoot, runCommand, utcDateKey } from './release/utils.mjs';

export const VERSION_PATTERN = /^([1-9]\d{3})\.([1-9]\d*)\.([1-9]\d*)(?:-([1-9]\d*))?$/;

export function parseCalendarVersion(version) {
  const match = VERSION_PATTERN.exec(version);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  const ordinal = match[4] ? Number(match[4]) : 1;
  if (ordinal === 1 && match[4]) return null;
  return { dateKey: `${year}.${month}.${day}`, ordinal };
}

export function nextVersionForDate(versions, dateKey) {
  const ordinals = versions
    .map((version) => ({ version, parsed: parseCalendarVersion(version) }))
    .filter(({ parsed }) => parsed?.dateKey === dateKey)
    .map(({ parsed }) => parsed.ordinal);
  if (ordinals.length === 0) return dateKey;
  return `${dateKey}-${Math.max(...ordinals) + 1}`;
}

function readPackage() {
  return JSON.parse(readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));
}

function publishedVersions(packageName) {
  const result = runCommand(commandFor('npm'), ['view', packageName, 'versions', '--json'], {
    allowFailure: true,
    capture: true,
  });
  if (result.status !== 0) {
    if (/E404|404 Not Found/.test(result.stderr)) return [];
    throw new Error(`Unable to query published versions for ${packageName}: ${result.stderr.trim()}`);
  }
  const parsed = JSON.parse(result.stdout || '[]');
  return Array.isArray(parsed) ? parsed : typeof parsed === 'string' ? [parsed] : [];
}

function usage() {
  console.log('Usage: node scripts/release-version.mjs check [--tag vX.Y.Z] | next|sync [--date YYYY.M.D]');
}

export function main(argv = process.argv.slice(2)) {
  const command = argv[0] ?? 'check';
  const flags = parseFlags(argv.slice(1));
  if (command === '--help' || command === '-h') return usage();
  const pkg = readPackage();
  if (command === 'check') {
    if (!parseCalendarVersion(pkg.version)) throw new Error(`Invalid calendar version: ${pkg.version}`);
    const tag = flags.get('tag');
    if (tag && tag !== `v${pkg.version}`) throw new Error(`Tag/version mismatch: tag=${tag}, expected=v${pkg.version}`);
    console.log(`Version policy check passed (${pkg.version}).`);
    return;
  }
  if (command === 'next' || command === 'sync') {
    const dateKey = String(flags.get('date') ?? utcDateKey());
    const parsedDate = parseCalendarVersion(dateKey);
    if (!parsedDate || parsedDate.ordinal !== 1) throw new Error(`Invalid --date value: ${dateKey}`);
    const nextVersion = nextVersionForDate(publishedVersions(pkg.name), dateKey);
    if (command === 'sync') {
      runCommand(commandFor('npm'), ['version', '--no-git-tag-version', nextVersion]);
      console.log(`Synchronized package manifests to ${nextVersion}.`);
      return;
    }
    console.log(nextVersion);
    return;
  }
  throw new Error(`Unknown command: ${command}`);
}

if (import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
