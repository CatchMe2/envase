import type { StandardSchemaV1 } from '@standard-schema/spec';
import { EnvaseError } from './errors/envase-error.ts';
import type {
  EnvSchema,
  EnvvarEntry,
  EnvvarValidationIssue,
  ParseEnvOutput,
} from './types.ts';

export const envvar = <T extends StandardSchemaV1>(
  name: string,
  schema: T,
): EnvvarEntry<T> => [name, schema];

export const parseEnv = <T extends EnvSchema>(
  env: Record<string, string | undefined>,
  envSchema: T,
): ParseEnvOutput<T> => {
  const envvarValidationIssues: EnvvarValidationIssue[] = [];

  // biome-ignore lint/suspicious/noExplicitAny: Explicit 'any' is required due to nature of recursive processing
  const parseConfigObject = (schema: EnvSchema): any => {
    return Object.fromEntries(
      Object.entries(schema).map(([key, value]) => {
        if (Array.isArray(value)) {
          const [envvarName, schema] = value;
          const envvarValue = env[envvarName];

          const result = schema['~standard'].validate(envvarValue);

          if (
            result instanceof Promise ||
            ('then' in result && typeof result.then === 'function')
          ) {
            throw new Error(
              `Schema validation for envvar "${envvarName}" must be synchronous`,
            );
          }

          if (result.issues) {
            envvarValidationIssues.push({
              name: envvarName,
              value: envvarValue,
              messages: result.issues.map(({ message }) => message),
            });

            return [key, null];
          }

          return [key, result.value];
        }

        return [key, parseConfigObject(value)];
      }),
    );
  };

  const config = parseConfigObject(envSchema);

  if (envvarValidationIssues.length > 0) {
    throw new EnvaseError(envvarValidationIssues);
  }

  const nodeEnv = env.NODE_ENV;

  return {
    ...config,
    isProduction: nodeEnv === 'production',
    isTest: nodeEnv === 'test',
    isDevelopment: nodeEnv === 'development',
  };
};
