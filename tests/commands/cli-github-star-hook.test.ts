import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createProgram } from '../../src/cli-program.js';

describe('CLI github-star prompt hook', () => {
  const originalEnv = { ...process.env };
  const tempDirs: string[] = [];
  const promptGithubStar = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    promptGithubStar.mockClear();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
    for (const dir of tempDirs.splice(0)) {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('invokes github-star prompt after a normal CLI command action', async () => {
    const configDir = join(tmpdir(), `jellyfin-cli-github-star-hook-${Date.now()}`);
    tempDirs.push(configDir);
    mkdirSync(configDir, { recursive: true });

    process.env.JELLYFIN_CONFIG_DIR = configDir;

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    await createProgram({ promptGithubStar }).parseAsync(['node', 'jf', 'config', 'path', '--format', 'json'], {
      from: 'node',
    });
    logSpy.mockRestore();

    expect(promptGithubStar).toHaveBeenCalledTimes(1);
  });

  it('invokes github-star prompt after setup command actions', async () => {
    const configDir = join(tmpdir(), `jellyfin-cli-github-star-setup-hook-${Date.now()}`);
    tempDirs.push(configDir);
    mkdirSync(configDir, { recursive: true });

    process.env.JELLYFIN_CONFIG_DIR = configDir;

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    await createProgram({ promptGithubStar }).parseAsync(['node', 'jf', 'setup', 'status', '--format', 'json'], {
      from: 'node',
    });
    logSpy.mockRestore();

    expect(promptGithubStar).toHaveBeenCalledTimes(1);
  });
});
