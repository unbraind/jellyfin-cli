import { expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

it.skipIf(process.platform === 'win32')('keeps setup credentials hidden in a real terminal and restores input modes', () => {
  const root = resolve(import.meta.dirname, '../..');
  const runtime = process.versions.bun
    ? [process.execPath, 'src/cli.ts']
    : [process.execPath, '--import', 'tsx', 'src/cli.ts'];
  const result = spawnSync('python3', ['tests/fixtures/setup-terminal.py', ...runtime], {
    cwd: root,
    encoding: 'utf8',
    timeout: 90000,
  });
  expect(result.error).toBeUndefined();
  expect(result.stderr).toBe('');
  expect(result.status).toBe(0);
  expect(result.stdout).toContain('6 terminal cases passed');
}, 100000);
