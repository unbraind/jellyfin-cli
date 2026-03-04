import { describe, expect, it } from 'vitest';
import { validateJsonSchema } from '../../src/utils/schema-validate.js';

describe('schema validate utils', () => {
  it('validates required fields and nested object refs', () => {
    const schema = {
      type: 'object',
      required: ['type', 'data'],
      properties: {
        type: { const: 'user' },
        data: { $ref: '#/definitions/userData' },
      },
      definitions: {
        userData: {
          type: 'object',
          required: ['id', 'name'],
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
          },
        },
      },
    };

    const valid = validateJsonSchema(
      {
        type: 'user',
        data: { id: 'u1', name: 'steve' },
      },
      schema,
    );
    expect(valid.valid).toBe(true);
    expect(valid.errors).toHaveLength(0);

    const invalid = validateJsonSchema(
      {
        type: 'user',
        data: { id: 'u1' },
      },
      schema,
    );
    expect(invalid.valid).toBe(false);
    expect(invalid.errors.some((error) => error.path === '$.data.name')).toBe(true);
  });

  it('validates oneOf, patterns, and date-time formats', () => {
    const schema = {
      type: 'object',
      required: ['value', 'created_at'],
      properties: {
        value: {
          oneOf: [{ type: 'string', pattern: '^item-[0-9]+$' }, { type: 'number' }],
        },
        created_at: { type: 'string', format: 'date-time' },
      },
    };

    expect(
      validateJsonSchema(
        {
          value: 'item-10',
          created_at: '2026-03-04T10:30:00.000Z',
        },
        schema,
      ).valid,
    ).toBe(true);

    const invalid = validateJsonSchema(
      {
        value: 'bad-value',
        created_at: 'not-a-date',
      },
      schema,
    );

    expect(invalid.valid).toBe(false);
    expect(invalid.errors.some((error) => error.path === '$.value')).toBe(true);
    expect(invalid.errors.some((error) => error.path === '$.created_at')).toBe(true);
  });

  it('reports unresolved schema refs', () => {
    const result = validateJsonSchema(
      { id: 'x' },
      {
        type: 'object',
        properties: {
          id: { $ref: '#/missing/ref' },
        },
      },
    );

    expect(result.valid).toBe(false);
    expect(result.errors[0]?.message).toContain('unresolved schema reference');
  });

  it('covers primitive and union type branches', () => {
    const schema = {
      type: 'object',
      required: ['arr', 'nullable', 'flag', 'count', 'mode'],
      properties: {
        arr: { type: 'array', items: { type: 'string', pattern: '^ok$' } },
        nullable: { type: ['null', 'string'] },
        flag: { type: 'boolean' },
        count: { type: 'number' },
        mode: { type: 'mystery' },
      },
    };

    const valid = validateJsonSchema(
      {
        arr: ['ok', 'ok'],
        nullable: null,
        flag: true,
        count: 10,
        mode: 'any-value',
      },
      schema,
    );

    expect(valid.valid).toBe(true);
    expect(valid.errors).toHaveLength(0);

    const invalid = validateJsonSchema(
      {
        arr: ['bad'],
        nullable: 'value',
        flag: 'true',
        count: Number.POSITIVE_INFINITY,
        mode: 'still-allowed',
      },
      schema,
    );

    expect(invalid.valid).toBe(false);
    expect(invalid.errors.some((error) => error.path === '$.arr[0]')).toBe(true);
    expect(invalid.errors.some((error) => error.path === '$.flag')).toBe(true);
    expect(invalid.errors.some((error) => error.path === '$.count')).toBe(true);
  });

  it('rejects non-pointer refs and const mismatches', () => {
    const nonPointerRef = validateJsonSchema(
      { id: 'x' },
      {
        type: 'object',
        properties: {
          id: { $ref: 'definitions/id' },
        },
      },
    );
    expect(nonPointerRef.valid).toBe(false);
    expect(nonPointerRef.errors[0]?.message).toContain('unresolved schema reference');

    const constMismatch = validateJsonSchema(
      { status: 'warning' },
      {
        type: 'object',
        properties: {
          status: { const: 'ok' },
        },
      },
    );
    expect(constMismatch.valid).toBe(false);
    expect(constMismatch.errors[0]?.message).toContain('must equal constant');
  });
});
