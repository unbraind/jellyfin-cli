import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('node:child_process', () => ({
  spawnSync: vi.fn(),
}));

vi.mock('node:readline', () => ({
  createInterface: vi.fn(),
}));

vi.mock('../../src/utils/config.js', () => ({
  isGithubStarred: vi.fn(),
  markGithubStarred: vi.fn(),
  isGithubStarPrompted: vi.fn(),
  markGithubStarPrompted: vi.fn(),
}));

import * as childProcess from 'node:child_process';
import * as readline from 'node:readline';
import * as configModule from '../../src/utils/config.js';
import { promptGithubStar } from '../../src/utils/github-star.js';

const mockSpawn = childProcess.spawnSync as ReturnType<typeof vi.fn>;
const mockCreateInterface = readline.createInterface as ReturnType<typeof vi.fn>;
const mockIsStarred = configModule.isGithubStarred as ReturnType<typeof vi.fn>;
const mockMarkStarred = configModule.markGithubStarred as ReturnType<typeof vi.fn>;
const mockIsPrompted = configModule.isGithubStarPrompted as ReturnType<typeof vi.fn>;
const mockMarkPrompted = configModule.markGithubStarPrompted as ReturnType<typeof vi.fn>;

function spawnOk() {
  return {
    status: 0,
    error: undefined,
    stdout: Buffer.from(''),
    stderr: Buffer.from(''),
    pid: 1,
    signal: null,
    output: [],
  };
}

function spawnFail() {
  return {
    status: 1,
    error: undefined,
    stdout: Buffer.from(''),
    stderr: Buffer.from(''),
    pid: 1,
    signal: null,
    output: [],
  };
}

function mockRl(answer: string) {
  const rl = { question: vi.fn(), close: vi.fn() };
  rl.question.mockImplementation((_q: string, cb: (a: string) => void) => cb(answer));
  mockCreateInterface.mockReturnValue(rl);
  return rl;
}

