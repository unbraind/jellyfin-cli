#!/usr/bin/env node

import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { commandFor, flagString, parseFlags, repoRoot, runCommand } from './utils.mjs';

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export function parsePublishedVersion(raw) {
  try {
    const value = JSON.parse(raw);
    return typeof value === 'string' ? value : null;
  } catch {
    return null;
  }
}

export async function verifyPublishedVersion({ version, attempts = 30, delayMs = 10_000 }) {
  const pkg = JSON.parse(readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));
  const verificationDirectory = mkdtempSync(path.join(tmpdir(), 'jellyfin-cli-public-verify-'));
  try {
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      const options = { allowFailure: true, capture: true, cwd: verificationDirectory };
      const npmView = runCommand(commandFor('npm'), ['view', `${pkg.name}@${version}`, 'version', '--json'], options);
      const npx = runCommand(commandFor('npx'), ['--yes', '--package', `${pkg.name}@${version}`, 'jf', '--version'], options);
      const bunx = runCommand(commandFor('bunx'), ['--bun', '--package', `${pkg.name}@${version}`, 'jf', '--version'], options);
      if (npmView.status === 0 && parsePublishedVersion(npmView.stdout) === version && npx.status === 0 && npx.stdout.includes(version) && bunx.status === 0 && bunx.stdout.includes(version)) {
        return { ok: true, package: pkg.name, version, npm: true, npx: true, bunx: true, attempts: attempt };
      }
      if (attempt < attempts) await sleep(delayMs);
    }
  } finally {
    rmSync(verificationDirectory, { recursive: true, force: true });
  }
  throw new Error(`Published package ${pkg.name}@${version} did not become usable through npm, npx, and bunx`);
}

async function main(argv = process.argv.slice(2)) {
  const flags = parseFlags(argv);
  const tag = flagString(flags, 'tag');
  const version = flagString(flags, 'version', tag?.replace(/^v/, ''));
  if (!version) throw new Error('--version or --tag is required');
  const result = await verifyPublishedVersion({ version });
  console.log(JSON.stringify(result, null, 2));
}

if (import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  main().catch((error) => { console.error(error instanceof Error ? error.message : String(error)); process.exit(1); });
}
