import { describe, expect, it } from 'vitest';
import type { EnvvarValidationIssue } from '../types.ts';
import { EnvaseError } from './envase-error.ts';

describe('EnvaseError', () => {
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
    const error = new EnvaseError(issues);

    expect(error).toMatchInlineSnapshot(`
      [EnvaseError: Environment variables validation has failed:
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
    const error = new EnvaseError([]);
    expect(error.name).toBe('EnvaseError');
  });

  it('attaches the issues array to the instance', () => {
    const error = new EnvaseError(issues);
    expect(error.issues).toBe(issues);
  });

  describe('isInstance', () => {
    it('returns true for instances created by EnvaseError', () => {
      const error = new EnvaseError([]);
      expect(EnvaseError.isInstance(error)).toBe(true);
    });

    it('returns false for plain objects', () => {
      expect(EnvaseError.isInstance({})).toBe(false);
    });

    it('returns false for other error instances', () => {
      expect(EnvaseError.isInstance(new Error('Oops'))).toBe(false);
    });

    it('returns false for null or non-object values', () => {
      expect(EnvaseError.isInstance(null)).toBe(false);
      expect(EnvaseError.isInstance('string')).toBe(false);
      expect(EnvaseError.isInstance(123)).toBe(false);
    });
  });
});
