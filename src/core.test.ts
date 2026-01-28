import * as v from 'valibot';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { createConfig, detectNodeEnv, envvar, parseEnv } from './core.ts';

describe('core', () => {
  describe('detectNodeEnv', () => {
    it('returns true for isProduction flag', () => {
      const config = detectNodeEnv({ NODE_ENV: 'production' });

      expect(config.isProduction).toBe(true);
      expect(config.isTest).toBe(false);
      expect(config.isDevelopment).toBe(false);
    });

    it('returns true for isTest flag', () => {
      const config = detectNodeEnv({ NODE_ENV: 'test' });

      expect(config.isProduction).toBe(false);
      expect(config.isTest).toBe(true);
      expect(config.isDevelopment).toBe(false);
    });

    it('returns true for isDevelopment flag', () => {
      const config = detectNodeEnv({ NODE_ENV: 'development' });

      expect(config.isProduction).toBe(false);
      expect(config.isTest).toBe(false);
      expect(config.isDevelopment).toBe(true);
    });

    it('returns all falsy flags if NODE_ENV is missing', () => {
      const config = detectNodeEnv({});

      expect(config.isProduction).toBe(false);
      expect(config.isTest).toBe(false);
      expect(config.isDevelopment).toBe(false);
    });
  });

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
      EMPTY: '',
    };

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

      it('allows for empty strings', () => {
        const config = parseEnv(mockEnv, {
          withDefault: envvar('EMPTY', z.string()),
        });

        expect(config.withDefault).toBe('');
      });

      it('throws for async validation', () => {
        expect(() =>
          parseEnv(mockEnv, {
            apiKey: envvar(
              'API_KEY',
              z.string().refine(async () => Promise.resolve(true)),
            ),
          }),
        ).toThrowError(
          'Schema validation for envvar "API_KEY" must be synchronous',
        );
      });

      it('throws aggregated validation errors', () => {
        expect(() =>
          parseEnv(mockEnv, {
            apiKey: envvar('API_KEY', z.string().min(20)),
            dbHost: envvar('MISSING', z.enum(['a', 'b'])),
          }),
        ).toThrowErrorMatchingInlineSnapshot(`
          [EnvaseError: Environment variables validation has failed:
            [API_KEY]:
              Too small: expected string to have >=20 characters
              (received: "secret123")

            [MISSING]:
              Invalid option: expected one of "a"|"b"
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

      it('allows for empty strings', () => {
        const config = parseEnv(mockEnv, {
          withDefault: envvar('EMPTY', v.string()),
        });

        expect(config.withDefault).toBe('');
      });

      it('throws for async validation', () => {
        expect(() =>
          parseEnv(mockEnv, {
            apiKey: envvar(
              'API_KEY',
              v.pipeAsync(
                v.string(),
                v.checkAsync(async () => Promise.resolve(true)),
              ),
            ),
          }),
        ).toThrowError(
          'Schema validation for envvar "API_KEY" must be synchronous',
        );
      });

      it('throws aggregated validation errors with Valibot', () => {
        expect(() =>
          parseEnv(mockEnv, {
            apiKey: envvar('API_KEY', v.pipe(v.string(), v.minLength(20))),
            dbHost: envvar('MISSING', v.picklist(['a', 'b'])),
          }),
        ).toThrowErrorMatchingInlineSnapshot(`
        [EnvaseError: Environment variables validation has failed:
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

  describe('createConfig', () => {
    const mockEnv = {
      DB_HOST: 'localhost',
      DB_PORT: '5432',
      DB_NAME: 'mydb',
      API_KEY: 'secret123',
    };

    it('parses config without computed values', () => {
      const config = createConfig(mockEnv, {
        schema: {
          db: {
            host: envvar('DB_HOST', z.string()),
            port: envvar('DB_PORT', z.coerce.number()),
          },
        },
      });

      expect(config.db.host).toBe('localhost');
      expect(config.db.port).toBe(5432);
    });

    it('computes derived values from raw config', () => {
      const config = createConfig(mockEnv, {
        schema: {
          db: {
            host: envvar('DB_HOST', z.string()),
            port: envvar('DB_PORT', z.coerce.number()),
            name: envvar('DB_NAME', z.string()),
          },
          api: {
            key: envvar('API_KEY', z.string()),
          },
        },
        computed: {
          dbConnectionString: (raw) =>
            `postgres://${raw.db.host}:${raw.db.port}/${raw.db.name}`,
          apiKeyPrefix: (raw) => raw.api.key.slice(0, 8),
        },
      });

      expect(config.db.host).toBe('localhost');
      expect(config.db.port).toBe(5432);
      expect(config.db.name).toBe('mydb');
      expect(config.api.key).toBe('secret123');
      expect(config.dbConnectionString).toBe('postgres://localhost:5432/mydb');
      expect(config.apiKeyPrefix).toBe('secret12');
    });

    it('receives parsed values in computed functions (not raw strings)', () => {
      const config = createConfig(mockEnv, {
        schema: {
          port: envvar('DB_PORT', z.coerce.number()),
        },
        computed: {
          portPlusTen: (raw) => raw.port + 10,
        },
      });

      expect(config.port).toBe(5432);
      expect(config.portPlusTen).toBe(5442);
    });

    it('throws EnvaseError if schema validation fails before computing', () => {
      expect(() =>
        createConfig(mockEnv, {
          schema: {
            missing: envvar('MISSING_VAR', z.string()),
          },
          computed: {
            derived: (raw) => raw.missing.toUpperCase(),
          },
        }),
      ).toThrow();
    });

    it('works with empty computed object', () => {
      const config = createConfig(mockEnv, {
        schema: {
          host: envvar('DB_HOST', z.string()),
        },
        computed: {},
      });

      expect(config.host).toBe('localhost');
    });

    it('infers types correctly for raw parameter and return values', () => {
      const config = createConfig(mockEnv, {
        schema: {
          db: {
            host: envvar('DB_HOST', z.string()),
            port: envvar('DB_PORT', z.coerce.number()),
          },
        },
        computed: {
          connectionString: (raw) => `${raw.db.host}:${raw.db.port}`,
          portPlusTen: (raw) => raw.db.port + 10,
        },
      });

      // These type assertions verify compile-time inference
      const _host: string = config.db.host;
      const _port: number = config.db.port;
      const _connStr: string = config.connectionString;
      const _portPlusTen: number = config.portPlusTen;

      expect(_host).toBe('localhost');
      expect(_port).toBe(5432);
      expect(_connStr).toBe('localhost:5432');
      expect(_portPlusTen).toBe(5442);
    });
  });
});
