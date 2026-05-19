import type { ExtractedEnvvar } from './extract-envvars.ts';

/**
 * Generates markdown documentation from extracted environment variables.
 */
export const generateMarkdown = (
  extractedEnvvars: ExtractedEnvvar[],
): string => {
  const lines: string[] = ['# Environment variables', ''];

  const envvarsByPath = new Map<string, ExtractedEnvvar[]>();

  for (const envvar of extractedEnvvars) {
    const key = envvar.path.length > 0 ? envvar.path.join('.') : '';

    const envvars = envvarsByPath.get(key);

    if (envvars) {
      envvars.push(envvar);
    } else {
      envvarsByPath.set(key, [envvar]);
    }
  }

  for (const [path, envvars] of envvarsByPath.entries()) {
    if (path !== '') {
      const pathParts = path.split('.');
      const sectionName = pathParts
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');

      lines.push(`## ${sectionName}`, '');
    }

    for (const envvar of envvars) {
      const jsonSchemaOptions = {
        target: 'openapi-3.0',
        libraryOptions: {
          unrepresentable: 'any',
        },
      };

      const inputSchema =
        envvar.schema['~standard'].jsonSchema.input(jsonSchemaOptions);
      const outputSchema =
        envvar.schema['~standard'].jsonSchema.output(jsonSchemaOptions);

      const mappedType = Array.isArray(outputSchema.anyOf)
        ? outputSchema.anyOf.map(({ type }) => type)
        : (outputSchema.type ?? inputSchema.type);

      const type = Array.isArray(mappedType)
        ? mappedType.map((type) => `\`${type}\``).join(' | ')
        : `\`${mappedType}\``;

      const validationResult = envvar.schema['~standard'].validate(undefined);
      const isOptional = 'value' in validationResult;

      let line = `- \`${envvar.envName}\` (${isOptional ? 'optional' : 'required'})`;

      line += `  \n  Type: ${type}`;

      if (inputSchema.description) {
        line += `  \n  Description: ${inputSchema.description}`;
      }

      if (Array.isArray(inputSchema.enum)) {
        const enumValues = inputSchema.enum.map((v) => `\`${v}\``).join(' | ');
        line += `  \n  Supported values: ${enumValues}`;
      }

      if (inputSchema.format) {
        line += `  \n  Format: \`${inputSchema.format}\``;
      }
      if (inputSchema.pattern) {
        line += `  \n  Pattern: \`${inputSchema.pattern}\``;
      }
      if (
        inputSchema.minimum !== undefined &&
        !(
          inputSchema.type === 'integer' &&
          inputSchema.minimum === Number.MIN_SAFE_INTEGER
        )
      ) {
        line += `  \n  Min value: \`${inputSchema.minimum}\``;
      }
      if (
        inputSchema.maximum !== undefined &&
        !(
          inputSchema.type === 'integer' &&
          inputSchema.maximum === Number.MAX_SAFE_INTEGER
        )
      ) {
        line += `  \n  Max value: \`${inputSchema.maximum}\``;
      }
      if (inputSchema.minLength !== undefined) {
        line += `  \n  Min length: \`${inputSchema.minLength}\``;
      }
      if (inputSchema.maxLength !== undefined) {
        line += `  \n  Max length: \`${inputSchema.maxLength}\``;
      }
      if (inputSchema.default !== undefined) {
        line += `  \n  Default: \`${inputSchema.default}\``;
      }

      lines.push(line, '');
    }
  }

  return lines.join('\n');
};
