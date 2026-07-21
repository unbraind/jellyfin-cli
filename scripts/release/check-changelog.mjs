#!/usr/bin/env node

import { pathToFileURL } from 'node:url';
import { parseCalendarVersion } from '../release-version.mjs';
import { ensurePmChangelog } from './ensure-pm-changelog.mjs';
import { commandFor, pmCliPackage, runCommand } from './utils.mjs';

export function changelogCheckArgs(releaseVersion = '') {
  if (releaseVersion && !parseCalendarVersion(releaseVersion)) {
    throw new Error(`Invalid PM_CHANGELOG_RELEASE_VERSION: ${releaseVersion}`);
  }
  const args = [
    'exec', '--yes', '--package', pmCliPackage, '--', 'pm', 'changelog', 'generate',
    '--output', 'CHANGELOG.md', '--title', 'Changelog', '--mode', 'replace',
    '--all-release-tags', '--status', 'closed',
    '--item-url-base', 'https://github.com/unbraind/jellyfin-cli/blob/main/.agents/pm',
  ];
  if (releaseVersion) args.push('--release-version', releaseVersion);
  args.push('--check');
  return args;
}

export function checkChangelog(releaseVersion = process.env.PM_CHANGELOG_RELEASE_VERSION?.trim() ?? '') {
  ensurePmChangelog();
  return runCommand(commandFor('npm'), changelogCheckArgs(releaseVersion));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    checkChangelog();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
