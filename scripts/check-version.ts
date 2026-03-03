import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
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

const VERSION_PATTERN = /^(\d{4}\.\d{2}\.\d{2})-(\d+)$/;

const root = process.cwd();
const packagePath = join(root, 'package.json');
const pkg = loadPackageJson(packagePath);
const version = pkg.version;

if (!version || typeof version !== 'string') {
  console.error('Invalid package.json version: missing or not a string.');
  process.exit(1);
}

const match = VERSION_PATTERN.exec(version);
if (!match) {
  console.error(`Invalid version format: ${version}`);
  console.error('Expected format: YYYY.MM.DD-<commitIndex>');
  process.exit(1);
}

const [, datePart, commitIndexPart] = match;
const todayPart = formatDateVersion(new Date());
if (datePart !== todayPart) {
  console.error(`Version date mismatch: found ${datePart}, expected ${todayPart}.`);
  process.exit(1);
}

const commitIndex = Number.parseInt(commitIndexPart, 10);
if (!Number.isFinite(commitIndex) || commitIndex <= 0) {
  console.error(`Invalid commit index in version: ${version}`);
  process.exit(1);
}

const commitCount = getCommitCount(root);
const allowed = new Set([commitCount, commitCount + 1]);
if (!allowed.has(commitIndex)) {
  console.error(`Version commit index mismatch: found ${commitIndex}, expected ${commitCount} (HEAD) or ${commitCount + 1} (next commit).`);
  process.exit(1);
}

console.log(`OK: version ${version} matches date/version policy.`);
