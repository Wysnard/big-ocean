# Story 2.2.1: Migrate to Effect Config

Status: ready-for-dev

## Story

As a **Backend Developer**,
I want **to use Effect Config for environment variable management with schema validation**,
So that **configuration is type-safe, validated at startup, and decoupled from runtime code**.

## Acceptance Criteria

### Primary Objectives

1. **Replace all `process.env` calls** in `apps/api` with Effect Config
2. **Create config service layers** using Context.Tag for dependency injection
3. **Validate config at startup** using @effect/schema - fail fast if vars invalid
4. **Type-safe config access** throughout app - no string literals, strongly typed

### Specific Requirements

**Given** the application starts
**When** the root Effect Layer includes ConfigServiceLive
**Then** all environment variables are loaded and validated
**And** if any required var is missing or invalid, app startup fails with clear error
**And** sensitive values (API keys, passwords) are redacted in logs

**Given** code needs an environment variable (e.g., API key, database URL)
**When** it requests the value via injected config service
**Then** the value is schema-validated and type-safe
**And** no `process.env` calls exist in handlers, use-cases, or services

**Given** config loading completes successfully
**When** the application processes requests
**Then** all configuration is already validated and typed
**And** developers can't access invalid or missing config

### Testing & Documentation

- [ ] **Unit Tests**: Config schema validation, service layer, error handling (100% coverage)
- [ ] **Integration**: Config works with actual services (database, API clients)
- [ ] **Documentation**: CLAUDE.md updated with config pattern and examples

## Tasks / Subtasks

