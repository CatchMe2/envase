import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { envvar } from '../core.ts';
import { extractEnvvars } from './extract-envvars.ts';

describe('extractEnvvars', () => {
  it('extracts flat environment variables', () => {
    const portSchema = z.number();
    const apiKeySchema = z.string();

    const schema = {
      port: envvar('PORT', portSchema),
      apiKey: envvar('API_KEY', apiKeySchema),
    };

    const result = extractEnvvars(schema);

    expect(result).toEqual([
      { envName: 'PORT', path: [], schema: portSchema },
      { envName: 'API_KEY', path: [], schema: apiKeySchema },
    ]);
  });

  it('extracts nested environment variables', () => {
    const hostSchema = z.string();
    const portSchema = z.number();

    const schema = {
      db: {
        host: envvar('DB_HOST', hostSchema),
        port: envvar('DB_PORT', portSchema),
      },
    };

    const result = extractEnvvars(schema);

    expect(result).toEqual([
      { envName: 'DB_HOST', path: ['db'], schema: hostSchema },
      { envName: 'DB_PORT', path: ['db'], schema: portSchema },
    ]);
  });

  it('extracts deeply nested environment variables', () => {
    const hostSchema = z.string();

    const schema = {
      app: {
        database: {
          connection: {
            host: envvar('DB_HOST', hostSchema),
          },
        },
      },
    };

    const result = extractEnvvars(schema);

    expect(result).toEqual([
      { envName: 'DB_HOST', path: ['app', 'database', 'connection'], schema: hostSchema },
    ]);
  });

  it('extracts mixed flat and nested environment variables', () => {
    const apiKeySchema = z.string();
    const portSchema = z.number();

    const schema = {
      apiKey: envvar('API_KEY', apiKeySchema),
      server: {
        port: envvar('PORT', portSchema),
      },
    };

    const result = extractEnvvars(schema);

    expect(result).toEqual([
      { envName: 'API_KEY', path: [], schema: apiKeySchema },
      { envName: 'PORT', path: ['server'], schema: portSchema },
    ]);
  });

  it('throws error if schema is not a Standard JSON Schema', () => {
    const invalidSchema = {
      port: ['PORT', 'not-a-schema'],
    };

    // @ts-ignore
    expect(() => extractEnvvars(invalidSchema)).toThrow(
      'Path "port" does not contain a valid standard json schema',
    );
  });

  it('handles empty schema', () => {
    const schema = {};

    const result = extractEnvvars(schema);

    expect(result).toHaveLength(0);
  });
});
