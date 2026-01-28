import * as v from 'valibot';
import { describe, expect, expectTypeOf, it } from 'vitest';
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

    it('deep merges nested computed values with schema', () => {
      const config = createConfig(
        {
          AWS_ACCESS_KEY_ID: 'AKIAIOSFODNN7EXAMPLE',
          AWS_SECRET_ACCESS_KEY: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
        },
        {
          schema: {
            aws: {
              accessKeyId: envvar('AWS_ACCESS_KEY_ID', z.string()),
              secretAccessKey: envvar('AWS_SECRET_ACCESS_KEY', z.string()),
            },
          },
          computed: {
            aws: {
              credentials: (raw) => ({
                accessKeyId: raw.aws.accessKeyId,
                secretAccessKey: raw.aws.secretAccessKey,
              }),
            },
          },
        },
      );

      // Verify schema values are preserved
      expect(config.aws.accessKeyId).toBe('AKIAIOSFODNN7EXAMPLE');
      expect(config.aws.secretAccessKey).toBe(
        'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
      );

      // Verify computed value is merged in
      expect(config.aws.credentials).toEqual({
        accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
        secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
      });

      // Type assertions
      const _accessKeyId: string = config.aws.accessKeyId;
      const _credentials: {
        accessKeyId: string;
        secretAccessKey: string;
      } = config.aws.credentials;

      expect(_accessKeyId).toBeDefined();
      expect(_credentials).toBeDefined();
    });

    it('supports multiple levels of nested computed values', () => {
      const config = createConfig(mockEnv, {
        schema: {
          db: {
            host: envvar('DB_HOST', z.string()),
            port: envvar('DB_PORT', z.coerce.number()),
            name: envvar('DB_NAME', z.string()),
          },
        },
        computed: {
          db: {
            connection: {
              url: (raw) =>
                `postgres://${raw.db.host}:${raw.db.port}/${raw.db.name}`,
            },
          },
        },
      });

      expect(config.db.host).toBe('localhost');
      expect(config.db.port).toBe(5432);
      expect(config.db.name).toBe('mydb');
      expect(config.db.connection.url).toBe('postgres://localhost:5432/mydb');
    });

    it('allows mixing flat and nested computed values', () => {
      const config = createConfig(mockEnv, {
        schema: {
          db: {
            host: envvar('DB_HOST', z.string()),
            port: envvar('DB_PORT', z.coerce.number()),
          },
          api: {
            key: envvar('API_KEY', z.string()),
          },
        },
        computed: {
          // Flat computed value at root
          dbUrl: (raw) => `${raw.db.host}:${raw.db.port}`,
          // Nested computed value
          api: {
            keyPrefix: (raw) => raw.api.key.slice(0, 4),
          },
        },
      });

      expect(config.dbUrl).toBe('localhost:5432');
      expect(config.api.key).toBe('secret123');
      expect(config.api.keyPrefix).toBe('secr');
    });

    describe('type inference', () => {
      it('infers correct types for config without computed values', () => {
        const config = createConfig(mockEnv, {
          schema: {
            db: {
              host: envvar('DB_HOST', z.string()),
              port: envvar('DB_PORT', z.coerce.number()),
            },
          },
        });

        expectTypeOf(config).toEqualTypeOf<{
          db: { host: string; port: number };
        }>();
      });

      it('infers correct types for flat computed values', () => {
        const config = createConfig(mockEnv, {
          schema: {
            db: {
              host: envvar('DB_HOST', z.string()),
              port: envvar('DB_PORT', z.coerce.number()),
            },
          },
          computed: {
            url: (raw) => `${raw.db.host}:${raw.db.port}`,
            portPlusTen: (raw) => raw.db.port + 10,
          },
        });

        expectTypeOf(config.db).toEqualTypeOf<{ host: string; port: number }>();
        expectTypeOf(config.url).toEqualTypeOf<string>();
        expectTypeOf(config.portPlusTen).toEqualTypeOf<number>();
      });

      it('infers correct types for nested computed values merged with schema', () => {
        const config = createConfig(
          {
            AWS_ACCESS_KEY_ID: 'test',
            AWS_SECRET_ACCESS_KEY: 'test',
          },
          {
            schema: {
              aws: {
                accessKeyId: envvar('AWS_ACCESS_KEY_ID', z.string()),
                secretAccessKey: envvar('AWS_SECRET_ACCESS_KEY', z.string()),
              },
            },
            computed: {
              aws: {
                credentials: (raw) => ({
                  key: raw.aws.accessKeyId,
                  secret: raw.aws.secretAccessKey,
                }),
              },
            },
          },
        );

        expectTypeOf(config.aws.accessKeyId).toEqualTypeOf<string>();
        expectTypeOf(config.aws.secretAccessKey).toEqualTypeOf<string>();
        expectTypeOf(config.aws.credentials).toEqualTypeOf<{
          key: string;
          secret: string;
        }>();
      });

      it('infers correct types for deeply nested computed values', () => {
        const config = createConfig(mockEnv, {
          schema: {
            db: {
              host: envvar('DB_HOST', z.string()),
              port: envvar('DB_PORT', z.coerce.number()),
            },
          },
          computed: {
            db: {
              connection: {
                url: (raw) => `postgres://${raw.db.host}:${raw.db.port}`,
                isLocal: (raw) => raw.db.host === 'localhost',
              },
            },
          },
        });

        expectTypeOf(config.db.host).toEqualTypeOf<string>();
        expectTypeOf(config.db.port).toEqualTypeOf<number>();
        expectTypeOf(config.db.connection.url).toEqualTypeOf<string>();
        expectTypeOf(config.db.connection.isLocal).toEqualTypeOf<boolean>();

        // Also verify runtime behavior
        expect(config.db.host).toBe('localhost');
        expect(config.db.port).toBe(5432);
        expect(config.db.connection.url).toBe('postgres://localhost:5432');
        expect(config.db.connection.isLocal).toBe(true);
      });

      it('infers correct types when mixing flat and nested computed values', () => {
        const config = createConfig(mockEnv, {
          schema: {
            db: {
              host: envvar('DB_HOST', z.string()),
            },
            api: {
              key: envvar('API_KEY', z.string()),
            },
          },
          computed: {
            isConfigured: (raw) => raw.db.host.length > 0,
            db: {
              isLocal: (raw) => raw.db.host === 'localhost',
            },
            api: {
              keyLength: (raw) => raw.api.key.length,
            },
          },
        });

        expectTypeOf(config.db.host).toEqualTypeOf<string>();
        expectTypeOf(config.db.isLocal).toEqualTypeOf<boolean>();
        expectTypeOf(config.api.key).toEqualTypeOf<string>();
        expectTypeOf(config.api.keyLength).toEqualTypeOf<number>();
        expectTypeOf(config.isConfigured).toEqualTypeOf<boolean>();
      });

      it('infers optional schema values correctly', () => {
        const config = createConfig(mockEnv, {
          schema: {
            optional: envvar('MISSING', z.string().optional()),
            withDefault: envvar('ALSO_MISSING', z.string().default('default')),
          },
        });

        expectTypeOf(config.optional).toEqualTypeOf<string | undefined>();
        expectTypeOf(config.withDefault).toEqualTypeOf<string>();
      });

      it('infers raw parameter type correctly in computed functions', () => {
        createConfig(mockEnv, {
          schema: {
            db: {
              host: envvar('DB_HOST', z.string()),
              port: envvar('DB_PORT', z.coerce.number()),
            },
          },
          computed: {
            test: (raw) => {
              // Verify raw parameter has correct type
              expectTypeOf(raw.db.host).toEqualTypeOf<string>();
              expectTypeOf(raw.db.port).toEqualTypeOf<number>();
              return true;
            },
          },
        });
      });
    });
  });
});
