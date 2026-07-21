#!/usr/bin/env node

import { Buffer } from 'node:buffer';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { extractReleaseSection } from './generate-release-notes.mjs';
import { isReleaseRelevantPath } from './release-relevance.mjs';
import { parseCalendarVersion } from '../release-version.mjs';
import {
  commandFor,
  flagBool,
  flagString,
  parseFlags,
  repoRoot,
  runCommand,
  utcDateKey,
} from './utils.mjs';

const releasePushToken = process.env.RELEASE_PUSH_TOKEN?.trim() ?? '';
delete process.env.RELEASE_PUSH_TOKEN;

function git(args, options = {}) {
  return runCommand('git', args, { capture: true, ...options });
}

export function getLastTag() {
  const result = git(['describe', '--tags', '--abbrev=0'], { allowFailure: true });
  return result.status === 0 && result.stdout.trim() ? result.stdout.trim() : null;
}

export function getCommitCountSince(lastTag) {
  const range = lastTag ? `${lastTag}..HEAD` : 'HEAD';
  return Number(git(['rev-list', '--count', range]).stdout.trim() || '0');
}

export function getChangedFilesSince(lastTag) {
  const result = lastTag ? git(['diff', '--name-only', `${lastTag}..HEAD`]) : git(['ls-files']);
  return result.stdout.split(/\r?\n/).map((entry) => entry.trim()).filter(Boolean);
}

export function listTodayTags(dateKey) {
  return git(['tag', '--list', `v${dateKey}*`]).stdout.split(/\r?\n/).map((entry) => entry.trim()).filter(Boolean);
}

export function releaseDecision({ commitsSinceLastTag, lastTag, changedFiles, tagsToday, allowSameDayRelease = false }) {
  if (commitsSinceLastTag === 0) return { release: false, reason: 'no_changes_since_last_tag', last_tag: lastTag };
  const relevant = changedFiles.filter(isReleaseRelevantPath);
  if (relevant.length === 0) {
    return {
      release: false,
      reason: 'tracker_only_changes_since_last_tag',
      last_tag: lastTag,
      ignored_change_paths: changedFiles,
    };
  }
  if (!allowSameDayRelease && tagsToday.length > 0) {
    return { release: false, reason: 'release_already_cut_today', tags_today: tagsToday };
  }
  return { release: true, release_relevant_files: relevant };
}

function ensureCleanWorkingTree() {
  if (git(['status', '--porcelain']).stdout.trim()) throw new Error('Release pipeline requires a clean working tree.');
}

function readPackageVersion() {
  return JSON.parse(readFileSync(path.join(repoRoot, 'package.json'), 'utf8')).version;
}

function runPm(args) {
  return runCommand(commandFor('npm'), ['exec', '--yes', '--package', '@unbrained/pm-cli@latest', '--', 'pm', ...args]);
}

function prepareReleaseChangelog(targetVersion) {
  const temporaryDirectory = mkdtempSync(path.join(tmpdir(), 'jellyfin-cli-release-'));
  const generatedPath = path.join(temporaryDirectory, 'CHANGELOG.md');
  try {
    runPm(['install', 'npm:pm-changelog', '--project']);
    runPm([
      'changelog', 'generate', '--output', generatedPath, '--title', 'Changelog', '--mode', 'replace',
      '--release-version', targetVersion, '--all-release-tags', '--status', 'closed',
      '--item-url-base', 'https://github.com/unbraind/jellyfin-cli/blob/main/.agents/pm',
    ]);
    const generated = readFileSync(generatedPath, 'utf8');
    if (!extractReleaseSection(generated, targetVersion)) return false;
    runCommand(commandFor('npm'), ['version', '--no-git-tag-version', targetVersion]);
    writeFileSync(path.join(repoRoot, 'CHANGELOG.md'), generated, 'utf8');
    return true;
  } finally {
    rmSync(temporaryDirectory, { recursive: true, force: true });
  }
}

export function withPushCredentials(options = {}, token = releasePushToken) {
  if (!token) return options;
  const baseEnv = options.env ?? {};
  const count = Number.parseInt(baseEnv.GIT_CONFIG_COUNT ?? '0', 10) || 0;
  const authHeader = `Authorization: Basic ${Buffer.from(`x-access-token:${token}`, 'utf8').toString('base64')}`;
  return {
    ...options,
    env: {
      ...baseEnv,
      GIT_CONFIG_COUNT: String(count + 1),
      [`GIT_CONFIG_KEY_${count}`]: 'http.https://github.com/.extraheader',
      [`GIT_CONFIG_VALUE_${count}`]: authHeader,
    },
  };
}

