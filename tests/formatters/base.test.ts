import { describe, it, expect } from 'vitest';
import { formatToon } from '../../src/formatters/base.js';

describe('base formatters type detection', () => {
  it('should detect session list', () => {
    expect(formatToon([{ SessionId: '123' }])).toContain('type: sessions');
    expect(formatToon([{ PlayState: {} }])).toContain('type: sessions');
  });

  it('should detect user list', () => {
    expect(formatToon([{ IsAdministrator: true }])).toContain('type: users');
  });

  it('should detect lib list', () => {
    expect(formatToon([{ ItemId: '123', CollectionType: 'movies' }])).toContain('type: libs');
  });

  it('should detect object fallback', () => {
    expect(formatToon([{ RandomField: '123' }])).toContain('type: list');
    expect(formatToon({ RandomField: '123' })).toContain('type: obj');
  });

  it('should detect success msg', () => {
    expect(formatToon({ message: 'msg', success: true })).toContain('type: ok');
  });

  it('should detect error msg in obj', () => {
    expect(formatToon({ message: 'msg', success: false })).toContain('type: err');
    expect(formatToon({ error: 'err' })).toContain('type: err');
  });
});
