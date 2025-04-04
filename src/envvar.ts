import type { StandardSchemaV1 } from '@standard-schema/spec';

export type EnvvarEntry<T> = [string, StandardSchemaV1<T>];

export const envvar = <T>(
  name: string,
  schema: StandardSchemaV1<T>,
): EnvvarEntry<T> => [name, schema];
