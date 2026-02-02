/**
 * AppConfig - Type-safe Application Configuration
 *
 * Uses Effect Config for validated, typed environment variables.
 * Follows hexagonal architecture: this is a domain service interface.
 *
 * Features:
 * - Required variables fail fast at startup with clear errors
 * - Secrets are redacted (ANTHROPIC_API_KEY, BETTER_AUTH_SECRET)
 * - Sensible defaults for optional variables
 * - Type safety (PORT is number, not string)
 *
 * @example
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const config = yield* AppConfig;
 *   console.log(config.port); // number
 *   console.log(Redacted.value(config.anthropicApiKey)); // unwrap secret
 * });
 * ```
 */
import { Config, ConfigError, Context, Effect, Layer, Redacted } from "effect";

/**
 * Application configuration service interface
 */
export interface AppConfigService {
  /** PostgreSQL database connection URL (required) */
  readonly databaseUrl: string;

  /** Redis connection URL for caching and rate limiting */
  readonly redisUrl: string;

  /** Anthropic API key for Claude (required, secret) */
  readonly anthropicApiKey: Redacted.Redacted<string>;

  /** Better Auth secret for session signing (required, secret) */
  readonly betterAuthSecret: Redacted.Redacted<string>;

  /** Better Auth base URL for auth endpoints */
  readonly betterAuthUrl: string;

  /** Frontend URL for CORS and redirects */
  readonly frontendUrl: string;

  /** HTTP server port */
  readonly port: number;

  /** Node.js environment (development, production, test) */
  readonly nodeEnv: string;
}

/**
 * AppConfig Context.Tag for dependency injection
 *
 * Use this to access configuration in effects:
 * ```typescript
 * const config = yield* AppConfig;
 * ```
 */
export class AppConfig extends Context.Tag("AppConfig")<
  AppConfig,
  AppConfigService
>() {}

/**
 * Configuration schema - defines how to load each variable
 *
 * Required variables will cause startup failure if missing.
 * Optional variables have defaults.
 * Secrets use Config.redacted() to prevent accidental logging.
 */
const configSchema = Config.all({
  // Required variables (no defaults - fail fast if missing)
  databaseUrl: Config.string("DATABASE_URL"),
  anthropicApiKey: Config.redacted("ANTHROPIC_API_KEY"),
  betterAuthSecret: Config.redacted("BETTER_AUTH_SECRET"),

  // Optional variables with sensible defaults
  redisUrl: Config.string("REDIS_URL").pipe(
    Config.withDefault("redis://localhost:6379")
  ),
  betterAuthUrl: Config.string("BETTER_AUTH_URL").pipe(
    Config.withDefault("http://localhost:4000")
  ),
  frontendUrl: Config.string("FRONTEND_URL").pipe(
    Config.withDefault("http://localhost:3000")
  ),
  port: Config.number("PORT").pipe(Config.withDefault(4000)),
  nodeEnv: Config.string("NODE_ENV").pipe(Config.withDefault("development")),
});

/**
 * AppConfigLive Layer - loads configuration from environment
 *
 * Provide this layer to your application to enable configuration:
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const config = yield* AppConfig;
 *   // use config...
 * });
 *
 * Effect.runPromise(program.pipe(Effect.provide(AppConfigLive)));
 * ```
 *
 * If required variables are missing, the effect will fail with ConfigError
 * before the program runs, providing fail-fast behavior.
 */
export const AppConfigLive = Layer.effect(
  AppConfig,
  Effect.gen(function* () {
    const config = yield* configSchema;
    return config;
  })
);

/**
 * Load configuration as an Effect
 *
 * This is the preferred way to load configuration within Effect programs.
 * The configuration will fail fast if required variables are missing.
 *
 * @example
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const config = yield* loadConfig;
 *   // use config...
 * });
 * ```
 */
export const loadConfig: Effect.Effect<AppConfigService, ConfigError.ConfigError> =
  configSchema;
