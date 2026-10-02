import { expect, it } from 'vitest';

it.skipIf(process.platform === 'win32')('keeps setup credentials hidden in a real terminal and restores input modes', async () => {
  const runtime = process.versions.bun
    ? [process.execPath, 'src/cli.ts']
    : [process.execPath, '--import', 'tsx', 'src/cli.ts'];
  // Use the repository's Bun/Node subprocess boundary: unrelated Bun tests
  // mock node:child_process.spawnSync globally and must not replace this PTY.
  const child = Bun.spawn(['python3', 'tests/fixtures/setup-terminal.py', ...runtime], {
    stdout: 'pipe',
    stderr: 'pipe',
  });
  const [stdout, stderr, code] = await Promise.all([
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
    child.exited,
  ]);
  expect(stderr).toBe('');
  expect(code).toBe(0);
  expect(stdout).toContain('6 terminal cases passed');
}, 100000);
