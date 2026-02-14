/**
 * AppConfig Live Implementation
 *
 * This is the infrastructure implementation (adapter) for application configuration.
 * Reads environment variables using Effect Config.
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
 *
 * Effect.runPromise(program.pipe(Effect.provide(AppConfigLive)));
 * ```
 */
import { AppConfig, type AppConfigService } from "@workspace/domain";
import { Config, type ConfigError, Effect, Layer } from "effect";

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
	redisUrl: Config.string("REDIS_URL").pipe(Config.withDefault("redis://localhost:6379")),
	betterAuthUrl: Config.string("BETTER_AUTH_URL").pipe(Config.withDefault("http://localhost:4000")),
	frontendUrl: Config.string("FRONTEND_URL").pipe(Config.withDefault("http://localhost:3000")),
	port: Config.number("PORT").pipe(Config.withDefault(4000)),
	nodeEnv: Config.string("NODE_ENV").pipe(Config.withDefault("development")),

	// Analyzer agent configuration
	analyzerModelId: Config.string("ANALYZER_MODEL_ID").pipe(
		Config.withDefault("claude-sonnet-4-20250514"),
	),
	analyzerMaxTokens: Config.number("ANALYZER_MAX_TOKENS").pipe(Config.withDefault(2048)),
	analyzerTemperature: Config.number("ANALYZER_TEMPERATURE").pipe(Config.withDefault(0.3)),

	// Nerin agent configuration
	nerinModelId: Config.string("NERIN_MODEL_ID").pipe(
		Config.withDefault("claude-haiku-4-5-20251001"),
	),
	nerinMaxTokens: Config.number("NERIN_MAX_TOKENS").pipe(Config.withDefault(1024)),
	nerinTemperature: Config.number("NERIN_TEMPERATURE").pipe(Config.withDefault(0.7)),

	// Cost management (Story 2.5)
	dailyCostLimit: Config.number("DAILY_COST_LIMIT").pipe(Config.withDefault(75)),

	// Assessment readiness (Story 4.7)
	messageReadyThreshold: Config.number("MESSAGE_READY_THRESHOLD").pipe(Config.withDefault(15)),
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
	}),
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
export const loadConfig: Effect.Effect<AppConfigService, ConfigError.ConfigError> = configSchema;
