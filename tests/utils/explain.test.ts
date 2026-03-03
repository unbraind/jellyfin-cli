import { describe, expect, it } from 'vitest';
import {
  buildExplainRequestPayload,
  isExplainModeEnabled,
} from '../../src/utils/explain.js';

describe('explain utils', () => {
  it('enables explain mode from cli option or env value', () => {
    expect(isExplainModeEnabled(true, undefined)).toBe(true);
    expect(isExplainModeEnabled(false, '1')).toBe(false);
    expect(isExplainModeEnabled('true', undefined)).toBe(true);
    expect(isExplainModeEnabled('yes', undefined)).toBe(true);
    expect(isExplainModeEnabled('off', undefined)).toBe(false);
    expect(isExplainModeEnabled(undefined, '1')).toBe(true);
    expect(isExplainModeEnabled(undefined, 'true')).toBe(true);
    expect(isExplainModeEnabled(undefined, 'yes')).toBe(true);
    expect(isExplainModeEnabled(undefined, 'on')).toBe(true);
    expect(isExplainModeEnabled(undefined, '0')).toBe(false);
  });

  it('redacts secrets and marks read-only request safety', () => {
    const payload = buildExplainRequestPayload({
      method: 'POST',
      path: '/Users/AuthenticateByName',
      params: {
        apiKey: 'my-secret-api-key',
      },
      body: {
        Username: 'steve',
        Pw: 'super-secret-password',
      },
      timeoutMs: 12345,
    });

    expect(payload.type).toBe('request_explain');
    expect(payload.data.method).toBe('POST');
    expect(payload.data.path).toBe('/Users/AuthenticateByName');
    expect(payload.data.read_only_safe).toBe(false);
    expect(payload.data.timeout_ms).toBe(12345);
    expect(payload.data.query).toEqual({ apiKey: '[REDACTED]' });
    expect(payload.data.body).toEqual({
      Username: 'steve',
      Pw: '[REDACTED]',
    });
  });

  it('truncates long values and handles mixed payload value kinds', () => {
    const payload = buildExplainRequestPayload({
      method: 'HEAD',
      path: '/System/Info',
      params: {
        long: 'x'.repeat(200),
        nil: null,
        ok: true,
        count: 12,
        nested: {
          arr: ['a', 'b', 'c'],
        },
      },
      body: {
        objectDepth: {
          a: { b: { c: { d: { e: 'too-deep' } } } },
        },
        weird: Symbol('token'),
      },
      timeoutMs: 1000,
    });

    expect(payload.data.read_only_safe).toBe(true);
    expect(payload.data.query).toEqual({
      long: `${'x'.repeat(120)}...`,
      nil: null,
      ok: true,
      count: 12,
      nested: {
        arr: ['a', 'b', 'c'],
      },
    });
    expect(payload.data.body).toEqual({
      objectDepth: {
        a: {
          b: {
            c: '[TRUNCATED]',
          },
        },
      },
      weird: 'Symbol(token)',
    });
  });
});
