import { format } from 'node:util';
import { createProgram } from '../../src/cli-program.js';

export interface CliRunResult {
  code: number;
  stderr: string;
  stdout: string;
}

let queue = Promise.resolve();

/**
 * Executes the production Commander tree inside a Vitest worker.
 *
 * The queue preserves process-level stdout, stderr, environment, and exit semantics when a test
 * starts several format variants concurrently. Bun-native and packaged-binary suites remain the
 * black-box acceptance boundary; this adapter makes the same command behavior attributable to
 * the four-metric Node coverage report.
 *
 * @param args - CLI arguments after the executable name.
 * @param environment - Environment overrides applied for this invocation only.
 * @returns Captured process-style exit code and output streams.
 */
export async function runCliInProcess(
  args: string[],
  environment: Record<string, string | undefined> = {},
): Promise<CliRunResult> {
  if (process.env.VITEST !== 'true') {
    const childEnvironment = { ...process.env, ...environment };
    for (const [key, value] of Object.entries(childEnvironment)) {
      if (value === undefined) delete childEnvironment[key];
    }
    const child = Bun.spawn(['bun', 'run', 'src/cli.ts', ...args], {
      env: childEnvironment,
      stdout: 'pipe',
      stderr: 'pipe',
    });
    const [stdout, stderr, code] = await Promise.all([
      new Response(child.stdout).text(),
      new Response(child.stderr).text(),
      child.exited,
    ]);
    return { code, stdout, stderr };
  }

  const result = queue.then(async () => {
    let stdout = '';
    let stderr = '';
    let code: number;
    const previousExitCode = process.exitCode;
    const previousConsoleLog = console.log;
    const previousConsoleError = console.error;
    const previousStdoutWrite = process.stdout.write;
    const previousStderrWrite = process.stderr.write;
    const previousExit = process.exit;
    const changedEnvironment = new Map<string, string | undefined>();

    for (const [key, value] of Object.entries(environment)) {
      if (process.env[key] === value) continue;
      changedEnvironment.set(key, process.env[key]);
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }

    console.log = (...values: unknown[]) => { stdout += `${format(...values)}\n`; };
    console.error = (...values: unknown[]) => { stderr += `${format(...values)}\n`; };
    process.stdout.write = ((chunk: string | Uint8Array) => {
      stdout += typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString();
      return true;
    }) as typeof process.stdout.write;
    process.stderr.write = ((chunk: string | Uint8Array) => {
      stderr += typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString();
      return true;
    }) as typeof process.stderr.write;
    process.exit = ((exitCode?: number | string | null): never => {
      throw Object.assign(new Error('CLI requested process exit'), {
        cliExit: true,
        exitCode: Number(exitCode ?? 0),
      });
    }) as typeof process.exit;
    process.exitCode = undefined;

    try {
      const program = createProgram({ promptGithubStar: () => undefined });
      program.configureOutput({
        writeOut: (value) => { stdout += value; },
        writeErr: (value) => { stderr += value; },
      });
      program.exitOverride();
      await program.parseAsync(['node', 'jf', ...args]);
      code = typeof process.exitCode === 'number' ? process.exitCode : 0;
    } catch (error) {
      const failure = error as {
        cliExit?: boolean;
        code?: string;
        exitCode?: number;
        message?: string;
      };
      if (failure.cliExit === true || failure.code?.startsWith('commander.')) {
        code = failure.exitCode ?? 1;
      } else {
        code = 1;
        stderr += `${failure.message ?? String(error)}\n`;
      }
    } finally {
      process.exit = previousExit;
      process.exitCode = previousExitCode;
      console.log = previousConsoleLog;
      console.error = previousConsoleError;
      process.stdout.write = previousStdoutWrite;
      process.stderr.write = previousStderrWrite;
      for (const [key, value] of changedEnvironment) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
    }

    return { code, stdout, stderr };
  });
  queue = result.then(() => undefined, () => undefined);
  return result;
}
