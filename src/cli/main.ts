#!/usr/bin/env node

import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { cac } from 'cac';
import { extractEnvvars } from './extract-envvars.ts';
import { generateMarkdown } from './generate-markdown.ts';
import { loadSchema } from './load-schema.ts';

const cli = cac('envase');

cli
  .command(
    'generate <schemaPath>',
    'Generate markdown documentation from environment schema',
  )
  .option('-o, --output <file>', 'Output markdown file path', {
    default: './env-docs.md',
  })
  .example('envase generate ./config.js -o docs/environment.md')
  .action(
    async (
      schemaPath: string,
      options: {
        output: string;
      },
    ) => {
      try {
        console.log('📖 Loading schema from:', schemaPath);
        const schema = await loadSchema(schemaPath);
        const extractedEnvvars = extractEnvvars(schema);

        console.log('📝 Generating markdown documentation...');
        const markdown = generateMarkdown(extractedEnvvars);

        const outputPath = resolve(process.cwd(), options.output);
        await writeFile(outputPath, markdown, 'utf-8');
        console.log(`✓ Documentation generated: ${outputPath}`);
      } catch (error) {
        console.error(
          'Error:',
          error instanceof Error ? error.message : String(error),
        );
        process.exit(1);
      }
    },
  );

cli.help();
cli.parse();
