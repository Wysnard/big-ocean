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

	/** Portrait generator model ID */
	readonly portraitModelId: string;

	/** Portrait generator max tokens per request (includes thinking + response) */
	readonly portraitMaxTokens: number;

	/** Portrait generator temperature (0-1) */
	readonly portraitTemperature: number;

	// ─── Portrait pipeline — ADR-51 three-stage portrait ─────────────────────

	/** Stage A: Spine Extractor model (Sonnet + extended thinking budget) */
	readonly portraitSpineExtractorModelId: string;

	/** Extended thinking budget tokens for Spine Extractor (Stage A) */
	readonly portraitSpineThinkingBudgetTokens: number;

	/** Stage B: Spine Verifier model (Haiku — mechanical checklist) */
	readonly portraitSpineVerifierModelId: string;

	/** Stage C: Prose Renderer model (Sonnet — brief-only rendering) */
	readonly portraitProseRendererModelId: string;

	/** Stage C: Prose Renderer sampling temperature */
	readonly portraitProseRendererTemperature: number;

	/** Nerin agent model ID */
	readonly nerinModelId: string;

	/** Nerin agent max tokens per request */
	readonly nerinMaxTokens: number;

	/** Nerin agent temperature (0-1, higher = more conversational) */
	readonly nerinTemperature: number;

	/** Daily LLM cost limit in dollars (Story 2.5) */
	readonly dailyCostLimit: number;

	/** Number of user turns in the initial assessment before closing begins */
	readonly assessmentTurnCount: number;

	/** Minimum wait time (ms) before portrait reveal on frontend (Story 7.18) */
	readonly portraitWaitMinMs: number;

	/** Minimum facet confidence (0-100) required to allow profile sharing */
	readonly shareMinConfidence: number;

	/** Model ID for conversanalyzer (Haiku-tier, runs on every message) */
	readonly conversanalyzerModelId: string;

	/** Model ID for portrait generation */
	readonly portraitGeneratorModelId: string;

	/** Per-user message rate limit per minute (Story 2.5) */
	readonly messageRateLimit: number;

	/** Polar.sh access token for API calls (secret) */
	readonly polarAccessToken: Redacted.Redacted<string>;

	/** Polar.sh webhook secret for HMAC verification (secret) */
	readonly polarWebhookSecret: Redacted.Redacted<string>;

	/** Polar product ID for portrait unlock */
	readonly polarProductPortraitUnlock: string;

	/** Polar product ID for single relationship credit */
	readonly polarProductRelationshipSingle: string;

	/** Polar product ID for 5-pack relationship credits */
	readonly polarProductRelationship5Pack: string;

	/** Polar product ID for extended conversation */
	readonly polarProductExtendedConversation: string;

	/** Polar product ID for €9.99/mo subscription (conversation extension) — Story 8.1 */
	readonly polarProductSubscription: string;

	/** Global daily assessment limit (circuit breaker) — Story 15.3 */
	readonly globalDailyAssessmentLimit: number;

	/** Minimum finalWeight threshold for evidence filtering (moderate/medium = 0.36) */
	readonly minEvidenceWeight: number;

	// ─── Email Infrastructure (Story 31-7) ────────────────────────────────

	/** Resend API key for transactional email (secret) */
	readonly resendApiKey: Redacted.Redacted<string>;

	/** Sender email address for transactional emails */
	readonly emailFromAddress: string;

	/** Hours of inactivity before sending drop-off re-engagement email (default: 24) */
	readonly dropOffThresholdHours: number;

	/** Days after assessment completion before sending Nerin check-in email (default: 14) */
	readonly checkInThresholdDays: number;

	/** Days after assessment completion before sending the subscription conversion nudge (default: 21) */
	readonly subscriptionNudgeThresholdDays: number;

	/** Days after portrait is ready before sending the recapture email (default: 3) */
	readonly recaptureThresholdDays: number;

	// ─── Push Notifications (Story 10-2) ───────────────────────────────

	/** VAPID public key used by the browser Push API */
	readonly pushVapidPublicKey?: string;

	/** VAPID private key used to sign Web Push requests */
	readonly pushVapidPrivateKey?: Redacted.Redacted<string>;

	/** Contact subject used in VAPID JWT claims, typically a mailto: URL */
	readonly pushVapidSubject?: string;

	// ─── Cost Guard Configuration (Story 31-6) ─────────────────────────

	/** Per-session LLM cost limit in cents (default: 2000 = $0.20, matching NFR6) */
	readonly sessionCostLimitCents: number;

	// ─── Cost ceiling / circuit breaker (Story 11-1, ADR-50) ─────────────

	/** Expected average weekly-letter LLM cost per user in cents (NFR7a envelope tuning). */
	readonly weeklyLetterExpectedCostCents: number;

	/** Estimated active free-tier users for expected-daily-cost denominator (config knob). */
	readonly costCeilingActiveUsersEstimate: number;

	/** Multiplier on expected daily free LLM cost before tripping breaker (default 3). */
	readonly costCircuitBreakerMultiplier: number;

	/** Cooldown for CostLimitExceeded when breaker is active (seconds, default 900). */
	readonly costGuardRetryAfterSeconds: number;

	// ─── Nerin Director Configuration (Story 43-3) ─────────────────────

	/** Nerin Director model ID (default: Sonnet — Haiku as latency fallback) */
	readonly nerinDirectorModelId: string;

	/** Nerin Director max tokens per request */
	readonly nerinDirectorMaxTokens: number;

	/** Nerin Director temperature (0-1) */
	readonly nerinDirectorTemperature: number;

	/** Nerin Director retry temperature — different temperature on retry (ADR-DM-4) */
	readonly nerinDirectorRetryTemperature: number;

	/**
	 * Shared secret for cron / internal job HTTP routes (e.g. weekly summary generation).
	 * When unset or empty, `x-cron-secret` validation is skipped (local dev only).
	 */
	readonly cronSecret: Redacted.Redacted<string>;
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
