import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { findSecretFindings } from '../src/utils/release-checks.js';

function getTrackedFiles(root: string): string[] {
  const output = execSync('git ls-files', { cwd: root, encoding: 'utf-8' });
  return output
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .filter((line) => !line.startsWith('tests/'))
    .filter((line) => !line.endsWith('.example'))
    .map((line) => join(root, line));
}

const root = process.cwd();
const trackedFiles = getTrackedFiles(root).filter((filePath) => existsSync(filePath));
const findings = findSecretFindings(trackedFiles, root);

if (findings.length > 0) {
  console.error('Potential secrets found in tracked files:');
  for (const finding of findings) {
    console.error(`- ${finding.filePath}:${finding.line} | ${finding.reason} | ${finding.sample}`);
  }
  process.exit(1);
}

console.log(`OK: scanned ${trackedFiles.length} tracked files with no obvious hardcoded secrets.`);
