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

// Helper to check if value is a resolver function
const isResolver = (value: unknown): value is (raw: unknown) => unknown =>
  typeof value === 'function';

// Helper to process computed schema recursively
const processComputed = (
  computed: Record<string, unknown>,
  rawConfig: unknown,
): Record<string, unknown> => {
  return Object.fromEntries(
    Object.entries(computed).map(([key, value]) => [
      key,
      isResolver(value)
        ? value(rawConfig)
        : processComputed(value as Record<string, unknown>, rawConfig),
    ]),
  );
};

// Helper to deep merge two objects
const deepMerge = (
  target: Record<string, unknown>,
  source: Record<string, unknown>,
): Record<string, unknown> => {
  const result = { ...target };

  for (const key of Object.keys(source)) {
    const sourceValue = source[key];
    const targetValue = result[key];

    if (
      sourceValue &&
      typeof sourceValue === 'object' &&
      !Array.isArray(sourceValue) &&
      targetValue &&
      typeof targetValue === 'object' &&
      !Array.isArray(targetValue)
    ) {
      result[key] = deepMerge(
        targetValue as Record<string, unknown>,
        sourceValue as Record<string, unknown>,
      );
    } else {
      result[key] = sourceValue;
    }
  }

  return result;
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

  // Compute derived values (handles nested structures)
  const computedValues = processComputed(
    options.computed as Record<string, unknown>,
    rawConfig,
  );

  // Deep merge raw config with computed values
  return deepMerge(rawConfig as Record<string, unknown>, computedValues);
}
