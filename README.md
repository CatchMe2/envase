# Envase

Type-safe environment variable validation with Standard Schema compliance.
Works with Zod, Valibot, ArkType, and other Standard Schema-compatible validation libraries.

> "Envase" is Spanish for "container" - reflecting how this library encapsulates environment variables in a safe, structured, and validated way.

## Highlights

- 🔒 **Type-safe validation** - Full TypeScript type inference
- 🔌 **Standard Schema compliant** - Works with any compatible validation library
- 🌐 **Runtime agnostic** - Runs anywhere (Node, Bun, Deno, browsers)
- 🏗️ **Structured configuration** - Supports nested config objects
- 🧮 **Computed values** - Derive values from parsed config with full type inference
- 🚦 **Environment detection** - `isProduction`, `isTest`, `isDevelopment` flags
- 📜 **Detailed error reporting** - See all validation failures at once
- 🙈 **Sensitive values** - Keep secrets out of validation errors
- 🚀 **Lightweight** - Single dependency (type-fest), zero runtime overhead

## Installation

```bash
npm install envase
```

**Note**: This package is **ESM-only**. It does not support CommonJS `require(...)`.

## Validation Library Support

Built on the [Standard Schema](https://standardschema.dev) specification, Envase works seamlessly with any schema library that implements the spec. The CLI documentation generator additionally requires [Standard JSON Schema](https://standardschema.dev/json-schema) support to introspect and document your schemas.

See the full list of compatible libraries: [Standard Schema](https://standardschema.dev#what-schema-libraries-implement-the-spec) | [Standard JSON Schema](https://standardschema.dev/json-schema#what-schema-libraries-support-this-spec).

Popular options include:
- [Zod](https://zod.dev) - v3.24+ (Standard Schema), v4.2+ (JSON Schema)
- [Valibot](https://valibot.dev) - v1.0+ (Standard Schema), v1.2+ (JSON Schema via `@valibot/to-json-schema`)
- [ArkType](https://arktype.io) - v2.0+ (Standard Schema), v2.1.28+ (JSON Schema)

## Key features

### Type-Safe Validation of Nested Schema

```typescript
import { parseEnv, envvar } from 'envase';
import { z } from 'zod';

const envSchema = {
  app: {
    listen: {
      port: envvar('PORT', z.coerce.number().int().min(0).max(65535)),
    },
  },
  db: {
    host: envvar('DB_HOST', z.string().min(1).default('localhost')),
  },
  apiKey: envvar('API_KEY', z.string().min(32).optional()),
};

const config = parseEnv(process.env, envSchema)
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

### Sensitive Values

Mark envvars holding secrets as sensitive to keep their values out of validation errors:

```typescript
parseEnv({ API_KEY: 'short' }, {
  apiKey: envvar('API_KEY', z.string().min(32), { sensitive: true }),
});
// Environment variables validation has failed:
//   [API_KEY]:
//     Too small: expected string to have >=32 characters
//     (received: [REDACTED])
```

When validation of a sensitive envvar fails:
- the received value is replaced with `[REDACTED]` in the error message,
- the issue in `error.issues` has no `value` and is flagged with `redacted: true`,
- any occurrence of the value in messages returned by the schema library is replaced with `[REDACTED]`.

Missing and empty values are not redacted, as they don't reveal anything.
Sensitive envvars are also marked as such in the [generated documentation](#cli).

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

### Computed Values

Use `createConfig` to derive computed values from your parsed configuration with full type inference:

```typescript
import { createConfig, envvar } from 'envase';
import { z } from 'zod';

const config = createConfig(process.env, {
  schema: {
    db: {
      host: envvar('DB_HOST', z.string()),
      port: envvar('DB_PORT', z.coerce.number()),
      name: envvar('DB_NAME', z.string()),
    },
    api: {
      key: envvar('API_KEY', z.string()),
    },
  },
  computed: {
    dbConnectionString: (raw) =>
      `postgres://${raw.db.host}:${raw.db.port}/${raw.db.name}`,
    apiKeyPrefix: (raw) => raw.api.key.slice(0, 8),
  },
});

// config.db.host -> string
// config.db.port -> number
// config.dbConnectionString -> string
// config.apiKeyPrefix -> string
```

The `raw` parameter in computed functions is fully typed based on your schema, providing autocomplete and type checking. Computed values are calculated after schema validation, so you always work with parsed values (e.g., `port` is a `number`, not a string).

#### Nested Computed Values

Computed values can be nested to merge with your schema structure:

```typescript
import { createConfig, envvar } from 'envase';
import { z } from 'zod';

const config = createConfig(process.env, {
  schema: {
    aws: {
      accessKeyId: envvar('AWS_ACCESS_KEY_ID', z.string()),
      secretAccessKey: envvar('AWS_SECRET_ACCESS_KEY', z.string()),
    },
  },
  computed: {
    aws: {
      credentials: (raw) => ({
        accessKeyId: raw.aws.accessKeyId,
        secretAccessKey: raw.aws.secretAccessKey,
      }),
    },
  },
});

// Result type:
// {
//   aws: {
//     accessKeyId: string;
//     secretAccessKey: string;
//     credentials: { accessKeyId: string; secretAccessKey: string };
//   }
// }
```

You can also mix flat and nested computed values:

```typescript
const config = createConfig(process.env, {
  schema: {
    db: {
      host: envvar('DB_HOST', z.string()),
      port: envvar('DB_PORT', z.coerce.number()),
    },
  },
  computed: {
    // Flat at root level
    dbUrl: (raw) => `${raw.db.host}:${raw.db.port}`,
    // Nested under existing schema key
    db: {
      connectionString: (raw) => `postgres://${raw.db.host}:${raw.db.port}`,
    },
  },
});

// config.dbUrl -> string
// config.db.host -> string
// config.db.port -> number
// config.db.connectionString -> string
```

## CLI

Automatically generate and validate markdown documentation from your environment variable schemas.

### Quick Start

**1. Create your schema file with a default export:**

```typescript
// config.ts
import { envvar, parseEnv } from 'envase';
import { z } from 'zod';

const envSchema = {
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

export const config = parseEnv(process.env, envSchema);

export default envSchema
```

**2. Generate documentation:**

```bash
envase generate ./config.ts -o ./docs/env.md
```

**3. Validate documentation (optional):**

```bash
# Verify the documentation matches your schema
envase validate ./config.ts ./docs/env.md
```

### Command Reference

#### `envase generate <schemaPath>`

Generates markdown documentation from an environment schema.

**Arguments:**
- `<schemaPath>` - Path to a file containing default export of env schema

**Options:**
- `-o, --output <file>` - Output file path (default: `./env-docs.md`)

**Usage:**
```bash
envase generate ./config.ts -o ./docs/env.md

# Or use tsx for TypeScript files (recommended for older Node versions)
tsx node_modules/.bin/envase generate ./config.ts -o ./docs/env.md

# Or compile first, then generate
tsc config.ts && envase generate ./config.js -o ./docs/env.md
```

**Generated output:**

The CLI generates readable markdown documentation with:
- Type information for each environment variable
- Required/optional status
- Default values
- Descriptions (from `.describe()` calls)
- Constraints (min, max, minLength, maxLength, pattern, format, etc.)
- Enum values (for enum types)
- Grouped by nested configuration structure

<details>
<summary>Sample generated markdown</summary>

```markdown
# Environment variables

## App / Listen

- `PORT` (optional)
  Type: `number`
  Description: Application listening port
  Min value: `1024`
  Max value: `65535`

- `HOST` (optional)
  Type: `string`
  Description: Bind host address
  Default: `0.0.0.0`

## Database

- `DATABASE_URL` (required)
  Type: `string`
  Description: PostgreSQL connection URL
  Format: `uri`
```
</details>

#### `envase validate <schemaPath> <markdownPath>`

Validates if a markdown file matches the documentation that would be generated from the environment schema.

**Arguments:**
- `<schemaPath>` - Path to a file containing default export of env schema
- `<markdownPath>` - Path to the markdown file to validate

**Example:**
```bash
envase validate ./config.ts ./docs/env.md
```

This command is useful for:
- CI/CD pipelines to ensure documentation stays in sync with code
- Pre-commit hooks to verify documentation changes
- Detecting manual edits to generated documentation

**Exit codes:**
- `0` - Validation passed (markdown matches schema)
- `1` - Validation failed (differences found) or error occurred

## API Reference

### `envvar`

`envvar(name: string, schema: StandardSchemaV1<T>, options?: EnvvarOptions)`

Wraps a variable name and its schema for validation.
This helps pair the raw env name with the shape you expect it to conform to.

- `options.sensitive` - Redacts the received value from validation errors (see [Sensitive Values](#sensitive-values))

### `parseEnv`

`parseEnv(env: Record<string, string | undefined>, envSchema: T)`

Validates envvars against the schema and returns a typed configuration object.

### `createConfig`

`createConfig(env, options)`

Validates envvars and optionally computes derived values. Returns a merged object containing both the parsed config and computed values. All types are inferred from the schema and computed functions.

- `env` - Environment variables object (e.g., `process.env`)
- `options.schema` - Environment variable schema (same format as `parseEnv`)
- `options.computed` - Optional object where each key is a function receiving the parsed config and returning a derived value

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
  - `value`: Invalid value received (omitted for redacted values)
  - `redacted`: `true` if the value was omitted because the envvar is sensitive
  - `messages`: Validation error messages

## Why Envase?

- ✅ Works with **any** schema lib that follows the [Standard Schema spec](https://standardschema.dev)
- 🔄 Supports **deeply nested** configs
- 🔍 Offers **rich error reporting** with detailed issue breakdowns

## Contributing

Contributions are welcome!
If you’d like to improve this package, feel free to open an issue or submit a pull request. 🚀

If your change should be released, run `pnpm changeset` and commit the generated changeset file along with your code.
