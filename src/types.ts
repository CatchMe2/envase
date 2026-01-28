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

// Resolver function type for computed values
// biome-ignore lint/suspicious/noExplicitAny: Required for type inference
type ComputedResolver = (raw: any) => unknown;

// Schema for computed values - can be nested objects or resolver functions
export type ComputedSchema<TRaw> = {
  [key: string]: ((raw: TRaw) => unknown) | ComputedSchema<TRaw>;
};

// Infer output types from computed schema (handles nested structures)
export type InferComputed<T> = {
  [K in keyof T]: T[K] extends ComputedResolver
    ? ReturnType<T[K]>
    : T[K] extends object
      ? InferComputed<T[K]>
      : never;
};

// Deep merge two types (TComputed values override TRaw where keys overlap)
type DeepMerge<TRaw, TComputed> = {
  [K in keyof TRaw | keyof TComputed]: K extends keyof TComputed
    ? K extends keyof TRaw
      ? TRaw[K] extends object
        ? TComputed[K] extends object
          ? DeepMerge<TRaw[K], TComputed[K]>
          : TComputed[K]
        : TComputed[K]
      : TComputed[K]
    : K extends keyof TRaw
      ? TRaw[K]
      : never;
};

// Combined result type (raw config deep merged with computed values)
export type InferConfig<TRaw, TComputed> = SimplifyDeep<
  DeepMerge<TRaw, InferComputed<TComputed>>
>;
