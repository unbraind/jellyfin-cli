import { describe, expect, it } from 'vitest';
import {
  isValidServerUrl,
  maskSecret,
  quoteShellValue,
  resolveSetupSaveServerName,
  sanitizeServerAddress,
} from '../../src/commands/setup-utils.js';

describe('setup-utils', () => {
  it('validates http/https server URLs', () => {
    expect(isValidServerUrl('http://localhost:8096')).toBe(true);
    expect(isValidServerUrl('https://jellyfin.local')).toBe(true);
    expect(isValidServerUrl('ftp://example.com')).toBe(false);
    expect(isValidServerUrl(':://not-a-url')).toBe(false);
  });

  it('masks secret values', () => {
    expect(maskSecret('abcdef123456')).toBe('abcd...56');
    expect(maskSecret('short')).toBe('********');
    expect(maskSecret(undefined)).toBeUndefined();
  });

  it('quotes shell values safely', () => {
    expect(quoteShellValue("abc'def")).toBe("'abc'\\''def'");
  });

  it('sanitizes duplicated protocol prefixes', () => {
    expect(sanitizeServerAddress('http://http://192.168.1.10:8096')).toBe('http://192.168.1.10:8096');
    expect(sanitizeServerAddress('https://https://example.com')).toBe('https://example.com');
    expect(sanitizeServerAddress('http://192.168.1.10:8096')).toBe('http://192.168.1.10:8096');
    expect(sanitizeServerAddress(undefined)).toBeUndefined();
  });

  it('resolves setup save target server name', () => {
    expect(resolveSetupSaveServerName('prod', [])).toBe('prod');
    expect(resolveSetupSaveServerName('   ', [
      { name: 'local', isDefault: true },
    ])).toBe('local');
    expect(resolveSetupSaveServerName(undefined, [
      { name: 'default', isDefault: true },
    ])).toBeUndefined();
    expect(resolveSetupSaveServerName(undefined, [
      { name: 'default', isDefault: false },
      { name: 'local', isDefault: true },
    ])).toBe('local');
  });
});
