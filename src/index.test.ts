import { describe, expectTypeOf, it } from 'vitest';
import { z } from 'zod';
import {
  type EnvSchema,
  type EnvvarEntry,
  envvar,
  type InferEnv,
  parseEnv,
} from './index.ts';

describe('public types', () => {
  it('names the type of a schema built with envvar', () => {
    const schema = {
      port: envvar('PORT', z.coerce.number()),
      db: { host: envvar('DB_HOST', z.string(), { sensitive: true }) },
    };

    expectTypeOf(schema).toEqualTypeOf<{
      port: EnvvarEntry<z.ZodCoercedNumber>;
      db: { host: EnvvarEntry<z.ZodString> };
    }>();
  });

  it('constrains a generic schema parameter', () => {
    const parse = <T extends EnvSchema>(schema: T): InferEnv<T> =>
      parseEnv({ PORT: '3000' }, schema);

    expectTypeOf(
      parse({ port: envvar('PORT', z.coerce.number()) }),
    ).toEqualTypeOf<{
      port: number;
    }>();
  });
});
