#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { flagString, parseFlags, repoRoot } from './utils.mjs';

export function extractReleaseSection(markdown, version) {
  const lines = markdown.replaceAll('\r\n', '\n').split('\n');
  const start = lines.findIndex((line) => line === `## ${version}` || line.startsWith(`## ${version} -`) || line.startsWith(`## [${version}]`));
  if (start === -1) return null;
  const relativeEnd = lines.slice(start + 1).findIndex((line) => /^##\s+/.test(line));
  const end = relativeEnd === -1 ? lines.length : start + 1 + relativeEnd;
  return lines.slice(start, end).join('\n').trim();
}

export function main(argv = process.argv.slice(2)) {
  const flags = parseFlags(argv);
  const version = flagString(flags, 'version');
  const output = flagString(flags, 'output');
  if (!version || !output) throw new Error('--version and --output are required');
  const section = extractReleaseSection(readFileSync(path.join(repoRoot, 'CHANGELOG.md'), 'utf8'), version);
  if (!section) throw new Error(`CHANGELOG.md has no section for ${version}`);
  writeFileSync(path.resolve(output), `${section}\n`, 'utf8');
}

if (import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  try { main(); } catch (error) { console.error(error instanceof Error ? error.message : String(error)); process.exit(1); }
}