- [ ] Task 1: Audit current environment variable usage (AC: #1, #2)
  - [ ] Run grep search: `grep -r "process\.env\." apps/api/src --include="*.ts"`
  - [ ] Document each variable: name, location, required/optional, validation needed
  - [ ] Categorize: app (port, node_env), external APIs (anthropic key), databases (postgres, redis)
  - [ ] Identify any validation already in place
  - [ ] Create list of all config vars needed

- [ ] Task 2: Create config schema definitions (AC: #2)
  - [ ] Create `apps/api/src/config/schema.ts`
  - [ ] Define `DatabaseConfigSchema` (URL validation, starts with postgres://)
  - [ ] Define `AnthropicConfigSchema` (API key length ≥ 20, redacted)
  - [ ] Define `ServerConfigSchema` (port number, default 4000)
  - [ ] Define `RedisConfigSchema` (URL validation)
  - [ ] Define `EnvironmentConfigSchema` (enum: 'development' | 'production')
  - [ ] Use @effect/schema with `.pipe()` for composition:

    ```typescript
    import { Schema as S } from "effect";

    const DatabaseUrlSchema = S.String.pipe(
      S.minLength(1),
      S.startsWith("postgres://"),
      S.description("PostgreSQL connection URL"),
    );
    ```

  - [ ] Create root `AppConfigSchema` combining all sub-schemas

- [ ] Task 3: Implement config service layer (AC: #2, #3)
  - [ ] Create `apps/api/src/config/app-config.ts`
  - [ ] Define `AppConfig` Context.Tag:
    ```typescript
    class AppConfig extends Context.Tag("@app/AppConfig")<
      AppConfig,
      {
        database: { url: string };
        anthropic: { apiKey: Redacted.Redacted };
        server: { port: number; nodeEnv: string };
        redis: { url: string };
      }
    >() {}
    ```
  - [ ] Create `AppConfig.layer` using Effect.gen() with Config primitives:
    ```typescript
    static readonly layer = Layer.effect(
      AppConfig,
      Effect.gen(function* () {
        const databaseUrl = yield* Config.string("DATABASE_URL").pipe(
          Config.validate({ /* schema validation */ })
        )
        const apiKey = yield* Config.redacted("ANTHROPIC_API_KEY")
        const port = yield* Config.integer("PORT").pipe(
          Config.orElse(() => Config.succeed(4000))
        )
        // ... more config loading
        return AppConfig.of({ database: { url: databaseUrl }, ... })
      })
    )
    ```
  - [ ] Use `Config.redacted()` for sensitive values (won't appear in logs)
  - [ ] Use `Config.orElse()` for optional values with defaults
  - [ ] Export `AppConfigLive = AppConfig.layer`

- [ ] Task 4: Update app startup to load config (AC: #3)
  - [ ] Modify `apps/api/src/index.ts`
  - [ ] Add `AppConfigLive` to root Layer composition (must be first):
    ```typescript
    const RootLayer = Layer.mergeAll(
      AppConfigLive, // Load config first, validates at startup
      DatabaseLive, // Uses AppConfig for DATABASE_URL
      HttpLive, // Uses AppConfig for PORT
    );
    ```
  - [ ] Add error handling for config loading failures
  - [ ] Log successful config load (with secrets masked):
    ```
    "Config loaded: NODE_ENV=production PORT=4000"
    ```
  - [ ] Never log API keys, passwords, or connection strings

- [ ] Task 5: Replace all `process.env` calls (AC: #2)
  - [ ] **Handlers** (`apps/api/src/handlers/**`):
    - [ ] Find all `process.env` usage
    - [ ] Access config via injected `AppConfig` context
    - [ ] Example: `const { anthropic: { apiKey } } = yield* AppConfig`
    - [ ] Remove direct env access
  - [ ] **Use-Cases** (`apps/api/src/use-cases/**`):
    - [ ] Find all `process.env` usage
    - [ ] Pass config through function parameters or context injection
    - [ ] Example: Use-case yields `AppConfig` instead of accessing env
  - [ ] **Services** (`apps/api/src/services/**`):
    - [ ] Replace `process.env` with injected config
    - [ ] Create service layers that depend on `AppConfig`
  - [ ] Verify all replacements:
    - [ ] Run: `grep -r "process\.env" apps/api/src` → should return 0 results
    - [ ] TypeScript compilation passes

- [ ] Task 6: Write comprehensive config tests (AC: #4)
  - [ ] Create `apps/api/src/config/app-config.test.ts`
  - [ ] Test schema validation for each variable:
    - [ ] DATABASE_URL: missing → error, invalid format → error, valid → success
    - [ ] ANTHROPIC_API_KEY: too short → error, valid → success (redacted in logs)
    - [ ] PORT: not numeric → error, out of range → error, valid → success
  - [ ] Test config service layer:
    - [ ] `AppConfigLive` provides all required config
    - [ ] Typed access returns correct values
    - [ ] Test layer can substitute test values
  - [ ] Test error messages are helpful
  - [ ] Aim for 100% coverage of config module

- [ ] Task 7: Integration test with real services (AC: #4)
  - [ ] Create `apps/api/src/config/integration.test.ts`
  - [ ] Test: Config can initialize database layer
  - [ ] Test: Config can initialize HTTP server
  - [ ] Test: Config can initialize API client
  - [ ] Verify startup sequence works correctly

- [ ] Documentation & Testing (AC: #4) — **REQUIRED BEFORE DONE**
  - [ ] Add JSDoc to `AppConfig` and config functions
  - [ ] Update `CLAUDE.md` with config pattern section:

    ````markdown
    ### Config Management (Effect Config)

    Environment configuration uses Effect Config with schema validation:

    1. Define schemas in `apps/api/src/config/schema.ts`
    2. Create service layer: `AppConfig extends Context.Tag`
    3. Load in root layer: `Layer.mergeAll(AppConfigLive, ...)`
    4. Access via dependency injection: `yield* AppConfig`

    Example accessing config in a handler:

    ```typescript
    const handler = Effect.gen(function* () {
      const {
        server: { port },
      } = yield* AppConfig;
      console.log(`Server running on port ${port}`);
    });
    ```
    ````

    ```

    ```

  - [ ] Update story file with completion notes and file list
  - [ ] Ensure all tests pass: `pnpm test:run`

## Dev Notes

### Effect Config Architecture

Effect Config is built on these principles:

1. **Config Primitives** - Basic loaders for types:
   - `Config.string(name)` - load string from env var
   - `Config.integer(name)` - parse as integer
   - `Config.number(name)` - parse as float
   - `Config.boolean(name)` - parse as true/false
   - `Config.redacted(name)` - load secret (hidden in logs)
   - `Config.url(name)` - validate URL format
   - `Config.duration(name)` - parse time durations
   - `Config.array(name)` - parse comma-separated values

2. **Validation** - Compose with schema validation:

   ```typescript
   Config.string("VAR").pipe(
     Config.validate({
       message: "Invalid format",
       validation: (s) => s.length >= 4,
     }),
   );
   ```

3. **Defaults** - Provide fallback values:

   ```typescript
   Config.integer("PORT").pipe(Config.orElse(() => Config.succeed(4000)));
   ```

4. **Service Layers** - Standard DI pattern:
   ```typescript
   class MyConfig extends Context.Tag("@app/MyConfig")<
     MyConfig,
     { apiKey: Redacted.Redacted; port: number }
   >() {
     static readonly layer = Layer.effect(
       MyConfig,
       Effect.gen(function* () {
         const apiKey = yield* Config.redacted("API_KEY");
         const port = yield* Config.integer("PORT");
         return MyConfig.of({ apiKey, port });
       }),
     );
   }
   ```

### Configuration Variables to Handle

**Current app needs these env vars:**

1. **DATABASE_URL** (required)
   - Format: PostgreSQL connection string
   - Example: `postgres://user:pass@localhost:5432/big_ocean`
   - Validation: Must start with `postgres://`

2. **ANTHROPIC_API_KEY** (required)
   - Format: API key
   - Example: `sk-...` (20+ characters)
   - Validation: Minimum length, alphanumeric
   - **Redacted**: Yes - use `Config.redacted()`

3. **PORT** (optional, default 4000)
   - Format: Integer 1-65535
   - Validation: Numeric range check
   - Example: `4000`

4. **NODE_ENV** (optional, default 'development')
   - Format: 'development' | 'production'
   - Validation: Enum check
   - Example: `production`

5. **REDIS_URL** (required for cost tracking)
   - Format: Redis connection string
   - Example: `redis://localhost:6379`
   - Validation: Must start with `redis://`

6. **SENTRY_DSN** (optional, not required for MVP)
   - Format: Sentry URL
   - Example: `https://key@sentry.io/project`
   - Validation: URL format if provided

### Implementation Pattern

The pattern follows Effect's recommended approach:

```typescript
// 1. Define schemas (optional but recommended for validation)
// apps/api/src/config/schema.ts
export const DatabaseUrlSchema = S.String.pipe(
  S.minLength(1),
  S.startsWith("postgres://"),
);

// 2. Create Context.Tag service
// apps/api/src/config/app-config.ts
export class AppConfig extends Context.Tag("@app/AppConfig")<
  AppConfig,
  {
    database: { url: string };
    anthropic: { apiKey: Redacted.Redacted };
    server: { port: number; nodeEnv: "development" | "production" };
    redis: { url: string };
  }
>() {
  static readonly layer = Layer.effect(
    AppConfig,
    Effect.gen(function* () {
      const databaseUrl = yield* Config.string("DATABASE_URL").pipe(
        Config.validate({
          message: "Invalid DATABASE_URL",
          validation: (url) => url.startsWith("postgres://"),
        }),
      );

      const apiKey = yield* Config.redacted("ANTHROPIC_API_KEY");

      const port = yield* Config.integer("PORT").pipe(
        Config.orElse(() => Config.succeed(4000)),
      );

      const nodeEnv = yield* Config.string("NODE_ENV").pipe(
        Config.orElse(() => Config.succeed("development")),
      );

      const redisUrl = yield* Config.string("REDIS_URL");

      return AppConfig.of({
        database: { url: databaseUrl },
        anthropic: { apiKey },
        server: { port, nodeEnv: nodeEnv as any },
        redis: { url: redisUrl },
      });
    }),
  );
}

export const AppConfigLive = AppConfig.layer;

// 3. Use in app startup
// apps/api/src/index.ts
const RootLayer = Layer.mergeAll(
  AppConfigLive, // Load first
  DatabaseLive, // Uses config
  HttpLive, // Uses config
);

// 4. Access in handlers/use-cases
// Example handler
export const myHandler = Effect.gen(function* () {
  const {
    anthropic: { apiKey },
    server: { port },
  } = yield* AppConfig;
  // apiKey is Redacted type, port is number
});
```

### Key Patterns

1. **Always use `Config.redacted()`** for secrets
2. **Fail at startup** - config validation happens immediately
3. **Test substitution** - provide test config via `Layer.succeed()`
4. **No process.env** - Config is the single source of truth
5. **Error messages** - validation failures include helpful context

### Architecture Integration Points

- **Location**: `apps/api/src/config/` (schemas, service)
- **Dependency Injection**: `AppConfigLive` layer composed in root
- **App Startup**: Config must load before HTTP server or database
- **Usage**: Handlers, use-cases, services all `yield* AppConfig`
- **Testing**: Create test config: `Layer.succeed(AppConfig, testValues)`

### Testing Strategy

**Unit Tests** (config/app-config.test.ts):

- Schema validation (valid/invalid for each var)
- Default values work
- Redacted values don't appear in logs

**Integration Tests** (config/integration.test.ts):

- Config can provide values to database layer
- Config can provide values to HTTP server
- Startup sequence works correctly

### Files to Create

- `apps/api/src/config/schema.ts` - Schema definitions
- `apps/api/src/config/app-config.ts` - Config service with Context.Tag
- `apps/api/src/config/app-config.test.ts` - Unit tests
- `apps/api/src/config/integration.test.ts` - Integration tests
- `apps/api/src/config/index.ts` - Barrel export

### Files to Modify

- `apps/api/src/index.ts` - Add `AppConfigLive` to layer
- `apps/api/src/handlers/**` - Replace `process.env` with `AppConfig`
- `apps/api/src/use-cases/**` - Replace `process.env` with `AppConfig`
- `apps/api/src/services/**` - Replace `process.env` with `AppConfig`
- `CLAUDE.md` - Document config pattern

### References

- [Effect Config Docs](https://www.effect.solutions/config) - Official documentation
- [Effect Schema](https://www.effect.solutions/docs/schema/introduction) - Validation
- [Effect Context & Layers](https://www.effect.solutions/docs/context/) - Dependency injection
- [Source: CLAUDE.md#architecture](../../CLAUDE.md#architecture--key-patterns) - Existing patterns

## Dev Agent Record

### Agent Model Used

claude-haiku-4-5-20251001

### Debug Log References

None yet - story created from requirements

### Completion Notes List

- Story 2-2-1 created with comprehensive Effect Config migration plan
- Researched Effect Config API patterns from https://www.effect.solutions/config
- Detailed schema, service layer, and integration patterns included
- Clear acceptance criteria with AC references
- Testing strategy documented (unit + integration)

### File List

**To Create:**

- `apps/api/src/config/schema.ts`
- `apps/api/src/config/app-config.ts`
- `apps/api/src/config/app-config.test.ts`
- `apps/api/src/config/integration.test.ts`
- `apps/api/src/config/index.ts`

**To Modify:**

- `apps/api/src/index.ts` (add AppConfigLive to layer)
- `apps/api/src/handlers/**` (replace process.env)
- `apps/api/src/use-cases/**` (replace process.env)
- `apps/api/src/services/**` (replace process.env)
- `CLAUDE.md` (document pattern)

**No Changes to:**

- `apps/front/**` - Frontend has no env var needs
- Packages - Config is app-specific to `apps/api`
