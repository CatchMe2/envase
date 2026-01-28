import { EnvaseError } from './errors/envase-error.ts';
import type { StandardSchemaV1 } from './standard-schema.ts';
import type {
  ComputedSchema,
  EnvSchema,
  EnvvarEntry,
  EnvvarValidationIssue,
  InferConfig,
  InferEnv,
  NodeEnvInfo,
} from './types.ts';

export const detectNodeEnv = (
  env: Record<string, string | undefined>,
): NodeEnvInfo => {
  const nodeEnv = env.NODE_ENV;

  return {
    isProduction: nodeEnv === 'production',
    isTest: nodeEnv === 'test',
    isDevelopment: nodeEnv === 'development',
  };
};

export const envvar = <T extends StandardSchemaV1>(
  name: string,
  schema: T,
): EnvvarEntry<T> => [name, schema];

export const parseEnv = <T extends EnvSchema>(
  env: Record<string, string | undefined>,
  envSchema: T,
): InferEnv<T> => {
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

  return config;
};

// Overload: without computed
export function createConfig<TSchema extends EnvSchema>(
  env: Record<string, string | undefined>,
  options: {
    schema: TSchema;
    computed?: undefined;
  },
): InferEnv<TSchema>;

// Overload: with computed
export function createConfig<
  TSchema extends EnvSchema,
  const TComputed extends ComputedSchema<InferEnv<TSchema>>,
>(
  env: Record<string, string | undefined>,
  options: {
    schema: TSchema;
    computed: TComputed;
  },
): InferConfig<InferEnv<TSchema>, TComputed>;

// Implementation
export function createConfig<
  TSchema extends EnvSchema,
  TComputed extends ComputedSchema<InferEnv<TSchema>>,
>(
  env: Record<string, string | undefined>,
  options: {
    schema: TSchema;
    computed?: TComputed;
  },
  // biome-ignore lint/suspicious/noExplicitAny: Required for overload implementation
): any {
  // Parse raw config using existing parseEnv
  const rawConfig = parseEnv(env, options.schema);

  // If no computed values, return raw config
  if (!options.computed) {
    return rawConfig;
  }

  // Compute derived values
  const computedValues = Object.fromEntries(
    Object.entries(options.computed).map(([key, resolver]) => [
      key,
      resolver(rawConfig),
    ]),
  );

  // Merge raw config with computed values
  return Object.assign({}, rawConfig, computedValues);
}
