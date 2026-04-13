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
import { Config, type ConfigError, Effect, Layer, Redacted } from "effect";

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
	analyzerTemperature: Config.number("ANALYZER_TEMPERATURE").pipe(Config.withDefault(0)),

	// Portrait generator configuration
	portraitModelId: Config.string("PORTRAIT_MODEL_ID").pipe(Config.withDefault("claude-sonnet-4-6")),
	portraitMaxTokens: Config.number("PORTRAIT_MAX_TOKENS").pipe(Config.withDefault(8000)),
	portraitTemperature: Config.number("PORTRAIT_TEMPERATURE").pipe(Config.withDefault(0.7)),

	// Nerin agent configuration
	nerinModelId: Config.string("NERIN_MODEL_ID").pipe(
		Config.withDefault("claude-haiku-4-5-20251001"),
	),
	nerinMaxTokens: Config.number("NERIN_MAX_TOKENS").pipe(Config.withDefault(1024)),
	nerinTemperature: Config.number("NERIN_TEMPERATURE").pipe(Config.withDefault(0.7)),

	// Cost management (Story 2.5)
	dailyCostLimit: Config.number("DAILY_COST_LIMIT").pipe(Config.withDefault(75)),

	// Assessment turn count (env var kept stable for backwards compatibility)
	assessmentTurnCount: Config.number("FREE_TIER_MESSAGE_THRESHOLD").pipe(Config.withDefault(15)),

	// Portrait wait screen minimum duration in ms (Story 7.18)
	portraitWaitMinMs: Config.number("PORTRAIT_WAIT_MIN_MS").pipe(Config.withDefault(10000)),

	// Profile sharing confidence threshold
	shareMinConfidence: Config.number("SHARE_MIN_CONFIDENCE").pipe(Config.withDefault(70)),

	// Two-tier architecture model configuration (Story 9.1)
	conversanalyzerModelId: Config.string("CONVERSANALYZER_MODEL_ID").pipe(
		Config.withDefault("claude-haiku-4-5-20251001"),
	),
	portraitGeneratorModelId: Config.string("PORTRAIT_GENERATOR_MODEL_ID").pipe(
		Config.withDefault("claude-sonnet-4-6"),
	),
	// Message rate limit per minute (Story 2.5)
	messageRateLimit: Config.number("MESSAGE_RATE_LIMIT").pipe(Config.withDefault(2)),

	// Polar.sh integration (Story 13.2)
	polarAccessToken: Config.redacted("POLAR_ACCESS_TOKEN").pipe(
		Config.withDefault("not-configured" as any),
	),
	polarWebhookSecret: Config.redacted("POLAR_WEBHOOK_SECRET"),
	polarProductPortraitUnlock: Config.string("POLAR_PRODUCT_PORTRAIT_UNLOCK"),
	polarProductRelationshipSingle: Config.string("POLAR_PRODUCT_RELATIONSHIP_SINGLE"),
	polarProductRelationship5Pack: Config.string("POLAR_PRODUCT_RELATIONSHIP_5PACK"),
	polarProductExtendedConversation: Config.string("POLAR_PRODUCT_EXTENDED_CONVERSATION"),

	// Global daily assessment limit (Story 15.3)
	globalDailyAssessmentLimit: Config.number("GLOBAL_DAILY_ASSESSMENT_LIMIT").pipe(
		Config.withDefault(100),
	),

	// Minimum finalWeight threshold for evidence quality filtering
	minEvidenceWeight: Config.number("MIN_EVIDENCE_WEIGHT").pipe(Config.withDefault(0.36)),

	// Email Infrastructure (Story 31-7)
	resendApiKey: Config.redacted("RESEND_API_KEY").pipe(
		Config.withDefault(Redacted.make("not-configured")),
	),
	emailFromAddress: Config.string("EMAIL_FROM_ADDRESS").pipe(
		Config.withDefault("noreply@bigocean.dev"),
	),
	dropOffThresholdHours: Config.number("DROP_OFF_THRESHOLD_HOURS").pipe(Config.withDefault(24)),
	checkInThresholdDays: Config.number("CHECK_IN_THRESHOLD_DAYS").pipe(Config.withDefault(14)),
	subscriptionNudgeThresholdDays: Config.number("SUBSCRIPTION_NUDGE_THRESHOLD_DAYS").pipe(
		Config.withDefault(21),
	),
	recaptureThresholdDays: Config.number("RECAPTURE_THRESHOLD_DAYS").pipe(Config.withDefault(3)),

	// Push notifications (Story 10-2)
	pushVapidPublicKey: Config.string("PUSH_VAPID_PUBLIC_KEY").pipe(Config.withDefault("")),
	pushVapidPrivateKey: Config.redacted("PUSH_VAPID_PRIVATE_KEY").pipe(
		Config.withDefault(Redacted.make("")),
	),
	pushVapidSubject: Config.string("PUSH_VAPID_SUBJECT").pipe(Config.withDefault("")),

	// Cost Guard (Story 31-6)
	sessionCostLimitCents: Config.number("SESSION_COST_LIMIT_CENTS").pipe(Config.withDefault(2000)),

	// Nerin Director (Story 43-3)
	nerinDirectorModelId: Config.string("NERIN_DIRECTOR_MODEL_ID").pipe(
		Config.withDefault("claude-haiku-4-5-20251001"),
	),
	nerinDirectorMaxTokens: Config.number("NERIN_DIRECTOR_MAX_TOKENS").pipe(Config.withDefault(1024)),
	nerinDirectorTemperature: Config.number("NERIN_DIRECTOR_TEMPERATURE").pipe(
		Config.withDefault(0.7),
	),
	nerinDirectorRetryTemperature: Config.number("NERIN_DIRECTOR_RETRY_TEMPERATURE").pipe(
		Config.withDefault(0.9),
	),
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
const normalizeVapidConfig = (config: Effect.Effect.Success<typeof configSchema>) => ({
	...config,
	pushVapidPublicKey: config.pushVapidPublicKey || undefined,
	pushVapidPrivateKey:
		Redacted.value(config.pushVapidPrivateKey).length > 0 ? config.pushVapidPrivateKey : undefined,
	pushVapidSubject: config.pushVapidSubject || undefined,
});

export const AppConfigLive = Layer.effect(
	AppConfig,
	Effect.gen(function* () {
		const config = yield* configSchema;
		return normalizeVapidConfig(config);
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
export const loadConfig: Effect.Effect<AppConfigService, ConfigError.ConfigError> =
	configSchema.pipe(Effect.map(normalizeVapidConfig));
