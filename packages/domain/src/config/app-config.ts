/**
 * AppConfig - Type-safe Application Configuration Interface
 *
 * This is the domain definition (port) for application configuration.
 * The live implementation (adapter) is in @workspace/infrastructure.
 *
 * Follows hexagonal architecture:
 * - Domain: Interface + Context.Tag (this file)
 * - Infrastructure: Live Layer implementation
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
import { Context, type Redacted } from "effect";

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

	/** Analyzer agent model ID */
	readonly analyzerModelId: string;

	/** Analyzer agent max tokens per request */
	readonly analyzerMaxTokens: number;

	/** Analyzer agent temperature (0-1, lower = more structured) */
	readonly analyzerTemperature: number;

	/** Nerin agent model ID */
	readonly nerinModelId: string;

	/** Nerin agent max tokens per request */
	readonly nerinMaxTokens: number;

	/** Nerin agent temperature (0-1, higher = more conversational) */
	readonly nerinTemperature: number;

	/** Daily LLM cost limit in dollars (Story 2.5) */
	readonly dailyCostLimit: number;

	/** Number of user messages before assessment is considered ready (Story 4.7) */
	readonly messageReadyThreshold: number;
}

/**
 * AppConfig Context.Tag for dependency injection
 *
 * Use this to access configuration in effects:
 * ```typescript
 * const config = yield* AppConfig;
 * ```
 */
export class AppConfig extends Context.Tag("AppConfig")<AppConfig, AppConfigService>() {}
