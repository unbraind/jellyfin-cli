import assert from 'node:assert/strict';
import test from 'node:test';
import { extractReleaseSection } from './generate-release-notes.mjs';
import { isReleaseRelevantPath } from './release-relevance.mjs';
import { isTagForDate, releaseDecision } from './run-release-pipeline.mjs';
import { runCommand } from './utils.mjs';
import { parsePublishedVersion } from './verify-published-release.mjs';
import { nextVersionForDate, parseCalendarVersion } from '../release-version.mjs';

test('calendar versions validate real dates and ordinal suffixes', () => {
  assert.deepEqual(parseCalendarVersion('2026.7.21'), { dateKey: '2026.7.21', ordinal: 1 });
  assert.deepEqual(parseCalendarVersion('2026.7.21-3'), { dateKey: '2026.7.21', ordinal: 3 });
  assert.equal(parseCalendarVersion('2026.2.30'), null);
  assert.equal(parseCalendarVersion('2026.7.21-1'), null);
});

test('next version uses the highest published same-day ordinal', () => {
  assert.equal(nextVersionForDate(['2026.7.20', '2026.7.21', '2026.7.21-3'], '2026.7.21'), '2026.7.21-4');
  assert.equal(nextVersionForDate([], '2026.7.21'), '2026.7.21');
});

test('tracker-only changes never trigger a package release', () => {
  assert.equal(isReleaseRelevantPath('.agents/pm/features/jf-test.toon'), false);
  assert.equal(isReleaseRelevantPath('src/cli.ts'), true);
  assert.equal(releaseDecision({ commitsSinceLastTag: 1, lastTag: 'v1', changedFiles: ['.agents/pm/x'], tagsToday: [] }).reason, 'tracker_only_changes_since_last_tag');
});

test('release decisions enforce changes and one release per UTC day', () => {
  assert.equal(releaseDecision({ commitsSinceLastTag: 0, lastTag: 'v1', changedFiles: [], tagsToday: [] }).reason, 'no_changes_since_last_tag');
  assert.equal(releaseDecision({ commitsSinceLastTag: 1, lastTag: 'v1', changedFiles: ['src/cli.ts'], tagsToday: ['v2026.7.21'] }).reason, 'release_already_cut_today');
  assert.equal(releaseDecision({ commitsSinceLastTag: 1, lastTag: 'v1', changedFiles: ['src/cli.ts'], tagsToday: [] }).release, true);
});

test('same-day tag matching does not confuse short dates with later days', () => {
  assert.equal(isTagForDate('v2026.7.1', '2026.7.1'), true);
  assert.equal(isTagForDate('v2026.7.1-2', '2026.7.1'), true);
  assert.equal(isTagForDate('v2026.7.10', '2026.7.1'), false);
  assert.equal(isTagForDate('v2026.7.19-2', '2026.7.1'), false);
});

test('published version parsing lets transient invalid JSON be retried', () => {
  assert.equal(parsePublishedVersion('"2026.7.21"'), '2026.7.21');
  assert.equal(parsePublishedVersion('temporarily unavailable'), null);
  assert.equal(parsePublishedVersion('{"version":"2026.7.21"}'), null);
});

test('process start failures retain their operating-system error', () => {
  assert.throws(
    () => runCommand('__missing_jellyfin_cli_test_binary__', [], { capture: true }),
    /Command failed to start:.*(?:ENOENT|not found)/s,
  );
});

test('release notes select exactly one changelog version', () => {
  const markdown = '# Changelog\n\n## 2026.7.21 - 2026-07-21\n\n### Added\n\n- New\n\n## 2026.7.20\n\n- Old\n';
  assert.equal(extractReleaseSection(markdown, '2026.7.21'), '## 2026.7.21 - 2026-07-21\n\n### Added\n\n- New');
});
