# Envase

Type-safe environment variable validation with Standard Schema compliance.
Works with Zod, Valibot, ArkType, and other Standard Schema-compatible validation libraries.

> "Envase" is Spanish for "container" - reflecting how this library encapsulates environment variables in a safe, structured, and validated way.

## Highlights

- 🔒 **Type-safe validation** - Full TypeScript type inference
- 🔌 **Standard Schema compliant** - Works with any compatible validation library
- 🌐 **Runtime agnostic** - Runs anywhere (Node, Bun, Deno, browsers)
- 🏗️ **Structured configuration** - Supports nested config objects
- 🚦 **Environment detection** - `isProduction`, `isTest`, `isDevelopment` flags
- 📜 **Detailed error reporting** - See all validation failures at once
- 🚀 **Lightweight** - Single dependency (type-fest), zero runtime overhead

## Installation

```bash
npm install envase
```

**Note**: This package is **ESM-only**. It does not support CommonJS `require(...)`.

## Validation Library Support

Built on the [Standard Schema](https://standardschema.dev) specification,
Envase works seamlessly with any schema library that implements the spec.
See the [full list of compatible libraries](https://standardschema.dev#what-schema-libraries-implement-the-spec).

Popular options include:
- [Zod](https://zod.dev) - v3.24+ (Standard Schema), v4.2+ (JSON Schema)
- [Valibot](https://valibot.dev) - v1.0+ (Standard Schema), v1.2+ (JSON Schema)
- [ArkType](https://arktype.io) - v2.0+ (Standard Schema), v2.1.28+ (JSON Schema)

### Documentation Generation Support

The CLI documentation generator requires libraries that implement **Standard JSON Schema** in addition to Standard Schema. This feature allows schemas to be introspected and converted to JSON Schema for documentation purposes.

**Supported libraries:**
- ✅ **Zod** (v4.2+) - Direct support via `~standard.jsonSchema`
- ✅ **ArkType** (v2.1.28+) - Direct support via `~standard.jsonSchema`
- ✅ **Valibot** (v1.2+) - Via `@valibot/to-json-schema` package (v1.5+)

All three major validation libraries support documentation generation. For Valibot, you'll need to install the additional `@valibot/to-json-schema` package.

## Key features

### Type-Safe Validation of Nested Schema

```typescript
import { parseEnv, envvar } from 'envase';
import { z } from 'zod';

const config = parseEnv(process.env, {
  app: {
    listen: {
      port: envvar('PORT', z.coerce.number().int().min(0).max(65535)),
    },
  },
  db: {
    host: envvar('DB_HOST', z.string().min(1).default('localhost')),
  },
  apiKey: envvar('API_KEY', z.string().min(32).optional()),
});
// config.app.listen.port -> number
// config.db.host -> string
// config.apiKey -> string | undefined
```

### Environment Detection

```typescript
import { detectNodeEnv } from 'envase';

const nodeEnv = detectNodeEnv(process.env);
// nodeEnv.isProduction -> boolean
// nodeEnv.isTest -> boolean
// nodeEnv.isDevelopment -> boolean
```

These flags are inferred from the `NODE_ENV` value (i.e. 'production', 'test', or 'development').

### Detailed error reporting

```typescript
import { parseEnv, envvar, EnvaseError } from 'envase';
import { z } from 'zod';

try {
  parseEnv(process.env, {
    apiKey: envvar('API_KEY', z.string().min(32)),
    db: {
      host: envvar('DB_HOST', z.string().min(1)),
    },
  });
} catch (error: unknown) {
  if (EnvaseError.isInstance(error)) {
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
import { envvar, type InferEnv } from 'envase';
import { z } from 'zod';

const envSchema = {
  apiKey: envvar('API_KEY', z.string().min(32)),
  db: {
    host: envvar('DB_HOST', z.string().min(1)),
  },
};

type Config = InferEnv<typeof envSchema>;
// { apiKey: string; db: { host: string } }
```

## CLI Documentation Generator

Automatically generate markdown documentation from your environment variable schemas.

### Quick Start

**1. Create your schema file with a default export:**

```typescript
// config.ts
import { envvar } from 'envase';
import { z } from 'zod';

export default {
  app: {
    listen: {
      port: envvar('PORT', z.coerce.number().int().min(1024).max(65535)
        .describe('Application listening port')),
      host: envvar('HOST', z.string().default('0.0.0.0')
        .describe('Bind host address')),
    },
  },
  database: {
    url: envvar('DATABASE_URL', z.string().url()
      .describe('PostgreSQL connection URL')),
  },
};
```

**2. Generate documentation:**

```bash
# Using TypeScript directly with Node.js type stripping feature
envase generate ./config.ts -o ./docs/env.md

# Or use tsx (recommended for older Node versions)
tsx node_modules/.bin/envase generate ./config.ts -o ./docs/env.md

# Or compile first, then generate
tsc config.ts
envase generate ./config.js -o ./docs/env.md
```

### Command Reference

#### `envase generate <schema>`

Generates markdown documentation from an environment schema.

**Arguments:**
- `<schemaPath>` - Path to a file containing default export of env schema.

**Options:**
- `-o, --output <file>` - Output file path (default: `./env-docs.md`)

### Example Output

The CLI generates readable markdown documentation with:
- Type information for each environment variable
- Required/optional status with **(REQUIRED)** marker
- Default values
- Descriptions (from `.describe()` calls)
- Constraints (min, max, minLength, maxLength, pattern, format, etc.)
- Enum values (for enum types)
- Grouped by nested configuration structure

**Sample generated markdown:**

```markdown
# Environment variables

## App Listen

- **(REQUIRED)** `PORT` *(number)*
  Application listening port
  Minimum: `1024`
  Maximum: `65535`

- `HOST` *(string)*
  Bind host address
  Default: `0.0.0.0`

## Database

- **(REQUIRED)** `DATABASE_URL` *(string)*
  PostgreSQL connection URL
  Format: `uri`
```

## API Reference

### `envvar`

`envvar(name: string, schema: StandardSchemaV1<T>)`

Wraps a variable name and its schema for validation.
This helps pair the raw env name with the shape you expect it to conform to.

### `parseEnv`

`parseEnv(env: Record<string, string | undefined>, envSchema: T)`

Validates envvars against the schema and returns a typed configuration object.

### `detectNodeEnv`

`detectNodeEnv(env: Record<string, string | undefined>)`

Standalone utility that reads NODE_ENV and returns an object with the following boolean flags:

- isProduction: true if NODE_ENV === 'production'
- isTest: true if NODE_ENV === 'test'
- isDevelopment: true if NODE_ENV === 'development'

### `EnvaseError`

Thrown when validation fails.

Contains:
- `message`: Human-readable error summary
- `issues`: Array of validation issues with:
  - `name`: Environment variable name
  - `value`: Invalid value received
  - `messages`: Validation error messages

## Why Envase?

- ✅ Works with **any** schema lib that follows the [Standard Schema spec](https://standardschema.dev)
- 🔄 Supports **deeply nested** configs
- 🔍 Offers **rich error reporting** with detailed issue breakdowns

## Contributing

Contributions are welcome!
If you’d like to improve this package, feel free to open an issue or submit a pull request. 🚀
