import { execFileSync, execSync } from 'node:child_process';

interface SecretPattern {
  reason: string;
  regex: RegExp;
}

interface HistoryFinding {
  commit: string;
  filePath: string;
  line: number;
  reason: string;
  sample: string;
}

const DEFAULT_PLACEHOLDERS = [
  'your-api-key',
  'your_password',
  'your-password',
  'your token',
  'your-token',
  'changeme',
  '<api-key>',
  '<password>',
  '<token>',
  'example',
  'xxx',
  'jellyfin_',
];

const SECRET_PATTERNS: SecretPattern[] = [
  {
    reason: 'Possible hardcoded JELLYFIN_API_KEY value',
    regex: /JELLYFIN_API_KEY\s*=\s*([A-Za-z0-9]{24,})/g,
  },
  {
    reason: 'Possible hardcoded credential value',
    regex: /(api[_-]?key|apiKey|token|password)\s*[:=]\s*['"]([A-Za-z0-9._~+=/]{12,})['"]/g,
  },
  {
    reason: 'Credentials embedded in URL',
    regex: /https?:\/\/[^\s:@/]+:[^\s@/]+@[^\s]+/g,
  },
];

function getAllCommits(rootDir: string): string[] {
  const output = execSync('git rev-list --all', { cwd: rootDir, encoding: 'utf-8' });
  return output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function isPlaceholder(value: string): boolean {
  const normalized = value.toLowerCase();
  return DEFAULT_PLACEHOLDERS.some((placeholder) => normalized.includes(placeholder));
}

function getBlobContent(rootDir: string, commit: string, filePath: string): string {
  try {
    return execFileSync('git', ['show', `${commit}:${filePath}`], {
      cwd: rootDir,
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024,
    });
  } catch {
    return '';
  }
}

function hasMeaningfulMatch(content: string, line: number, pattern: SecretPattern): boolean {
  const lines = content.split(/\r?\n/);
  const targetLine = lines[line - 1] ?? '';

  pattern.regex.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.regex.exec(targetLine)) !== null) {
    const fullMatch = match[0] ?? '';
    const value = match[2] ?? match[1] ?? fullMatch;

    if (!isPlaceholder(value)) {
      return true;
    }
  }

  return false;
}

function scanHistory(rootDir: string): HistoryFinding[] {
  const findings: HistoryFinding[] = [];
  const seen = new Set<string>();

  for (const commit of getAllCommits(rootDir)) {
    for (const pattern of SECRET_PATTERNS) {
      let output = '';
      try {
        output = execFileSync(
          'git',
          [
            'grep',
            '-I',
            '-nE',
            pattern.regex.source,
            commit,
            '--',
            '.',
            ':(exclude)tests/**',
            ':(exclude)*.example',
          ],
          {
            cwd: rootDir,
            encoding: 'utf-8',
            maxBuffer: 10 * 1024 * 1024,
          },
        );
      } catch (error) {
        const exitCode = (error as { status?: number }).status;
        if (exitCode === 1) {
          continue;
        }
        throw error;
      }

      const rows = output.split(/\r?\n/).filter((line) => line.trim().length > 0);
      for (const row of rows) {
        const firstColon = row.indexOf(':');
        const secondColon = row.indexOf(':', firstColon + 1);
        const thirdColon = row.indexOf(':', secondColon + 1);

        if (firstColon === -1 || secondColon === -1 || thirdColon === -1) {
          continue;
        }

        const matchedCommit = row.slice(0, firstColon);
        const filePath = row.slice(firstColon + 1, secondColon);
        const lineString = row.slice(secondColon + 1, thirdColon);
        const sample = row.slice(thirdColon + 1).trim();
        const line = Number.parseInt(lineString, 10);

        if (!Number.isFinite(line) || line <= 0) {
          continue;
        }

        const key = `${matchedCommit}:${filePath}:${line}:${pattern.reason}`;
        if (seen.has(key)) {
          continue;
        }

        const content = getBlobContent(rootDir, matchedCommit, filePath);
        if (!content) {
          continue;
        }

        if (!hasMeaningfulMatch(content, line, pattern)) {
          continue;
        }

        findings.push({
          commit: matchedCommit,
          filePath,
          line,
          reason: pattern.reason,
          sample: sample.slice(0, 120),
        });
        seen.add(key);
      }
    }
  }

  return findings;
}

const root = process.cwd();
const findings = scanHistory(root);

if (findings.length > 0) {
  console.error('Potential secrets found in git history:');
  for (const finding of findings) {
    console.error(
      `- ${finding.commit} ${finding.filePath}:${finding.line} | ${finding.reason} | ${finding.sample}`,
    );
  }
  process.exit(1);
}

console.log('OK: scanned git history with no obvious hardcoded secrets.');
