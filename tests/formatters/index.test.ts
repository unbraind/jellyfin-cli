import { describe, it, expect } from 'vitest';
import { formatOutput, formatSuccess, formatError } from '../../src/formatters/index.js';

describe('formatOutput', () => {
  it('should format as JSON', () => {
    const result = formatOutput({ test: 'data' }, 'json');
    expect(result).toContain('"test": "data"');
  });

  it('should format as raw for strings', () => {
    const result = formatOutput('test string', 'raw');
    expect(result).toBe('test string');
  });

  it('should format as raw for objects', () => {
    const result = formatOutput({ test: 'data' }, 'raw');
    expect(result).toContain('test');
    expect(result).toContain('data');
  });

  it('should format as table', () => {
    const data = [{ name: 'Item1', value: 1 }, { name: 'Item2', value: 2 }];
    const result = formatOutput(data, 'table');
    expect(result).toContain('Item1');
    expect(result).toContain('Item2');
  });

  it('should format as yaml', () => {
    const data = { name: 'Item1', value: 1 };
    const result = formatOutput(data, 'yaml');
    expect(result).toContain('name: Item1');
    expect(result).toContain('value: 1');
  });

  it('should format as markdown', () => {
    const data = [{ name: 'Item1', value: 1 }, { name: 'Item2', value: 2 }];
    const result = formatOutput(data, 'markdown');
    expect(result).toContain('| name | value |');
    expect(result).toContain('| Item1 | 1 |');
  });

  it('should format as toon by default', () => {
    const result = formatOutput({ test: 'data' }, 'toon');
    expect(result).toContain('type:');
    expect(result).toContain('data:');
  });

  it('should format empty array as table', () => {
    const result = formatOutput([], 'table');
    expect(result).toBe('No items');
  });

  it('should format object with Items as table', () => {
    const data = { Items: [{ id: 1, name: 'Test' }], TotalRecordCount: 1 };
    const result = formatOutput(data, 'table');
    expect(result).toContain('Test');
  });

  it('should format single object as table', () => {
    const data = { key1: 'value1', key2: 'value2' };
    const result = formatOutput(data, 'table');
    expect(result).toContain('key1: value1');
    expect(result).toContain('key2: value2');
  });

  it('should format object with various types as table', () => {
    const data = { 
      boolTrue: true, 
      boolFalse: false, 
      arrSmall: [1, 2], 
      arrLarge: [1, 2, 3, 4], 
      objField: { inner: 'val' } 
    };
    const result = formatOutput(data, 'table');
    expect(result).toContain('boolTrue: Yes');
    expect(result).toContain('boolFalse: No');
    expect(result).toContain('arrSmall: 1, 2');
    expect(result).toContain('arrLarge: 1, 2, 3...');
    expect(result).toContain('objField: [Object]');
  });

  it('should format list with various types as table', () => {
    const data = [{
      boolTrue: true, 
      boolFalse: false, 
      arrSmall: [1, 2], 
      arrLarge: [1, 2, 3, 4], 
      objField: { inner: 'val' }
    }];
    const result = formatOutput(data, 'table');
    expect(result).toContain('Yes');
    expect(result).toContain('No');
    expect(result).toContain('1, 2');
    expect(result).toContain('1, 2, 3...');
    expect(result).toContain('[Object]');
  });

  it('should format non-object, non-array data as table', () => {
    const result = formatOutput('just a string', 'table');
    expect(result).toBe('just a string');
  });

  it('should format array of primitives as table', () => {
    const result = formatOutput(['a', 'b', 'c'], 'table');
    expect(result).toContain('a');
    expect(result).toContain('b');
    expect(result).toContain('c');
  });
});

describe('formatSuccess', () => {
  it('should format as JSON', () => {
    const result = formatSuccess('Operation completed', 'json');
    expect(result).toContain('success');
    expect(result).toContain('true');
    expect(result).toContain('Operation completed');
  });

  it('should format as raw', () => {
    const result = formatSuccess('Operation completed', 'raw');
    expect(result).toBe('Operation completed');
  });

  it('should format as toon', () => {
    const result = formatSuccess('Operation completed', 'toon');
    expect(result).toContain('msg:');
    expect(result).toContain('Operation completed');
  });
});

describe('formatError', () => {
  it('should format error as JSON', () => {
    const result = formatError('Something went wrong', 'json');
    expect(result).toContain('success');
    expect(result).toContain('false');
    expect(result).toContain('Something went wrong');
  });

  it('should format error with code as JSON', () => {
    const result = formatError('Not found', 'json', 404);
    expect(result).toContain('404');
    expect(result).toContain('Not found');
  });

  it('should format error as raw', () => {
    const result = formatError('Something went wrong', 'raw');
    expect(result).toBe('Error: Something went wrong');
  });

  it('should format error as toon', () => {
    const result = formatError('Something went wrong', 'toon', 500, { detail: 'info' });
    expect(result).toContain('err:');
    expect(result).toContain('Something went wrong');
  });
});

describe('formatMarkdown extended coverage', () => {
  it('should format empty array as markdown', () => {
    expect(formatOutput([], 'markdown')).toBe('No items.');
  });
  it('should format array of objects as markdown table', () => {
    expect(formatOutput([{ name: 'A' }, { name: 'B' }], 'markdown')).toContain('| name |');
  });
  it('should format array of strings as markdown list', () => {
    expect(formatOutput(['Item1', 'Item2'], 'markdown')).toContain('- Item1\n- Item2');
  });
  it('should format object with Items array as markdown table', () => {
    expect(formatOutput({ Items: [{ a: 1 }] }, 'markdown')).toContain('| a |');
  });
  it('should format object with empty Items array', () => {
    expect(formatOutput({ Items: [] }, 'markdown')).toContain('No items.');
  });
  it('should format object without Items as markdown key-value', () => {
    expect(formatOutput({ key: 'val' }, 'markdown')).toBe('**key**: val');
  });
  it('should format primitives and null as string', () => {
    expect(formatOutput(123, 'markdown')).toBe('123');
    expect(formatOutput(null, 'markdown')).toBe('null');
  });
});
