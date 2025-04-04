import type { EnvvarEntry } from './envvar.ts';
import { type EnvvarValidationError, ParseEnvError } from './error.ts';

type EnvSchema = {
  [key: string]: EnvSchema | EnvvarEntry<unknown>;
};

type DepthLevels = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

type InferEnv<
  T extends EnvSchema,
  DepthLimit extends number = 10,
> = DepthLimit extends 0
  ? never
  : {
      [K in keyof T]: T[K] extends EnvvarEntry<infer U>
        ? U
        : T[K] extends EnvSchema
          ? InferEnv<T[K], DepthLevels[DepthLimit]>
          : never;
    };

type NodeEnvInfo = {
  isProduction: boolean;
  isTest: boolean;
  isDevelopment: boolean;
};

export const parseEnv = <T extends EnvSchema>(
  env: Record<string, string | undefined>,
  envSchema: T,
): InferEnv<T> & NodeEnvInfo => {
  const envvarValidationErrors: EnvvarValidationError[] = [];

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
            envvarValidationErrors.push({
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

  if (envvarValidationErrors.length > 0) {
    throw new ParseEnvError(envvarValidationErrors);
  }

  const nodeEnv = env.NODE_ENV;

  return {
    ...config,
    isProduction: nodeEnv === 'production',
    isTest: nodeEnv === 'test',
    isDevelopment: nodeEnv === 'development',
  };
};
