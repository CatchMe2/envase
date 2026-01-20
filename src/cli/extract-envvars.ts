import type { EnvSchema } from '../types.ts';
import type {StandardJSONSchemaV1, StandardSchemaV1} from "../standard-schema.ts";

export interface ExtractedEnvvar {
  /** Environment variable name */
  envName: string;
  /** Nested path (e.g., ['app', 'listen']) */
  path: string[];
  /** Standard Schema instance */
  schema: StandardSchemaV1 & StandardJSONSchemaV1;
}

const isStandardJsonSchema = (value: unknown): value is StandardJSONSchemaV1 => {
  return value !== null && typeof value === 'object' && '~standard' in value && value['~standard'] !== null && typeof value['~standard'] === 'object' && 'jsonSchema' in value['~standard'];
}

/**
 * Extracts all envvar entries from a nested envase schema.
 * Recursively traverses the schema tree to find all [name, schema] tuples.
 */
export const extractEnvvars = (
  schema: EnvSchema,
  path: string[] = [],
): ExtractedEnvvar[] => {
  const extractedEnvvars: ExtractedEnvvar[] = [];

  for (const [key, value] of Object.entries(schema)) {
    if (Array.isArray(value)) {
      const [envName, standardSchema] = value;

      if (!isStandardJsonSchema(standardSchema)) {
        throw new Error('Passed schema is not json schema')
      }

      extractedEnvvars.push({
        envName,
        path,
        schema: standardSchema,
      });
    } else {
      extractedEnvvars.push(...extractEnvvars(value, [...path, key]));
    }
  }

  return extractedEnvvars;
}
