import type { ExtractedEnvvar } from './extract-envvars.ts';

/**
 * Generates markdown documentation from extracted environment variables.
 */
export const generateMarkdown = (
	extractedEnvvars: ExtractedEnvvar[],
): string => {
	const lines: string[] = ['# List of environment variables', ''];

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

			const type = Array.isArray(schema.type) ? schema.type.join(' | ') : schema.type;

			const validationResult = envvar.schema['~standard'].validate(undefined);
			const isOptional = 'value' in validationResult;

			const requiredPrefix = isOptional ? '' : '**(REQUIRED)**';
			let line = `- ${requiredPrefix}\`${envvar.envName}\` *(${type})*`;

			if (schema.description) {
				line += `  \n  ${schema.description}`;
			}

			if (Array.isArray(schema.enum)) {
				const enumValues = schema.enum
					.map((v) => `\`${v}\``)
					.join(' | ');
				line += `  \n  Supported values: ${enumValues}`;
			}

      if (schema.pattern) {
        line += `  \n  Pattern: \`${schema.pattern}\``;
      }
      if (schema.format) {
        line += `  \n  Format: \`${schema.format}\``;
      }
      if (schema.default) {
        line += `  \n  Default: \`${schema.default}\``;
      }
			if (schema.minimum !== undefined) {
				line += `  \n  Minimum: \`${schema.minimum}\``;
			}
			if (schema.maximum !== undefined) {
				line += `  \n  Maximum: \`${schema.maximum}\``;
			}
			if (schema.minLength !== undefined) {
				line += `  \n  Min length: \`${schema.minLength}\``;
			}
			if (schema.maxLength !== undefined) {
				line += `  \n  Max length: \`${schema.maxLength}\``;
			}

			lines.push(line, '');
		}
	}

	return lines.join('\n');
};
