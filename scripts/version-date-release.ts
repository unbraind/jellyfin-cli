import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
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

function toUtcDatePart(date: Date): string {
  const year = String(date.getUTCFullYear());
  const month = String(date.getUTCMonth() + 1);
  const day = String(date.getUTCDate());
  return `${year}.${month}.${day}`;
}

function getTodayReleaseCount(cwd: string, todayPart: string): number {
  const tags = getGitTags(cwd);
  let count = 0;

  for (const tag of tags) {
    const normalized = tag.startsWith('v') ? tag.slice(1) : tag;
    const match = /^(\d{4}\.(?:[1-9]|1[0-2])\.(?:[1-9]|[12]\d|3[01]))(?:-(\d+))?$/.exec(
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

function loadPackageJson(filePath: string): PackageJsonShape {
  return JSON.parse(readFileSync(filePath, 'utf-8')) as PackageJsonShape;
}

function savePackageJson(filePath: string, value: PackageJsonShape): void {
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf-8');
}

const root = process.cwd();
const packagePath = join(root, 'package.json');
const datePart = toUtcDatePart(new Date());
const todayReleaseCount = getTodayReleaseCount(root, datePart);
const nextReleaseIndex = todayReleaseCount + 1;
const version = nextReleaseIndex === 1 ? datePart : `${datePart}-${nextReleaseIndex}`;

const pkg = loadPackageJson(packagePath);
pkg.version = version;
savePackageJson(packagePath, pkg);

console.log(
  `Set package.json version to ${version} (date=${datePart}, prior_releases_today=${todayReleaseCount}, next_daily_release_index=${nextReleaseIndex}).`,
);
