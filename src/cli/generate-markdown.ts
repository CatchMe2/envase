import type {ExtractedEnvvar} from "./extract-envvars.ts";

/**
 * Extracts the type string from a JSON Schema.
 */
function extractType(schema: JSONSchema): string {
  if (Array.isArray(schema.type)) {
    return schema.type.join(' | ');
  }
  if (schema.type) {
    return schema.type;
  }
  if (schema.enum) {
    return schema.enum.map((v) => JSON.stringify(v)).join(' | ');
  }
  if (schema.anyOf) {
    return schema.anyOf.map(extractType).join(' | ');
  }
  if (schema.oneOf) {
    return schema.oneOf.map(extractType).join(' | ');
  }
  return 'unknown';
}

/**
 * Extracts constraint information from a JSON Schema.
 */
function extractConstraints(schema: JSONSchema): string[] {
  const constraints: string[] = [];

  if (schema.minimum !== undefined) {
    constraints.push(`Minimum: ${schema.minimum}`);
  }
  if (schema.maximum !== undefined) {
    constraints.push(`Maximum: ${schema.maximum}`);
  }
  if (schema.minLength !== undefined) {
    constraints.push(`Min length: ${schema.minLength}`);
  }
  if (schema.maxLength !== undefined) {
    constraints.push(`Max length: ${schema.maxLength}`);
  }
  if (schema.pattern) {
    constraints.push(`Pattern: \`${schema.pattern}\``);
  }
  if (schema.format) {
    constraints.push(`Format: ${schema.format}`);
  }
  if (schema.enum) {
    const enumValues = schema.enum.map((v) => JSON.stringify(v)).join(', ');
    constraints.push(`Allowed values: ${enumValues}`);
  }

  return constraints;
}

/**
 * Determines if an environment variable is required based on its schema.
 */
function isRequired(schema: JSONSchema): boolean {
  // Has explicit default = optional
  if ('default' in schema) {
    return false;
  }

  // Type includes null = optional
  if (Array.isArray(schema.type) && schema.type.includes('null')) {
    return false;
  }
  if (schema.type === 'null') {
    return false;
  }

  // Otherwise, assume required
  return true;
}

/**
 * Groups environment variables by their nested path.
 */
const groupByPath = (
  extractedEnvvars: ExtractedEnvvar[],
  ): Map<string, ExtractedEnvvar[]> => {
  const envvarByPath = new Map<string, ExtractedEnvvar[]>();

  for (const envvar of extractedEnvvars) {
    const key = envvar.path.length > 0 ? envvar.path.join('.') : '';

    const existingEntry = envvarByPath.get(key)

    if (existingEntry) {
      existingEntry.push(envvar);
    } else {
      envvarByPath.set(key, [envvar]);
    }
  }

  return envvarByPath;
}

/**
 * Generates markdown documentation from JSON Schema outputs.
 */
export const generateMarkdown = (
  extractedEnvvars: ExtractedEnvvar[],
): string => {
  const lines: string[] = ['# Environment Variables', ''];

  const envvarsByPath = groupByPath(extractedEnvvars);

  for (const [path, envvars] of envvarsByPath.entries()) {
    const pathParts = path.split('.');
    const last = pathParts.at(-1)
    const pathLevel = path.split('.').length

    if (path !== '') {
      lines.push(`#${'#'.repeat(pathLevel)} ${last}`, '');
    }

    for (const envvar of envvars) {
      lines.push(`**${envvar.envName}**`)
    }
    // // Type
    // const type = extractType(schema);
    // lines.push(`**Type**: \`${type}\`  `);
    //
    // // Required/Optional
    // const required = isRequired(schema);
    // lines.push(`**Required**: ${required ? 'Yes' : 'No'}  `);
    //
    // // Default value
    // if ('default' in schema && schema.default !== undefined) {
    //   lines.push(`**Default**: \`${JSON.stringify(schema.default)}\`  `);
    // }
    //
    // // Description
    // if (schema.description) {
    //   lines.push(`**Description**: ${schema.description}  `);
    // }
    //
    // // Constraints
    // const constraints = extractConstraints(schema);
    // if (constraints.length > 0) {
    //   lines.push('**Constraints**:');
    //   for (const constraint of constraints) {
    //     lines.push(`- ${constraint}`);
    //   }
    // }
    //
    // // Config path
    // if (path.length > 0) {
    //   const configPath = [...path, envName].join('.');
    //   lines.push(`**Config Path**: \`${configPath}\`  `);
    // }
    //
    // lines.push('', '---', '');
  }

  return lines.join('\n');
}
