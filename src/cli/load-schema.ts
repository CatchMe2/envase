import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { EnvSchema } from '../types.js';

/**
 * Loads an environment schema from a file using dynamic import.
 */
export const loadSchema = async (filePath: string): Promise<EnvSchema> => {
  const absolutePath = resolve(process.cwd(), filePath);

  if (!existsSync(absolutePath)) {
    throw new Error(`Schema file not found: ${filePath}`);
  }

  const fileUrl = pathToFileURL(absolutePath).href;
  const module = await import(fileUrl);

  const schema = module.default;

  if (typeof schema !== 'object' || schema === null) {
    throw new Error(
      'No schema export found. Please export your schema as: "export default { ... }"',
    );
  }

  return schema as EnvSchema;
};
