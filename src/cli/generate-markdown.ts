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
    if (!envvarsByPath.has(key)) {
      envvarsByPath.set(key, []);
    }
    envvarsByPath.get(key)?.push(envvar);
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
      const schema = envvar.schema['~standard'].jsonSchema.output({
        target: 'openapi-3.0',
      });

      const mappedType = Array.isArray(schema.anyOf) ? schema.anyOf.map((schema) => schema.type) : schema.type;

      const type = Array.isArray(mappedType)
        ? mappedType.map((type) => `\`${type}\``).join(' | ')
        : `\`${mappedType}\``;

      const validationResult = envvar.schema['~standard'].validate(undefined);
      const isOptional = 'value' in validationResult;

      let line = `- \`${envvar.envName}\` (${isOptional ? 'optional' : 'required'})`;

      line += `  \n  Type: ${type}`;

      if (schema.description) {
        line += `  \n  Description: ${schema.description}`;
      }

      if (Array.isArray(schema.enum)) {
        const enumValues = schema.enum.map((v) => `\`${v}\``).join(' | ');
        line += `  \n  Supported values: ${enumValues}`;
      }

      if (schema.format) {
        line += `  \n  Format: \`${schema.format}\``;
      }
      if (schema.pattern) {
        line += `  \n  Pattern: \`${schema.pattern}\``;
      }
      if (schema.minimum !== undefined) {
        line += `  \n  Min value: \`${schema.minimum}\``;
      }
      if (schema.maximum !== undefined) {
        line += `  \n  Max value: \`${schema.maximum}\``;
      }
      if (schema.minLength !== undefined) {
        line += `  \n  Min length: \`${schema.minLength}\``;
      }
      if (schema.maxLength !== undefined) {
        line += `  \n  Max length: \`${schema.maxLength}\``;
      }
      if (schema.default !== undefined) {
        line += `  \n  Default: \`${schema.default}\``;
      }

      lines.push(line, '');
    }
  }

  return lines.join('\n');
};
