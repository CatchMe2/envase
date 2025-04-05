# EnvSchema

Type-safe environment variable validation with Standard Schema compliance.
Works with Zod, Valibot, ArkType, and other Standard Schema-compatible validation libraries.

## Highlights

- 🔒 **Type-safe validation** - Full TypeScript type inference
- 🔌 **Standard Schema compliant** - Works with any compatible validation library
- 🌐 **Runtime agnostic** - Runs anywhere (Node, Bun, Deno, browsers)
- 🏗️ **Structured configuration** - Supports nested config objects
- 🚦 **Built-in environment detection** - `isProduction`, `isDevelopment`, `isTest` flags
- 📜 **Detailed error reporting** - See all validation failures at once
- 🚀 **Lightweight** - Zero dependencies

## Installation

```bash
npm install envschema
```

## Validation Library Support

Built on the [Standard Schema](https://standardschema.dev) specification,
EnvSchema works seamlessly with any schema library that implements the spec.
See the [full list of compatible libraries](https://standardschema.dev#what-schema-libraries-implement-the-spec).

Popular options include:
- [Zod](https://zod.dev)
- [Valibot](https://valibot.dev)
- [ArkType](https://arktype.io)

## Key features

### Type-Safe Validation

```typescript
import { parseEnv, envvar } from 'envschema';
import { z } from 'zod';

const config = parseEnv(process.env, {
  apiKey: envvar('API_KEY', z.string().min(32)),
  timeout: envvar('TIMEOUT', z.coerce.number().int().default(5000)),
});
// config.apiKey -> string
// config.timeout -> number
```

### Nested Configuration

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
});
// config.app.listen.port -> number
// config.db.host -> string
```

### Built-in Environment Detection

```typescript
const config = parseEnv(process.env, {});
// config.isProduction -> boolean
// config.isDevelopment -> boolean
// config.isTest -> boolean
```

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

type Config = InferEnv<typeof schema>;
// { apiKey: string; db: { host: string } }
```

## API Reference

### `envvar`

`envvar(name: string, schema: StandardSchemaV1<T>)`

Creates an environment variable entry for validation.

### `parseEnv`

`parseEnv(env: Record<string, string | undefined>, envSchema: T)`

Validates envvars against the schema and returns typed configuration with environment flags `isProduction`, `isTest`, `isDevelopment`.

### `EnvSchemaError`

Thrown when validation fails. Contains:

`issues`: Array of validation issues with:
- `name`: Environment variable name
- `value`: Invalid value received
- `messages`: Validation error messages

## Contributing

Contributions are welcome!
If you’d like to improve this package, feel free to open an issue or submit a pull request. 🚀
