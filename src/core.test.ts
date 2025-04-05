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

    it('sets environment flags from NODE_ENV', () => {
      const config = parseEnv(mockEnv, {});

      expect(config.isTest).toBe(true);
      expect(config.isProduction).toBe(false);
      expect(config.isDevelopment).toBe(false);
    });

    it('throws aggregated validation errors', () => {
      expect(() =>
        parseEnv(mockEnv, {
          apiKey: envvar('API_KEY', z.string().min(20)),
          dbHost: envvar('MISSING', z.enum(['a', 'b'])),
        }),
      ).toThrowErrorMatchingInlineSnapshot(`
      [ParseEnvError: Environment variables validation has failed:
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
});
