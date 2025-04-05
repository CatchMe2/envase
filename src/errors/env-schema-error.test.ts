import { describe, expect, it } from 'vitest';
import type { EnvvarValidationIssue } from '../types.ts';
import { EnvSchemaError } from './env-schema-error.ts';

describe('EnvSchemaError', () => {
  const issues: EnvvarValidationIssue[] = [
    {
      name: 'API_KEY',
      value: '',
      messages: ['Required', 'Must be a non-empty string'],
    },
    {
      name: 'PORT',
      value: 'abc',
      messages: ['Must be a number'],
    },
  ];

  it('formats the error message correctly', () => {
    const error = new EnvSchemaError(issues);

    expect(error).toMatchInlineSnapshot(`
      [EnvSchemaError: Environment variables validation has failed:
        [API_KEY]:
          Required
          Must be a non-empty string
          (received: "")

        [PORT]:
          Must be a number
          (received: "abc")
      ]
    `);
  });

  it('sets the correct error name', () => {
    const error = new EnvSchemaError([]);
    expect(error.name).toBe('EnvSchemaError');
  });

  it('attaches the issues array to the instance', () => {
    const error = new EnvSchemaError(issues);
    expect(error.issues).toBe(issues);
  });

  describe('isInstance', () => {
    it('returns true for instances created by EnvSchemaError', () => {
      const error = new EnvSchemaError([]);
      expect(EnvSchemaError.isInstance(error)).toBe(true);
    });

    it('returns false for plain objects', () => {
      expect(EnvSchemaError.isInstance({})).toBe(false);
    });

    it('returns false for other error instances', () => {
      expect(EnvSchemaError.isInstance(new Error('Oops'))).toBe(false);
    });

    it('returns false for null or non-object values', () => {
      expect(EnvSchemaError.isInstance(null)).toBe(false);
      expect(EnvSchemaError.isInstance('string')).toBe(false);
      expect(EnvSchemaError.isInstance(123)).toBe(false);
    });
  });
});
