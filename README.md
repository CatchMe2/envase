# EnvSchema

Type-safe environment variable validation with Standard Schema compliance.
Works with Zod, Valibot, ArkType, and other Standard Schema-compatible validation libraries.

## Highlights

- 🔒 **Type-safe validation** - Full TypeScript type inference
- 🔌 **Standard Schema compliant** - Works with any compatible validation library
- 🌐 **Runtime agnostic** - Runs anywhere (Node, Bun, Deno, browsers)
- 🏗️ **Structured configuration** - Supports nested config objects
- 🚦 **Environment detection** - `isProduction`, `isTest`, `isDevelopment` flags
- 📜 **Detailed error reporting** - See all validation failures at once
- 🚀 **Lightweight** - Zero dependencies

## Installation

```bash
npm install envschema
```

**Note**: This package is **ESM-only**. It does not support CommonJS `require(...)`.

## Validation Library Support

Built on the [Standard Schema](https://standardschema.dev) specification,
EnvSchema works seamlessly with any schema library that implements the spec.
See the [full list of compatible libraries](https://standardschema.dev#what-schema-libraries-implement-the-spec).

Popular options include:
- [Zod](https://zod.dev)
- [Valibot](https://valibot.dev)
- [ArkType](https://arktype.io)

## Key features

### Type-Safe Validation of Nested Schema

```typescript
const config = parseEnv(process.env, {
  app: {
    listen: {
      port: envvar('PORT', z.coerce.number().int().min(0).max(65535)),
    },
  },
  db: {
    host: envvar('DB_HOST', z.string().min(1)),
  },
  apiKey: envvar('API_KEY', z.string().min(32)),
});
// config.app.listen.port -> number
// config.db.host -> string
// config.apiKey -> string
```

### Environment Detection

```typescript
const config = parseEnv(process.env, {});
// config.isProduction -> boolean
// config.isDevelopment -> boolean
// config.isTest -> boolean
```

These flags are inferred from the `NODE_ENV` value (i.e. 'production', 'test', or 'development').

### Detailed error reporting

```typescript
import { parseEnv, envvar, EnvSchemaError } from 'envschema';
import { z } from 'zod';

try {
  parseEnv(process.env, {
    apiKey: envvar('API_KEY', z.string().min(32)),
    db: {
      host: envvar('DB_HOST', z.string().min(1)),
    },
  });
} catch (error: unknown) {
  if (EnvSchemaError.isInstance(error)) {
    error.message
    // Environment variables validation has failed:
    //   [API_KEY]:
    //     String must contain at least 32 character(s)
    //     (received: "short")
    //
    //   [DB_HOST]:
    //     Required
    //     (received: "undefined")

    error.issues
    //  [
    //    {
    //      "name": "API_KEY",
    //      "value": "short",
    //      "messages": ["String must contain at least 32 character(s)"]
    //    },
    //    {
    //      "name": "DB_HOST",
    //      "value": undefined,
    //      "messages": ["Required"]
    //    }
    //  ]
  }
}
```

### Type Inference

```typescript
const envSchema = {
  apiKey: envvar('API_KEY', z.string().min(32)),
  db: {
    host: envvar('DB_HOST', z.string().min(1)),
  },
};

type Config = InferEnv<typeof envSchema>;
// { apiKey: string; db: { host: string } }
```

## API Reference

### `envvar`

`envvar(name: string, schema: StandardSchemaV1<T>)`

Wraps a variable name and its schema for validation.
This helps pair the raw env name with the shape you expect it to conform to.

### `parseEnv`

`parseEnv(env: Record<string, string | undefined>, envSchema: T)`

Validates envvars against the schema and returns a typed configuration object
along with flags: `isProduction`, `isTest`, `isDevelopment`.

### `EnvSchemaError`

Thrown when validation fails.

Contains:
- `message`: Human-readable error summary
- `issues`: Array of validation issues with:
  - `name`: Environment variable name
  - `value`: Invalid value received
  - `messages`: Validation error messages

## Why EnvSchema?

Unlike tools like `zod-env`, `envalid`, or `dotenv-safe`, `EnvSchema`:

- ✅ Works with **any** schema lib that follows the [Standard Schema spec](https://standardschema.dev)
- 🔄 Supports **deeply nested** configs
- 🔍 Offers **rich error reporting** with detailed issue breakdowns

## Contributing

Contributions are welcome!
If you’d like to improve this package, feel free to open an issue or submit a pull request. 🚀
