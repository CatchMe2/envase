import * as v from 'valibot';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { envvar, parseEnv } from './core.ts';

describe('core', () => {
  describe('envvar', () => {
    it('creates a tuple with environment variable name and Standard Schema validator', () => {
      const envvarName = 'API_KEY';
      const schema = z.string();

      const entry = envvar(envvarName, schema);

      expect(entry).toEqual([envvarName, schema]);
    });
  });

  describe('parseEnv', () => {
    const mockEnv = {
      PORT: '3000',
      API_KEY: 'secret123',
      DB_HOST: 'localhost',
      NODE_ENV: 'test',
    };

    it('sets environment flags from NODE_ENV', () => {
      const config = parseEnv(mockEnv, {});

      expect(config.isTest).toBe(true);
      expect(config.isProduction).toBe(false);
      expect(config.isDevelopment).toBe(false);
    });

    describe('using zod', () => {
      it('parses flat config with Zod validators', () => {
        const config = parseEnv(mockEnv, {
          port: envvar('PORT', z.coerce.number()),
          apiKey: envvar('API_KEY', z.string()),
        });

        expect(config.port).toBe(Number(mockEnv.PORT));
        expect(config.apiKey).toBe(mockEnv.API_KEY);
      });

      it('parses nested config structures', () => {
        const config = parseEnv(mockEnv, {
          db: {
            host: envvar('DB_HOST', z.string()),
          },
        });

        expect(config.db.host).toBe(mockEnv.DB_HOST);
      });

      it('handles optional values', () => {
        const config = parseEnv(mockEnv, {
          optional: envvar('MISSING', z.string().optional()),
        });

        expect(config.optional).toBeUndefined();
      });

      it('handles default values', () => {
        const config = parseEnv(mockEnv, {
          withDefault: envvar('MISSING', z.string().default('test')),
        });

        expect(config.withDefault).toBe('test');
      });

      it('throws aggregated validation errors', () => {
        expect(() =>
          parseEnv(mockEnv, {
            apiKey: envvar('API_KEY', z.string().min(20)),
            dbHost: envvar('MISSING', z.enum(['a', 'b'])),
          }),
        ).toThrowErrorMatchingInlineSnapshot(`
        [EnvSchemaError: Environment variables validation has failed:
          [API_KEY]:
            String must contain at least 20 character(s)
            (received: "secret123")

          [MISSING]:
            Required
            (received: "undefined")
        ]
      `);
      });
    });

    describe('using valibot', () => {
      it('parses flat config with Valibot validators', () => {
        const config = parseEnv(mockEnv, {
          port: envvar('PORT', v.pipe(v.unknown(), v.transform(Number))),
          apiKey: envvar('API_KEY', v.string()),
        });

        expect(config.port).toBe(Number(mockEnv.PORT));
        expect(config.apiKey).toBe(mockEnv.API_KEY);
      });

      it('parses nested config structures with Valibot', () => {
        const config = parseEnv(mockEnv, {
          db: {
            host: envvar('DB_HOST', v.string()),
          },
        });

        expect(config.db.host).toBe(mockEnv.DB_HOST);
      });

      it('handles optional values with Valibot', () => {
        const config = parseEnv(mockEnv, {
          optional: envvar('MISSING', v.optional(v.string())),
        });

        expect(config.optional).toBeUndefined();
      });

      it('handles default values with Valibot', () => {
        const config = parseEnv(mockEnv, {
          withDefault: envvar('MISSING', v.optional(v.string(), 'test')),
        });

        expect(config.withDefault).toBe('test');
      });

      it('throws aggregated validation errors with Valibot', () => {
        expect(() =>
          parseEnv(mockEnv, {
            apiKey: envvar('API_KEY', v.pipe(v.string(), v.minLength(20))),
            dbHost: envvar('MISSING', v.picklist(['a', 'b'])),
          }),
        ).toThrowErrorMatchingInlineSnapshot(`
        [EnvSchemaError: Environment variables validation has failed:
          [API_KEY]:
            Invalid length: Expected >=20 but received 9
            (received: "secret123")

          [MISSING]:
            Invalid type: Expected ("a" | "b") but received undefined
            (received: "undefined")
        ]
      `);
      });
    });
  });
});
