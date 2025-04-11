import { describe, expect, it } from 'vitest';
import type { EnvvarValidationIssue } from '../types.ts';
import { SafeEnvError } from './safe-env-error.ts';

describe('SafeEnvError', () => {
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
    const error = new SafeEnvError(issues);

    expect(error).toMatchInlineSnapshot(`
      [SafeEnvError: Environment variables validation has failed:
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
    const error = new SafeEnvError([]);
    expect(error.name).toBe('SafeEnvError');
  });

  it('attaches the issues array to the instance', () => {
    const error = new SafeEnvError(issues);
    expect(error.issues).toBe(issues);
  });

  describe('isInstance', () => {
    it('returns true for instances created by SafeEnvError', () => {
      const error = new SafeEnvError([]);
      expect(SafeEnvError.isInstance(error)).toBe(true);
    });

    it('returns false for plain objects', () => {
      expect(SafeEnvError.isInstance({})).toBe(false);
    });

    it('returns false for other error instances', () => {
      expect(SafeEnvError.isInstance(new Error('Oops'))).toBe(false);
    });

    it('returns false for null or non-object values', () => {
      expect(SafeEnvError.isInstance(null)).toBe(false);
      expect(SafeEnvError.isInstance('string')).toBe(false);
      expect(SafeEnvError.isInstance(123)).toBe(false);
    });
  });
});
