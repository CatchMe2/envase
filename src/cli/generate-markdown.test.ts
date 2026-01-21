import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import type { ExtractedEnvvar } from './extract-envvars.ts';
import { generateMarkdown } from './generate-markdown.ts';

describe('generateMarkdown', () => {
  it('generates markdown for a single required environment variable', () => {
    const extractedEnvvars: ExtractedEnvvar[] = [
      {
        envName: 'API_KEY',
        path: [],
        schema: z.string(),
      },
    ];

    const markdown = generateMarkdown(extractedEnvvars);

    expect(markdown).toContain('# Environment variables');
    expect(markdown).toContain('**(REQUIRED)**`API_KEY`');
    expect(markdown).toContain('*(string)*');
  });

  it('generates markdown for optional environment variables', () => {
    const extractedEnvvars: ExtractedEnvvar[] = [
      {
        envName: 'OPTIONAL_VAR',
        path: [],
        schema: z.string().optional(),
      },
    ];

    const markdown = generateMarkdown(extractedEnvvars);

    expect(markdown).toContain('`OPTIONAL_VAR`');
    expect(markdown).not.toContain('**(REQUIRED)**`OPTIONAL_VAR`');
  });

  it('generates markdown with descriptions', () => {
    const extractedEnvvars: ExtractedEnvvar[] = [
      {
        envName: 'API_KEY',
        path: [],
        schema: z.string().describe('Your API key for authentication'),
      },
    ];

    const markdown = generateMarkdown(extractedEnvvars);

    expect(markdown).toContain('Your API key for authentication');
  });

  it('generates markdown with enum values', () => {
    const extractedEnvvars: ExtractedEnvvar[] = [
      {
        envName: 'LOG_LEVEL',
        path: [],
        schema: z.enum(['debug', 'info', 'warn', 'error']),
      },
    ];

    const markdown = generateMarkdown(extractedEnvvars);

    expect(markdown).toContain('Supported values:');
    expect(markdown).toContain('`debug`');
    expect(markdown).toContain('`info`');
    expect(markdown).toContain('`warn`');
    expect(markdown).toContain('`error`');
  });

  it('generates markdown with default values', () => {
    const extractedEnvvars: ExtractedEnvvar[] = [
      {
        envName: 'PORT',
        path: [],
        schema: z.number().default(3000),
      },
    ];

    const markdown = generateMarkdown(extractedEnvvars);

    expect(markdown).toContain('Default: `3000`');
  });

  it('generates markdown with min/max constraints', () => {
    const extractedEnvvars: ExtractedEnvvar[] = [
      {
        envName: 'PORT',
        path: [],
        schema: z.number().min(1000).max(9999),
      },
    ];

    const markdown = generateMarkdown(extractedEnvvars);

    expect(markdown).toContain('Minimum: `1000`');
    expect(markdown).toContain('Maximum: `9999`');
  });

  it('generates markdown with minLength/maxLength constraints', () => {
    const extractedEnvvars: ExtractedEnvvar[] = [
      {
        envName: 'API_KEY',
        path: [],
        schema: z.string().min(10).max(100),
      },
    ];

    const markdown = generateMarkdown(extractedEnvvars);

    expect(markdown).toContain('Min length: `10`');
    expect(markdown).toContain('Max length: `100`');
  });

  it('generates markdown with pattern', () => {
    const extractedEnvvars: ExtractedEnvvar[] = [
      {
        envName: 'EMAIL',
        path: [],
        schema: z.string().regex(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/),
      },
    ];

    const markdown = generateMarkdown(extractedEnvvars);

    expect(markdown).toContain('Pattern:');
  });

  it('groups environment variables by path', () => {
    const extractedEnvvars: ExtractedEnvvar[] = [
      {
        envName: 'DB_HOST',
        path: ['database'],
        schema: z.string(),
      },
      {
        envName: 'DB_PORT',
        path: ['database'],
        schema: z.number(),
      },
      {
        envName: 'API_KEY',
        path: [],
        schema: z.string(),
      },
    ];

    const markdown = generateMarkdown(extractedEnvvars);

    expect(markdown).toContain('## Database');
    expect(markdown).toContain('`DB_HOST`');
    expect(markdown).toContain('`DB_PORT`');
    expect(markdown).toContain('`API_KEY`');
  });

  it('generates markdown for deeply nested paths', () => {
    const extractedEnvvars: ExtractedEnvvar[] = [
      {
        envName: 'DB_HOST',
        path: ['app', 'database', 'connection'],
        schema: z.string(),
      },
    ];

    const markdown = generateMarkdown(extractedEnvvars);

    expect(markdown).toContain('## App Database Connection');
  });

  it('handles empty array of environment variables', () => {
    const extractedEnvvars: ExtractedEnvvar[] = [];

    const markdown = generateMarkdown(extractedEnvvars);

    expect(markdown).toContain('# Environment variables');
    expect(markdown.trim()).toBe('# Environment variables');
  });

  it('handles multiple types in union', () => {
    const extractedEnvvars: ExtractedEnvvar[] = [
      {
        envName: 'VALUE',
        path: [],
        schema: z.union([z.string(), z.number()]),
      },
    ];

    const markdown = generateMarkdown(extractedEnvvars);

    expect(markdown).toContain('`VALUE`');
  });
});
