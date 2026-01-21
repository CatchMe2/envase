import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import type { ExtractedEnvvar } from './extract-envvars.ts';
import { generateMarkdown } from './generate-markdown.ts';

describe('generateMarkdown', () => {
  it('handles empty array of environment variables', () => {
    const extractedEnvvars: ExtractedEnvvar[] = [];

    const markdown = generateMarkdown(extractedEnvvars);

    expect(markdown).toBe('# Environment variables\n');
  });

  it('generates complete markdown with all features', () => {
    const extractedEnvvars: ExtractedEnvvar[] = [
      {
        envName: 'API_KEY',
        path: [],
        schema: z.string().min(32).describe('Your API key for authentication'),
      },
      {
        envName: 'LOG_LEVEL',
        path: ['app'],
        schema: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
      },
      {
        envName: 'PORT',
        path: ['app', 'server'],
        schema: z.number().min(1024).max(65535).default(3000).describe('Server port'),
      },
      {
        envName: 'HOST',
        path: ['app', 'server'],
        schema: z.string().default('0.0.0.0').optional().describe('Server host'),
      },
      {
        envName: 'DB_HOST',
        path: ['database'],
        schema: z.string().describe('Database host address'),
      },
    ];

    const markdown = generateMarkdown(extractedEnvvars);

    expect(markdown).toMatchInlineSnapshot(`
      "# Environment variables

      - \`API_KEY\` (required)
        Type: \`string\`
        Description: Your API key for authentication
        Min length: \`32\`

      ## App Server

      - \`PORT\` (optional)
        Type: \`number\`
        Description: Server port
        Min value: \`1024\`
        Max value: \`65535\`
        Default: \`3000\`

      - \`HOST\` (optional)
        Type: \`string\`
        Description: Server host
        Default: \`0.0.0.0\`

      ## App

      - \`LOG_LEVEL\` (optional)
        Type: \`string\`
        Supported values: \`debug\` | \`info\` | \`warn\` | \`error\`
        Default: \`info\`

      ## Database

      - \`DB_HOST\` (required)
        Type: \`string\`
        Description: Database host address
      "
    `);
  });
});