describe('promptGithubStar', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockIsStarred.mockReturnValue(false);
    mockIsPrompted.mockReturnValue(false);
    Object.defineProperty(process.stdin, 'isTTY', { value: true, configurable: true });
    Object.defineProperty(process.stdout, 'isTTY', { value: true, configurable: true });
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    logSpy.mockRestore();
    Object.defineProperty(process.stdin, 'isTTY', { value: true, configurable: true });
    Object.defineProperty(process.stdout, 'isTTY', { value: true, configurable: true });
  });

  it('skips when stdin is not a TTY', async () => {
    Object.defineProperty(process.stdin, 'isTTY', { value: false, configurable: true });
    await promptGithubStar();
    expect(mockSpawn).not.toHaveBeenCalled();
    expect(mockMarkPrompted).not.toHaveBeenCalled();
  });

  it('skips when stdout is not a TTY', async () => {
    Object.defineProperty(process.stdout, 'isTTY', { value: false, configurable: true });
    await promptGithubStar();
    expect(mockSpawn).not.toHaveBeenCalled();
    expect(mockMarkPrompted).not.toHaveBeenCalled();
  });

  it('skips when already starred in local cache', async () => {
    mockIsStarred.mockReturnValue(true);
    await promptGithubStar();
    expect(mockSpawn).not.toHaveBeenCalled();
  });

  it('skips when prompt was already handled in local cache', async () => {
    mockIsPrompted.mockReturnValue(true);
    await promptGithubStar();
    expect(mockSpawn).not.toHaveBeenCalled();
  });

  it('prints repo link and caches prompt when gh is not installed', async () => {
    mockSpawn.mockReturnValue({ status: 1, error: new Error('not found') });

    await promptGithubStar();

    expect(mockMarkStarred).not.toHaveBeenCalled();
    expect(mockMarkPrompted).toHaveBeenCalledTimes(1);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('https://github.com/unbraind/jellyfin-cli'));
  });

  it('prints repo link and caches prompt when gh is not authenticated', async () => {
    mockSpawn
      .mockReturnValueOnce(spawnOk())
      .mockReturnValueOnce(spawnFail());

    await promptGithubStar();

    expect(mockMarkStarred).not.toHaveBeenCalled();
    expect(mockMarkPrompted).toHaveBeenCalledTimes(1);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('https://github.com/unbraind/jellyfin-cli'));
  });

  it('marks both starred and prompted cache when repo is already starred via API', async () => {
    mockSpawn
      .mockReturnValueOnce(spawnOk())
      .mockReturnValueOnce(spawnOk())
      .mockReturnValueOnce(spawnOk());

    await promptGithubStar();

    expect(mockMarkStarred).toHaveBeenCalledTimes(1);
    expect(mockMarkPrompted).toHaveBeenCalledTimes(1);
    expect(mockCreateInterface).not.toHaveBeenCalled();
  });

  it('stars repo and caches when user answers yes', async () => {
    mockSpawn
      .mockReturnValueOnce(spawnOk())
      .mockReturnValueOnce(spawnOk())
      .mockReturnValueOnce(spawnFail())
      .mockReturnValueOnce(spawnOk());
    mockRl('y');

    await promptGithubStar();

    expect(mockMarkStarred).toHaveBeenCalledTimes(1);
    expect(mockMarkPrompted).toHaveBeenCalledTimes(1);
    expect(mockSpawn).toHaveBeenCalledWith('gh', ['api', '--method', 'PUT', 'user/starred/unbraind/jellyfin-cli'], expect.any(Object));
  });

  it('treats Enter as yes and stars repo', async () => {
    mockSpawn
      .mockReturnValueOnce(spawnOk())
      .mockReturnValueOnce(spawnOk())
      .mockReturnValueOnce(spawnFail())
      .mockReturnValueOnce(spawnOk());
    mockRl('');

    await promptGithubStar();

    expect(mockMarkStarred).toHaveBeenCalledTimes(1);
    expect(mockMarkPrompted).toHaveBeenCalledTimes(1);
  });

  it('does not star when user answers no and still caches prompt', async () => {
    mockSpawn
      .mockReturnValueOnce(spawnOk())
      .mockReturnValueOnce(spawnOk())
      .mockReturnValueOnce(spawnFail());
    mockRl('n');

    await promptGithubStar();

    expect(mockMarkStarred).not.toHaveBeenCalled();
    expect(mockMarkPrompted).toHaveBeenCalledTimes(1);
    const putCalls = mockSpawn.mock.calls.filter(
      (call: unknown[]) => Array.isArray(call[1]) && (call[1] as string[]).includes('--method'),
    );
    expect(putCalls).toHaveLength(0);
  });

  it('prints manual link and caches prompt when star API call fails', async () => {
    mockSpawn
      .mockReturnValueOnce(spawnOk())
      .mockReturnValueOnce(spawnOk())
      .mockReturnValueOnce(spawnFail())
      .mockReturnValueOnce(spawnFail());
    mockRl('y');

    await expect(promptGithubStar()).resolves.toBeUndefined();

    expect(mockMarkStarred).not.toHaveBeenCalled();
    expect(mockMarkPrompted).toHaveBeenCalledTimes(1);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('https://github.com/unbraind/jellyfin-cli'));
  });

  it('uses cached prompt state to avoid repeated gh checks', async () => {
    let prompted = false;
    mockIsPrompted.mockImplementation(() => prompted);
    mockMarkPrompted.mockImplementation(() => {
      prompted = true;
    });
    mockSpawn.mockReturnValue({ status: 1, error: new Error('not found') });

    await promptGithubStar();
    await promptGithubStar();

    expect(mockSpawn).toHaveBeenCalledTimes(1);
    expect(mockMarkPrompted).toHaveBeenCalledTimes(1);
  });
});
