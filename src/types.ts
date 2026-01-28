import type { SimplifyDeep } from 'type-fest';
import type { StandardSchemaV1 } from './standard-schema.ts';

export type NodeEnvInfo = {
  isProduction: boolean;
  isTest: boolean;
  isDevelopment: boolean;
};

export type EnvvarEntry<T extends StandardSchemaV1> = [string, T];

export type EnvSchema = {
  [key: string]: EnvSchema | EnvvarEntry<StandardSchemaV1>;
};

type RecursiveInferEnv<T extends EnvSchema> = {
  [K in keyof T]: T[K] extends EnvvarEntry<infer Schema>
    ? StandardSchemaV1.InferOutput<Schema>
    : T[K] extends EnvSchema
      ? RecursiveInferEnv<T[K]>
      : never;
};

export type InferEnv<T extends EnvSchema> = SimplifyDeep<RecursiveInferEnv<T>>;

export type EnvvarValidationIssue = {
  name: string;
  value?: string;
  messages: string[];
};

// Schema for computed values - keys map to resolver functions
export type ComputedSchema<TRaw> = Record<string, (raw: TRaw) => unknown>;

// Infer output types from computed schema
export type InferComputed<T> = {
  // biome-ignore lint/suspicious/noExplicitAny: Required for type inference
  [K in keyof T]: T[K] extends (raw: any) => infer R ? R : never;
};

// Combined result type (raw config merged with computed values)
export type InferConfig<TRaw, TComputed> = SimplifyDeep<
  TRaw & InferComputed<TComputed>
>;
