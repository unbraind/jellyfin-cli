#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { commandFor, repoRoot, runCommand } from './utils.mjs';

const registryPath = path.join(repoRoot, '.agents', 'pm', 'extensions', '.managed-extensions.json');

function pmCommand(args, options = {}) {
  return runCommand(commandFor('npm'), [
    'exec', '--yes', '--package', '@unbrained/pm-cli@latest', '--', 'pm', ...args,
  ], options);
}

function entriesFrom(raw) {
  return raw ? JSON.parse(raw).entries ?? [] : [];
}

export function ensurePmChangelog() {
  const available = pmCommand(['changelog', 'generate', '--help'], { allowFailure: true, capture: true });
  if (available.status === 0) return { installed: false, registryChanged: false };

  const originalRegistry = existsSync(registryPath) ? readFileSync(registryPath, 'utf8') : null;
  pmCommand(['install', 'npm:pm-changelog', '--project']);
  const installedRegistry = readFileSync(registryPath, 'utf8');
  const registryChanged = JSON.stringify(entriesFrom(originalRegistry)) !== JSON.stringify(entriesFrom(installedRegistry));

  // `pm install` refreshes the registry's top-level updated_at even when the
  // managed entry is byte-for-byte identical. Restore the original file in
  // that no-op case so changelog checks remain read-only and reproducible.
  if (!registryChanged && originalRegistry !== null) writeFileSync(registryPath, originalRegistry, 'utf8');
  return { installed: true, registryChanged };
}

if (import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  try {
    const result = ensurePmChangelog();
    console.log(JSON.stringify(result));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
