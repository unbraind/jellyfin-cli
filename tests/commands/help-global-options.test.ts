import { describe, expect, it } from 'vitest';
import { runCliInProcess } from '../utils/run-cli-in-process.js';

async function runCli(args: string[]): Promise<{ code: number; stdout: string; stderr: string }> {
  return runCliInProcess(args, {
    JELLYFIN_SERVER_URL: '',
    JELLYFIN_API_KEY: '',
    JELLYFIN_USERNAME: '',
    JELLYFIN_PASSWORD: '',
    JELLYFIN_USER_ID: '',
    JELLYFIN_TIMEOUT: '',
    JELLYFIN_OUTPUT_FORMAT: '',
    JELLYFIN_READ_ONLY: '',
    JELLYFIN_EXPLAIN: '',
  });
}

describe('help output global options', () => {
  it('shows global options for command help', async () => {
    const result = await runCli(['system', '--help']);
    expect(result.code).toBe(0);
    expect(result.stdout).toContain('Global Options:');
    expect(result.stdout).toContain('--format <format>');
    expect(result.stdout).toContain('--server <name>');
    expect(result.stdout).toContain('--explain');
    expect(result.stdout).toContain('--read-only');
    expect(result.stdout.match(/--format <format>/g)).toHaveLength(1);
  });

  it('shows global options for nested subcommand help', async () => {
    const result = await runCli(['system', 'info', '--help']);
    expect(result.code).toBe(0);
    expect(result.stdout).toContain('Global Options:');
    expect(result.stdout).toContain('--format <format>');
    expect(result.stdout).toContain('--server <name>');
    expect(result.stdout.match(/--format <format>/g)).toHaveLength(1);
  });
});
