#!/usr/bin/env node

import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { cac } from 'cac';
import { extractEnvvars} from './extract-envvars.ts';
import { generateMarkdown } from './generate-markdown.ts';
import { loadSchema } from './load-schema.ts';


const main = cac('envase-docs');

main
  .command(
    '<schema>',
    'Generate markdown documentation from environment schema',
  )
  .option('-o, --output <file>', 'Output markdown file path', {
    default: './env-docs.md',
  })
  .option(
    '-f, --format <format>',
    'JSON Schema format (draft-07, draft-2020-12, openapi-3.0)',
    {
      default: 'draft-2020-12',
    },
  )
  .option('--no-groups', 'Disable grouping by nested structure')
  .example('envase-docs ./config.js -o docs/environment.md')
  .example('envase-docs ./dist/config.js --format draft-07')
  .action(
    async (
      schemaPath: string,
      options: {
        output: string;
        format: string;
        groups: boolean;
      },
    ) => {
      try {
        console.log('📖 Loading schema from:', schemaPath);
        const schema = await loadSchema(schemaPath);

        const extractedEnvvars = extractEnvvars(schema);

        console.log('📝 Generating markdown documentation...');
        const markdown = generateMarkdown(extractedEnvvars);

        const outputPath = resolve(process.cwd(), options.output);
        // await writeFile(outputPath, markdown, 'utf-8');
console.log(markdown)
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

main.help();
// main.version(version);

main.parse();
