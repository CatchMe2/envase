import type { StandardSchemaV1 } from '@standard-schema/spec';
import { EnvSchemaError } from './errors/env-schema-error.ts';
import type {
  EnvSchema,
  EnvvarEntry,
  EnvvarValidationIssue,
  InferEnv,
  NodeEnvInfo,
} from './types.ts';

export const envvar = <T>(
  name: string,
  schema: StandardSchemaV1<T>,
): EnvvarEntry<T> => [name, schema];

export const parseEnv = <T extends EnvSchema>(
  env: Record<string, string | undefined>,
  envSchema: T,
): InferEnv<T> & NodeEnvInfo => {
  const envvarValidationIssues: EnvvarValidationIssue[] = [];

  // biome-ignore lint/suspicious/noExplicitAny: Explicit 'any' is required due to nature of recursive processing
  const parseConfigObject = (schema: EnvSchema): any => {
    return Object.fromEntries(
      Object.entries(schema).map(([key, value]) => {
        if (Array.isArray(value)) {
          const [envvarName, schema] = value;
          const envvarValue = env[envvarName];

          const result = schema['~standard'].validate(envvarValue);

          if (result instanceof Promise) {
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

  const config = parseConfigObject(envSchema) as InferEnv<T>;

  if (envvarValidationIssues.length > 0) {
    throw new EnvSchemaError(envvarValidationIssues);
  }

  const nodeEnv = env.NODE_ENV;

  return {
    ...config,
    isProduction: nodeEnv === 'production',
    isTest: nodeEnv === 'test',
    isDevelopment: nodeEnv === 'development',
  };
};
