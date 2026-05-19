import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import type { ExtractedEnvvar } from './extract-envvars.ts';
import { generateMarkdown } from './generate-markdown.ts';

const stringToNumberSchema = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess(
    (val): number | undefined =>
      val === undefined || val === '' ? undefined : Number(val),
    schema,
  );

describe('generateMarkdown', () => {
  it('handles empty array of environment variables', async () => {
    const extractedEnvvars: ExtractedEnvvar[] = [];

    const markdown = await generateMarkdown(extractedEnvvars);

    expect(markdown).toBe('# Environment variables\n');
  });

  it('generates complete markdown with all features', async () => {
    const extractedEnvvars: ExtractedEnvvar[] = [
      {
        envName: 'API_KEY',
        path: [],
        schema: z
          .string()
          .min(32)
          .max(255)
          .describe('Your API key for authentication'),
      },
      {
        envName: 'RATIO',
        path: [],
        schema: stringToNumberSchema(z.number()).describe('Cache hit ratio'),
      },
      {
        envName: 'SCORE_DELTA',
        path: [],
        schema: stringToNumberSchema(z.number().int()).describe(
          'Score adjustment, negative values reduce score',
        ),
      },
      {
        envName: 'LOG_LEVEL',
        path: ['app'],
        schema: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
      },
      {
        envName: 'PORT',
        path: ['app', 'server'],
        schema: stringToNumberSchema(
          z.number().int().min(1024).max(65535).default(3000),
        ).describe('Server port'),
      },
      {
        envName: 'HOST',
        path: ['app', 'server'],
        schema: z
          .string()
          .default('0.0.0.0')
          .transform((val) => val)
          .optional()
          .describe('Server host'),
      },
      {
        envName: 'DB_HOST',
        path: ['database'],
        schema: z.string().describe('Database host address'),
      },
      {
        envName: 'FEATURE_ENABLED',
        path: ['feature'],
        schema: z.stringbool().default(false).describe('Enable feature flag'),
      },
    ];

    const markdown = await generateMarkdown(extractedEnvvars);

    expect(markdown).toMatchSnapshot();
  });
});
