#!/usr/bin/env node

import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

const smokeDirectory = mkdtempSync(join(tmpdir(), 'jellyfin-cli-bunx-'));
const cacheDirectory = mkdtempSync(join(tmpdir(), 'jellyfin-cli-bun-cache-'));

try {
  const packed = spawnSync(
    'npm',
    ['pack', '--silent', '--pack-destination', smokeDirectory],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] },
  );
  if (packed.status !== 0) {
    process.exitCode = packed.status ?? 1;
  } else {
    const packageName = packed.stdout.trim().split(/\r?\n/).at(-1);
    if (!packageName) {
      throw new Error('npm pack did not report the generated tarball name.');
    }
    const smoke = spawnSync(
      'bunx',
      [
        '--bun',
        '--package',
        pathToFileURL(join(smokeDirectory, packageName)).href,
        'jellyfin-cli',
        '--version',
      ],
      {
        env: { ...process.env, BUN_INSTALL_CACHE_DIR: cacheDirectory },
        stdio: 'inherit',
      },
    );
    process.exitCode = smoke.status ?? 1;
  }
} finally {
  rmSync(smokeDirectory, { recursive: true, force: true });
  rmSync(cacheDirectory, { recursive: true, force: true });
}