function pushRelease(tagName, gitEnv) {
  const result = git(['push', '--atomic', 'origin', 'HEAD', tagName], {
    ...withPushCredentials({ env: gitEnv }),
    allowFailure: true,
  });
  if (result.status !== 0) throw new Error(`Atomic release push failed:\n${result.stderr.trim()}`);
}

function commitRelease(version, tagName, author, push) {
  const authorSlug = author.toLowerCase().replaceAll(/[^a-z0-9._-]/g, '-') || 'release-bot';
  const gitEnv = {
    GIT_AUTHOR_NAME: author,
    GIT_AUTHOR_EMAIL: `${authorSlug}@users.noreply.github.com`,
    GIT_COMMITTER_NAME: author,
    GIT_COMMITTER_EMAIL: `${authorSlug}@users.noreply.github.com`,
  };
  git(['add', 'package.json', 'package-lock.json', 'CHANGELOG.md', '.agents/pm/extensions/.managed-extensions.json']);
  runCommand('git', ['commit', '-m', `chore(release): cut ${version}`], { env: gitEnv });
  git(['tag', tagName]);
  if (push) pushRelease(tagName, gitEnv);
}

export function usage() {
  console.log(`Usage: node scripts/release/run-release-pipeline.mjs [--dry-run] [--push] [--json]
  [--version YYYY.M.D[-N]] [--allow-same-day-release] [--author name]

Detects release-relevant changes after the latest tag, generates CHANGELOG.md
from closed pm items with pm-changelog, runs release validation, and creates an
atomic release commit/tag. .agents/pm-only commits do not trigger publishing.`);
}

export function runPipeline(argv = process.argv.slice(2)) {
  const flags = parseFlags(argv);
  if (flags.has('help') || flags.has('h')) return usage();
  const outputJson = flagBool(flags, 'json');
  const dryRun = flagBool(flags, 'dry-run');
  const push = flagBool(flags, 'push');
  const allowSameDayRelease = flagBool(flags, 'allow-same-day-release');
  const author = flagString(flags, 'author', 'github-actions[bot]');
  const explicitVersion = flagString(flags, 'version');
  if (dryRun && push) throw new Error('--dry-run and --push cannot be combined');

  ensureCleanWorkingTree();
  const lastTag = getLastTag();
  const commitsSinceLastTag = getCommitCountSince(lastTag);
  const changedFiles = getChangedFilesSince(lastTag);
  const dateKey = utcDateKey();
  const decision = releaseDecision({
    commitsSinceLastTag,
    lastTag,
    changedFiles,
    tagsToday: listTodayTags(dateKey),
    allowSameDayRelease,
  });
  if (!decision.release) {
    const result = { ok: true, skipped: true, ...decision };
    console.log(outputJson ? JSON.stringify(result, null, 2) : `Release skipped: ${decision.reason}`);
    return result;
  }

  const previousVersion = readPackageVersion();
  const targetVersion = explicitVersion ?? runCommand(process.execPath, ['scripts/release-version.mjs', 'next'], { capture: true }).stdout.trim();
  if (!targetVersion || !parseCalendarVersion(targetVersion)) throw new Error(`Unable to resolve a valid next release version: ${targetVersion || '(empty)'}.`);
  if (!dryRun && !prepareReleaseChangelog(targetVersion)) {
    const result = { ok: true, skipped: true, reason: 'empty_generated_changelog_section_for_target_version', target_version: targetVersion };
    console.log(outputJson ? JSON.stringify(result, null, 2) : `Release skipped: ${result.reason}`);
    return result;
  }

  runCommand(commandFor('bun'), ['run', 'validate:release']);
  const notesPath = path.join(tmpdir(), `jellyfin-cli-${targetVersion}-release-notes.md`);
  if (!dryRun) runCommand(process.execPath, ['scripts/release/generate-release-notes.mjs', '--version', targetVersion, '--output', notesPath]);
  const tagName = `v${targetVersion}`;
  if (!dryRun) commitRelease(targetVersion, tagName, author, push);

  const result = {
    ok: true,
    skipped: false,
    dry_run: dryRun,
    pushed: push && !dryRun,
    previous_version: previousVersion,
    target_version: targetVersion,
    tag: tagName,
    last_tag: lastTag,
    commits_since_last_tag: commitsSinceLastTag,
    release_relevant_files: decision.release_relevant_files,
    release_notes_output: notesPath,
  };
  console.log(outputJson ? JSON.stringify(result, null, 2) : `Release pipeline completed for ${targetVersion}${dryRun ? ' (dry run)' : ''}.`);
  return result;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { runPipeline(); } catch (error) { console.error(error instanceof Error ? error.message : String(error)); process.exit(1); }
}
