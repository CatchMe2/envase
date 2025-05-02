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
