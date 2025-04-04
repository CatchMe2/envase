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
- [Effect Schema](https://effect.website/docs/schema)

## Key features

### Type-Safe Validation

```typescript
const config = parseEnv(process.env, {
  apiKey: envvar('API_KEY', z.string().min(32)),
  timeout: envvar('TIMEOUT', z.coerce.number().int()),
});
// config.apiKey -> string
// config.timeout -> number
```

### Nested Configuration

```typescript
const config = parseEnv(process.env, {
  db: {
    host: envvar('DB_HOST', z.string().min(1)),
  },
});
// config.db.host -> string
```

### Built-in Environment Detection

```typescript
const config = parseEnv(process.env, {});
// config.isProduction -> boolean
// config.isDevelopment -> boolean
// config.isTest -> boolean
```

## API Reference

`envvar(name: string, schema: StandardSchemaV1<T>)`
Creates an environment variable validator.

`parseEnv(env: Record<string, string | undefined>, schema: T)`
Validates and returns typed configuration. Throws `ParseEnvError` if validation fails.
