import { describe, expect, it } from 'vitest';
import {
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
});
