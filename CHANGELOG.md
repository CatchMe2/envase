# envase

## 2.1.0

### Minor Changes

- 3667296: Export the `EnvvarEntry` type so schemas built with `envvar` can be named in declaration emit, and the `EnvSchema` type so generic helpers can constrain a schema parameter the way `parseEnv` and `createConfig` do.

### Patch Changes

- 0adef22: Bump `type-fest` to ^5.10.0

## 2.0.0

### Major Changes

- 996765e: Report a validation error when an empty or whitespace-only envvar is coerced to `0` (e.g. `z.coerce.number()` with `PORT=`), instead of silently resolving it to `0`.

### Minor Changes

- 996765e: Add `emptyStringAsUndefined` option to `parseEnv` and `createConfig` that treats empty envvars as missing, so `.default()` and `.optional()` apply to them.
- 9dedfbf: Add `sensitive` option to `envvar` that redacts the received value from validation errors and marks the envvar as sensitive in generated documentation.
