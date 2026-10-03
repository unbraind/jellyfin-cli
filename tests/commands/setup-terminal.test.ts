import { expect, it } from 'vitest';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';

it.skipIf(process.platform === 'win32')('keeps setup credentials hidden in a real terminal and restores input modes', async () => {
  const runtime = process.versions.bun
    ? [process.execPath, 'src/cli.ts']
    : [process.execPath, '--import', 'tsx', 'src/cli.ts'];
  const hostBin = mkdtempSync(join(tmpdir(), 'jf-terminal-host-gh-'));
  const ghCalls = join(hostBin, 'calls');
  try {
    // Reproduce release CI: gh is authenticated, but the repo is not starred.
    // The fixture must shadow this command rather than waiting at the star
    // prompt, calling GitHub, or using any real host credentials.
    writeFileSync(join(hostBin, 'gh'), [
      '#!/bin/sh',
      'printf "called\\n" >> "$SETUP_TERMINAL_GH_LOG"',
      'case "$*" in',
      '  --version|"auth status") exit 0 ;;',
      '  *) exit 1 ;;',
      'esac',
      '',
    ].join('\n'), { mode: 0o755 });
    // Use the repository's Bun/Node subprocess boundary: unrelated Bun tests
    // mock node:child_process.spawnSync globally and must not replace this PTY.
    const child = Bun.spawn(['python3', 'tests/fixtures/setup-terminal.py', ...runtime], {
      env: {
        ...process.env,
        PATH: `${hostBin}${delimiter}${process.env.PATH ?? ''}`,
        GH_TOKEN: 'synthetic-github-token',
        SETUP_TERMINAL_GH_LOG: ghCalls,
      },
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
    expect(existsSync(ghCalls)).toBe(false);
  } finally {
    rmSync(hostBin, { recursive: true, force: true });
  }
}, 100000);
