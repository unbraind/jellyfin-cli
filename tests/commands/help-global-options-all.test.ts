import { describe, expect, it } from 'vitest';

const cliCommand = ['bun', 'run', 'src/cli.ts'];
const isolatedJellyfinEnv: Record<string, string> = {
  JELLYFIN_SERVER_URL: '',
  JELLYFIN_API_KEY: '',
  JELLYFIN_USERNAME: '',
  JELLYFIN_PASSWORD: '',
  JELLYFIN_USER_ID: '',
  JELLYFIN_TIMEOUT: '',
  JELLYFIN_OUTPUT_FORMAT: '',
  JELLYFIN_READ_ONLY: '',
  JELLYFIN_EXPLAIN: '',
};

async function runCli(args: string[]): Promise<{ code: number; stdout: string; stderr: string }> {
  const proc = Bun.spawn([...cliCommand, ...args], {
    env: {
      ...process.env,
      ...isolatedJellyfinEnv,
    },
    stdout: 'pipe',
    stderr: 'pipe',
  });

  const [stdout, stderr, code] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);

  return { code, stdout, stderr };
}

function parseTopLevelCommands(helpOutput: string): string[] {
  const match = helpOutput.match(/Commands:\n([\s\S]*)$/);
  if (!match) {
    return [];
  }
  const commands: string[] = [];
  for (const line of match[1].split('\n')) {
    const commandMatch = line.match(/^\s{2}([a-z][a-z0-9-]*)(?:\s|$)/i);
    if (!commandMatch) {
      continue;
    }
    const name = commandMatch[1];
    if (name === 'help') {
      continue;
    }
    commands.push(name);
  }
  return Array.from(new Set(commands));
}

describe('help output global options (all top-level commands)', () => {
  it('shows global options for every top-level command help surface', async () => {
    const rootHelp = await runCli(['--help']);
    expect(rootHelp.code).toBe(0);

    const commands = parseTopLevelCommands(rootHelp.stdout);
    expect(commands.length).toBeGreaterThan(0);

    for (const command of commands) {
      const result = await runCli([command, '--help']);
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('Global Options:');
      expect(result.stdout).toContain('--format <format>');
      expect(result.stdout).toContain('--server <name>');
      expect(result.stdout).toContain('--explain');
      expect(result.stdout).toContain('--read-only');
    }
  }, 60000);
});
