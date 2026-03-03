import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

type PackageJsonShape = {
  version?: string;
  [key: string]: unknown;
};

function getCommitCount(cwd: string): number {
  const output = execSync('git rev-list --count HEAD', { cwd, encoding: 'utf-8' }).trim();
  const parsed = Number.parseInt(output, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Invalid git commit count: ${output}`);
  }
  return parsed;
}

function formatDateVersion(date: Date): string {
  const year = String(date.getUTCFullYear());
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
}

function loadPackageJson(filePath: string): PackageJsonShape {
  return JSON.parse(readFileSync(filePath, 'utf-8')) as PackageJsonShape;
}

function savePackageJson(filePath: string, value: PackageJsonShape): void {
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf-8');
}

const root = process.cwd();
const packagePath = join(root, 'package.json');
const commitCount = getCommitCount(root);
const commitIndex = commitCount + 1;
const datePart = formatDateVersion(new Date());
const version = `${datePart}-${commitIndex}`;

const pkg = loadPackageJson(packagePath);
pkg.version = version;
savePackageJson(packagePath, pkg);

console.log(`Set package.json version to ${version} (date=${datePart}, next_commit_index=${commitIndex}).`);
