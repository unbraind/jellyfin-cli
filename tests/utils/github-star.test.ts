import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock node modules before importing the module under test
vi.mock('node:child_process', () => ({
  spawnSync: vi.fn(),
}));

vi.mock('node:readline', () => ({
  createInterface: vi.fn(),
}));

vi.mock('../../src/utils/config.js', () => ({
  isGithubStarred: vi.fn(),
  markGithubStarred: vi.fn(),
}));

import * as childProcess from 'node:child_process';
import * as readline from 'node:readline';
import * as configModule from '../../src/utils/config.js';
import { promptGithubStar } from '../../src/utils/github-star.js';

const mockSpawn = childProcess.spawnSync as ReturnType<typeof vi.fn>;
const mockCreateInterface = readline.createInterface as ReturnType<typeof vi.fn>;
const mockIsStarred = configModule.isGithubStarred as ReturnType<typeof vi.fn>;
const mockMarkStarred = configModule.markGithubStarred as ReturnType<typeof vi.fn>;

function spawnOk() {
  return { status: 0, error: undefined, stdout: Buffer.from(''), stderr: Buffer.from(''), pid: 1, signal: null, output: [] };
}

function spawnFail() {
  return { status: 1, error: undefined, stdout: Buffer.from(''), stderr: Buffer.from(''), pid: 1, signal: null, output: [] };
}

function mockRlYes() {
  const rl = { question: vi.fn(), close: vi.fn() };
  rl.question.mockImplementation((_q: string, cb: (a: string) => void) => cb('y'));
  mockCreateInterface.mockReturnValue(rl);
  return rl;
}

function mockRlNo() {
  const rl = { question: vi.fn(), close: vi.fn() };
  rl.question.mockImplementation((_q: string, cb: (a: string) => void) => cb('n'));
  mockCreateInterface.mockReturnValue(rl);
  return rl;
}

describe('promptGithubStar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(process.stdin, 'isTTY', { value: true, configurable: true });
    Object.defineProperty(process.stdout, 'isTTY', { value: true, configurable: true });
  });

  afterEach(() => {
    Object.defineProperty(process.stdin, 'isTTY', { value: true, configurable: true });
    Object.defineProperty(process.stdout, 'isTTY', { value: true, configurable: true });
  });

  it('should skip when stdin is not a TTY', async () => {
    Object.defineProperty(process.stdin, 'isTTY', { value: false, configurable: true });
    await promptGithubStar();
    expect(mockSpawn).not.toHaveBeenCalled();
  });

  it('should skip when stdout is not a TTY', async () => {
    Object.defineProperty(process.stdout, 'isTTY', { value: false, configurable: true });
    await promptGithubStar();
    expect(mockSpawn).not.toHaveBeenCalled();
  });

  it('should skip and not call gh when already starred (cached)', async () => {
    mockIsStarred.mockReturnValue(true);
    await promptGithubStar();
    expect(mockSpawn).not.toHaveBeenCalled();
  });

  it('should skip when gh is not available', async () => {
    mockIsStarred.mockReturnValue(false);
    mockSpawn.mockReturnValue({ status: 1, error: new Error('not found') });
    await promptGithubStar();
    expect(mockMarkStarred).not.toHaveBeenCalled();
  });

  it('should skip when gh is not logged in', async () => {
    mockIsStarred.mockReturnValue(false);
    mockSpawn
      .mockReturnValueOnce(spawnOk())   // gh --version
      .mockReturnValueOnce(spawnFail()); // gh auth status
    await promptGithubStar();
    expect(mockMarkStarred).not.toHaveBeenCalled();
  });

  it('should mark as starred and skip prompt when already starred via API', async () => {
    mockIsStarred.mockReturnValue(false);
    mockSpawn
      .mockReturnValueOnce(spawnOk())  // gh --version
      .mockReturnValueOnce(spawnOk())  // gh auth status
      .mockReturnValueOnce(spawnOk()); // GET user/starred/... → 204 = already starred
    await promptGithubStar();
    expect(mockMarkStarred).toHaveBeenCalled();
    expect(mockCreateInterface).not.toHaveBeenCalled();
  });

  it('should star repo when user answers y', async () => {
    mockIsStarred.mockReturnValue(false);
    mockSpawn
      .mockReturnValueOnce(spawnOk())   // gh --version
      .mockReturnValueOnce(spawnOk())   // gh auth status
      .mockReturnValueOnce(spawnFail()) // not starred
      .mockReturnValueOnce(spawnOk());  // PUT star succeeds
    mockRlYes();

    await promptGithubStar();
    expect(mockMarkStarred).toHaveBeenCalled();
  });

  it('should star repo when user presses Enter (empty = yes)', async () => {
    mockIsStarred.mockReturnValue(false);
    mockSpawn
      .mockReturnValueOnce(spawnOk())
      .mockReturnValueOnce(spawnOk())
      .mockReturnValueOnce(spawnFail())
      .mockReturnValueOnce(spawnOk());
    const rl = { question: vi.fn(), close: vi.fn() };
    rl.question.mockImplementation((_q: string, cb: (a: string) => void) => cb(''));
    mockCreateInterface.mockReturnValue(rl);

    await promptGithubStar();
    expect(mockMarkStarred).toHaveBeenCalled();
  });

  it('should not star repo when user answers n', async () => {
    mockIsStarred.mockReturnValue(false);
    mockSpawn
      .mockReturnValueOnce(spawnOk())
      .mockReturnValueOnce(spawnOk())
      .mockReturnValueOnce(spawnFail());
    mockRlNo();

    await promptGithubStar();
    expect(mockMarkStarred).not.toHaveBeenCalled();
    const putCalls = mockSpawn.mock.calls.filter((c: unknown[]) => Array.isArray(c[1]) && (c[1] as string[]).includes('--method'));
    expect(putCalls).toHaveLength(0);
  });

  it('should not throw when star API call fails', async () => {
    mockIsStarred.mockReturnValue(false);
    mockSpawn
      .mockReturnValueOnce(spawnOk())
      .mockReturnValueOnce(spawnOk())
      .mockReturnValueOnce(spawnFail())
      .mockReturnValueOnce(spawnFail()); // PUT fails
    mockRlYes();

    await expect(promptGithubStar()).resolves.toBeUndefined();
    expect(mockMarkStarred).not.toHaveBeenCalled();
  });
});
