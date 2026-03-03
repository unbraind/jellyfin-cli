import { describe, expect, it } from 'vitest';
import {
  collectTypeScriptFiles,
  countCodeLines,
  findLineViolations,
  findSecretFindings,
} from '../../src/utils/release-checks.js';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

describe('release-checks', () => {
  it('countCodeLines ignores comments and blanks', () => {
    const content = `
// line comment
const a = 1;

/* block comment start
still in comment */
const b = 2; // trailing comment
`;

    expect(countCodeLines(content)).toBe(2);
  });

  it('findLineViolations reports files over max code lines', () => {
    const tmpDir = join(process.cwd(), '.tmp', 'release-check-lines');
    mkdirSync(tmpDir, { recursive: true });
    const file = join(tmpDir, 'sample.ts');
    writeFileSync(file, 'const a = 1;\nconst b = 2;\n', 'utf-8');

    const violations = findLineViolations([file], 1);
    expect(violations).toHaveLength(1);
    expect(violations[0]?.codeLines).toBe(2);

    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('findSecretFindings detects hardcoded credentials and ignores placeholders', () => {
    const tmpDir = join(process.cwd(), '.tmp', 'release-check-secrets');
    mkdirSync(tmpDir, { recursive: true });

    const badFile = join(tmpDir, 'bad.env');
    writeFileSync(badFile, 'JELLYFIN_API_KEY=abcdef1234567890abcdef1234567890\n', 'utf-8');

    const safeFile = join(tmpDir, 'safe.env');
    writeFileSync(safeFile, 'JELLYFIN_API_KEY=your-api-key\n', 'utf-8');

    const findings = findSecretFindings([badFile, safeFile], process.cwd());
    expect(findings.length).toBe(1);
    expect(findings[0]?.reason).toContain('JELLYFIN_API_KEY');

    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('countCodeLines handles inline and unterminated block comments', () => {
    const content = `
const a = 1; /* inline block */ const b = 2;
const c = 3; /* starts block
still comment
const d = 4;
`;

    expect(countCodeLines(content)).toBe(2);
  });

  it('collectTypeScriptFiles finds nested TypeScript files only', () => {
    const tmpDir = join(process.cwd(), '.tmp', 'release-check-collect');
    const nested = join(tmpDir, 'nested');
    mkdirSync(nested, { recursive: true });
    writeFileSync(join(tmpDir, 'root.ts'), 'export const root = true;\n', 'utf-8');
    writeFileSync(join(nested, 'nested.ts'), 'export const nested = true;\n', 'utf-8');
    writeFileSync(join(nested, 'ignore.js'), 'const ignored = true;\n', 'utf-8');

    const files = collectTypeScriptFiles(tmpDir).map((path) => path.replace(/\\/g, '/')).sort();
    expect(files).toHaveLength(2);
    expect(files[0]?.endsWith('/nested/nested.ts')).toBe(true);
    expect(files[1]?.endsWith('/root.ts')).toBe(true);

    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('findSecretFindings reports line numbers and skips likely binary files', () => {
    const tmpDir = join(process.cwd(), '.tmp', 'release-check-secrets-lines');
    mkdirSync(tmpDir, { recursive: true });
    const textFile = join(tmpDir, 'sample.txt');
    const binaryLikeFile = join(tmpDir, 'sample.png');

    writeFileSync(textFile, `safe line\npassword='SuperSecretPass1234'\n`, 'utf-8');
    writeFileSync(binaryLikeFile, `password='BinaryShouldBeIgnored9999'\n`, 'utf-8');

    const findings = findSecretFindings([textFile, binaryLikeFile], process.cwd());
    expect(findings).toHaveLength(1);
    expect(findings[0]?.line).toBe(2);
    expect(findings[0]?.filePath.endsWith('sample.txt')).toBe(true);

    rmSync(tmpDir, { recursive: true, force: true });
  });
});
