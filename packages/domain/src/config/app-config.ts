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

	/** Nerin agent model ID */
	readonly nerinModelId: string;

	/** Nerin agent max tokens per request */
	readonly nerinMaxTokens: number;

	/** Nerin agent temperature (0-1, higher = more conversational) */
	readonly nerinTemperature: number;

	/** Daily LLM cost limit in dollars (Story 2.5) */
	readonly dailyCostLimit: number;

	/** Number of user messages allowed in the free tier before chat is blocked (Story 4.7) */
	readonly freeTierMessageThreshold: number;

	/** Minimum wait time (ms) before portrait reveal on frontend (Story 7.18) */
	readonly portraitWaitMinMs: number;

	/** Minimum facet confidence (0-100) required to allow profile sharing */
	readonly shareMinConfidence: number;

	/** Model ID for conversanalyzer (Haiku-tier, runs on every message) */
	readonly conversanalyzerModelId: string;

	/** Model ID for portrait generation */
	readonly portraitGeneratorModelId: string;

	/** Model ID for teaser portrait generation (Haiku-tier, runs at finalization) */
	readonly teaserModelId: string;

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

	/** Global daily assessment limit (circuit breaker) — Story 15.3 */
	readonly globalDailyAssessmentLimit: number;

	/** Minimum finalWeight threshold for evidence filtering (moderate/medium = 0.36) */
	readonly minEvidenceWeight: number;

	// ─── DRS (Depth Readiness Score) Configuration (Story 21-2) ──────

	/** Weight of Breadth component in DRS formula (default: 0.55) */
	readonly drsBreadthWeight: number;

	/** Weight of Engagement component in DRS formula (default: 0.45) */
	readonly drsEngagementWeight: number;

	/** Breadth offset: facets below this count yield 0 breadth (default: 10) */
	readonly drsBreadthOffset: number;

	/** Breadth range: facets above offset+range are capped at 1 (default: 15) */
	readonly drsBreadthRange: number;

	/** Word count threshold for full engagement credit (default: 120) */
	readonly drsWordCountThreshold: number;

	/** Evidence-per-message threshold for full engagement credit (default: 6) */
	readonly drsEvidenceThreshold: number;

	/** Weight of word component within engagement (default: 0.55) */
	readonly drsEngagementWordWeight: number;

	/** Weight of evidence component within engagement (default: 0.45) */
	readonly drsEngagementEvidenceWeight: number;

	/** Recency weights for energy multiplier [most recent, ..., oldest] (default: [1.0, 0.6, 0.3]) */
	readonly drsRecencyWeights: readonly number[];

	/** Energy weight for light responses (default: 0) */
	readonly drsEnergyWeightLight: number;

	/** Energy weight for medium responses (default: 1) */
	readonly drsEnergyWeightMedium: number;

	/** Energy weight for heavy responses (default: 2) */
	readonly drsEnergyWeightHeavy: number;

	/** Center point for light energy fit curve (default: 0.55) */
	readonly drsLightFitCenter: number;

	/** Range for light energy fit curve (default: 0.35) */
	readonly drsLightFitRange: number;

	/** Center point for medium energy fit curve (default: 0.55) */
	readonly drsMediumFitCenter: number;

	/** Range for medium energy fit curve (default: 0.35) */
	readonly drsMediumFitRange: number;

	/** Center point for heavy energy fit curve (default: 0.65) */
	readonly drsHeavyFitCenter: number;

	/** Range for heavy energy fit curve (default: 0.25) */
	readonly drsHeavyFitRange: number;

	// ─── Territory Scoring Configuration (Story 21-3) ──────────────────

	/** Minimum evidence count to consider a facet "covered" (default: 3) */
	readonly territoryMinEvidenceThreshold: number;

	/** Maximum times a territory can be visited per conversation (default: 2) */
	readonly territoryMaxVisits: number;

	/** Freshness bonus growth per exchange since last visit (default: 0.05) */
	readonly territoryFreshnessRate: number;

	/** Minimum freshness bonus (default: 0.8) */
	readonly territoryFreshnessMin: number;

	/** Maximum freshness bonus — capped at 1.2 per failure mode analysis (default: 1.2) */
	readonly territoryFreshnessMax: number;

	// ─── Cold-Start Configuration (Story 21-4) ──────────────────────────

	/** Number of user messages before scoring formula takes over (default: 3) */
	readonly territoryColdStartThreshold: number;
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
