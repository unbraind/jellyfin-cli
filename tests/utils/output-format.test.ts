import { describe, expect, it } from 'vitest';
import { isOutputFormat, outputFormatChoices, parseOutputFormat } from '../../src/utils/output-format.js';

describe('output-format utils', () => {
  it('recognizes supported formats', () => {
    expect(isOutputFormat('toon')).toBe(true);
    expect(isOutputFormat('yaml')).toBe(true);
    expect(isOutputFormat('markdown')).toBe(true);
  });

  it('rejects unsupported formats', () => {
    expect(isOutputFormat('xml')).toBe(false);
  });

  it('parses valid format and keeps fallback for invalid values', () => {
    expect(parseOutputFormat('json')).toBe('json');
    expect(parseOutputFormat('xml', 'yaml')).toBe('yaml');
    expect(parseOutputFormat(undefined, 'markdown')).toBe('markdown');
  });

  it('returns human-readable choices', () => {
    expect(outputFormatChoices()).toContain('toon');
    expect(outputFormatChoices()).toContain('markdown');
  });
});
