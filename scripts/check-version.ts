import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

type PackageJsonShape = {
  version?: string;
  [key: string]: unknown;
};

function getGitTags(cwd: string): string[] {
  const output = execSync('git tag --list', { cwd, encoding: 'utf-8' });
  return output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function toUtcDatePart(input: Date): string {
  const year = String(input.getUTCFullYear());
  const month = String(input.getUTCMonth() + 1).padStart(2, '0');
  const day = String(input.getUTCDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
}

function getTodayReleaseCount(cwd: string, todayPart: string): number {
  const tags = getGitTags(cwd);
  let count = 0;

  for (const tag of tags) {
    const normalized = tag.startsWith('v') ? tag.slice(1) : tag;
    const match = /^(\d{4}\.(?:0[1-9]|1[0-2])\.(?:0[1-9]|[12]\d|3[01]))(?:-(\d+))?$/.exec(
      normalized,
    );
    if (!match) {
      continue;
    }

    if (match[1] !== todayPart) {
      continue;
    }

    const suffix = match[2];
    if (!suffix) {
      count = Math.max(count, 1);
      continue;
    }

    const n = Number.parseInt(suffix, 10);
    if (Number.isFinite(n) && n >= 2) {
      count = Math.max(count, n);
    }
  }

  return count;
}

function parseVersion(value: string): { datePart: string; releaseIndex: number; hasSuffix: boolean } | null {
  const VERSION_PATTERN = /^(\d{4}\.(?:0[1-9]|1[0-2])\.(?:0[1-9]|[12]\d|3[01]))(?:-(\d+))?$/;
  const match = VERSION_PATTERN.exec(value);
  if (!match) {
    return null;
  }

  const datePart = match[1];
  const suffix = match[2];
  if (!suffix) {
    return { datePart, releaseIndex: 1, hasSuffix: false };
  }

  const releaseIndex = Number.parseInt(suffix, 10);
  if (!Number.isFinite(releaseIndex) || releaseIndex <= 1) {
    return null;
  }

  return { datePart, releaseIndex, hasSuffix: true };
}

function loadPackageJson(filePath: string): PackageJsonShape {
  return JSON.parse(readFileSync(filePath, 'utf-8')) as PackageJsonShape;
}

const root = process.cwd();
const packagePath = join(root, 'package.json');
const pkg = loadPackageJson(packagePath);
const version = pkg.version;

if (!version || typeof version !== 'string') {
  console.error('Invalid package.json version: missing or not a string.');
  process.exit(1);
}

const parsed = parseVersion(version);
if (!parsed) {
  console.error(`Invalid version format: ${version}`);
  console.error('Expected format: YYYY.MM.DD or YYYY.MM.DD-<N> (N >= 2).');
  process.exit(1);
}

const todayPart = toUtcDatePart(new Date());
if (parsed.datePart !== todayPart) {
  console.error(`Version date mismatch: found ${parsed.datePart}, expected ${todayPart}.`);
  process.exit(1);
}

if (parsed.releaseIndex === 1 && parsed.hasSuffix) {
  console.error('Version release index 1 must not include a suffix. Use YYYY.MM.DD only.');
  process.exit(1);
}

const todayReleaseCount = getTodayReleaseCount(root, todayPart);
const expectedNextReleaseIndex = todayReleaseCount + 1;
if (parsed.releaseIndex !== expectedNextReleaseIndex) {
  console.error(
    `Version daily release index mismatch: found ${parsed.releaseIndex}, expected ${expectedNextReleaseIndex} based on existing tags for ${todayPart}.`,
  );
  process.exit(1);
}

console.log(
  `OK: version ${version} matches release-date policy (today=${todayPart}, prior_releases_today=${todayReleaseCount}).`,
);
