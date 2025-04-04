import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { envvar } from './envvar.ts';

describe('envvar', () => {
  it('creates a tuple with environment variable name and Standard Schema validator', () => {
    const envvarName = 'API_KEY';
    const schema = z.string();

    const entry = envvar(envvarName, schema);

    expect(entry).toEqual([envvarName, schema]);
  });
});
