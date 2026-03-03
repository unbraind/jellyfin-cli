import { join } from 'node:path';
import { collectTypeScriptFiles, findLineViolations } from '../src/utils/release-checks.js';

const root = process.cwd();
const sourceDir = join(root, 'src');
const files = collectTypeScriptFiles(sourceDir);
const violations = findLineViolations(files, 300);

if (violations.length > 0) {
  console.error('TypeScript code line limit exceeded (max 300 lines excluding comments):');
  for (const violation of violations) {
    console.error(`- ${violation.filePath}: ${violation.codeLines} code lines`);
  }
  process.exit(1);
}

console.log(`OK: ${files.length} src TypeScript files are within the 300-line code limit.`);
