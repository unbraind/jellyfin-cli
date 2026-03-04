import { readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

export interface FileLineViolation {
  filePath: string;
  codeLines: number;
  maxLines: number;
}

export interface SecretFinding {
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

const SECRET_PATTERNS: { regex: RegExp; reason: string }[] = [
  {
    regex: /JELLYFIN_API_KEY\s*=\s*([A-Za-z0-9]{24,})/g,
    reason: 'Possible hardcoded JELLYFIN_API_KEY value',
  },
  {
    regex: /(api[_-]?key|apiKey|token|password)\s*[:=]\s*['"]([A-Za-z0-9._~+/=-]{12,})['"]/g,
    reason: 'Possible hardcoded credential value',
  },
  {
    regex: /https?:\/\/[^\s:@/]+:[^\s@/]+@[^\s]+/g,
    reason: 'Credentials embedded in URL',
  },
];

export function countCodeLines(content: string): number {
  let inBlockComment = false;
  let lines = 0;

  for (const line of content.split(/\r?\n/)) {
    let current = line;

    if (inBlockComment) {
      const blockEnd = current.indexOf('*/');
      if (blockEnd === -1) {
        continue;
      }
      current = current.slice(blockEnd + 2);
      inBlockComment = false;
    }

    let hasInlineComments = true;
    while (hasInlineComments) {
      const blockStart = current.indexOf('/*');
      const lineComment = current.indexOf('//');

      if (lineComment !== -1 && (blockStart === -1 || lineComment < blockStart)) {
        current = current.slice(0, lineComment);
        break;
      }

      if (blockStart === -1) {
        hasInlineComments = false;
        break;
      }

      const blockEnd = current.indexOf('*/', blockStart + 2);
      if (blockEnd === -1) {
        current = current.slice(0, blockStart);
        inBlockComment = true;
        break;
      }

      current = current.slice(0, blockStart) + current.slice(blockEnd + 2);
    }

    if (current.trim().length > 0) {
      lines += 1;
    }
  }

  return lines;
}

export function collectTypeScriptFiles(rootDir: string): string[] {
  const files: string[] = [];

  function walk(currentDir: string): void {
    for (const name of readdirSync(currentDir)) {
      const filePath = join(currentDir, name);
      const stats = statSync(filePath);

      if (stats.isDirectory()) {
        walk(filePath);
        continue;
      }

      if (extname(filePath) === '.ts') {
        files.push(filePath);
      }
    }
  }

  walk(rootDir);
  return files;
}

export function findLineViolations(filePaths: string[], maxLines = 300): FileLineViolation[] {
  return filePaths
    .map((filePath) => {
      const content = readFileSync(filePath, 'utf-8');
      return {
        filePath,
        codeLines: countCodeLines(content),
        maxLines,
      };
    })
    .filter((violation) => violation.codeLines > violation.maxLines)
    .sort((a, b) => b.codeLines - a.codeLines);
}

function isPlaceholder(value: string): boolean {
  const normalized = value.toLowerCase();
  return DEFAULT_PLACEHOLDERS.some((placeholder) => normalized.includes(placeholder));
}

function getLine(content: string, index: number): number {
  let line = 1;
  for (let i = 0; i < index; i += 1) {
    if (content[i] === '\n') {
      line += 1;
    }
  }
  return line;
}

function isLikelyTextFile(filePath: string): boolean {
  const blockedExtensions = new Set([
    '.png',
    '.jpg',
    '.jpeg',
    '.gif',
    '.webp',
    '.ico',
    '.pdf',
    '.zip',
    '.gz',
    '.tgz',
    '.woff',
    '.woff2',
  ]);
  return !blockedExtensions.has(extname(filePath));
}

export function findSecretFindings(filePaths: string[], rootDir = process.cwd()): SecretFinding[] {
  const findings: SecretFinding[] = [];

  for (const filePath of filePaths) {
    if (!isLikelyTextFile(filePath)) {
      continue;
    }

    const content = readFileSync(filePath, 'utf-8');

    for (const pattern of SECRET_PATTERNS) {
      pattern.regex.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = pattern.regex.exec(content)) !== null) {
        const fullMatch = match[0] ?? '';
        const value = match[2] ?? match[1] ?? fullMatch;

        if (isPlaceholder(value)) {
          continue;
        }

        findings.push({
          filePath: relative(rootDir, filePath),
          line: getLine(content, match.index),
          reason: pattern.reason,
          sample: fullMatch.slice(0, 80),
        });
      }
    }
  }

  return findings;
}
