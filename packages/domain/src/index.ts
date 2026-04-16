/**
 * Domain Package - Core business types and errors
 */

// Configuration service interface (implementation in @workspace/infrastructure)
export { AppConfig, type AppConfigService } from "./config/index";
// Archetype constants (Story 3.2)
export { CURATED_ARCHETYPES } from "./constants/archetypes";
// Big Five constants and types (Story 2.3)
export {
	AGREEABLENESS_FACETS,
	ALL_FACETS,
	CONSCIENTIOUSNESS_FACETS,
	EXTRAVERSION_FACETS,
	FACET_TO_TRAIT,
	type FacetName,
	isFacetName,
	isTraitName,
	NEUROTICISM_FACETS,
	OCEAN_INTERLEAVED_ORDER,
	OPENNESS_FACETS,
	TRAIT_NAMES,
	TRAIT_TO_FACETS,
	type TraitName,
} from "./constants/big-five";
// Facet descriptions (Story 8.3)
export { FACET_DESCRIPTIONS, type FacetDescriptions } from "./constants/facet-descriptions";
// Facet prompt definitions — single source of truth for analyzer & portrait prompts
export {
	FACET_PROMPT_DEFINITIONS,
	type FacetPromptDefinitions,
} from "./constants/facet-prompt-definitions";
// Finalization progress constants (Story 9.1)
export {
	FINALIZATION_PROGRESS,
	type FinalizationProgress,
	FinalizationProgressSchema,
} from "./constants/finalization";
// Life domain constants (Story 9.1)
export {
	type ActiveLifeDomain,
	LIFE_DOMAIN_DEFINITIONS,
	LIFE_DOMAINS,
	type LifeDomain,
	LifeDomainSchema,
	STEERABLE_DOMAINS,
} from "./constants/life-domain";
// Nerin character bible — live modules (portrait context)
export { PORTRAIT_CONTEXT } from "./constants/nerin/portrait-context";
// Nerin Actor prompt (Story 43-4, ADR-DM-3)
export {
	ACTOR_BRIEF_FRAMING,
	ACTOR_VOICE_RULES,
	buildActorPrompt,
} from "./constants/nerin-actor-prompt";
// Nerin Director prompts (Story 43-3, phase-based steering)
export { NERIN_DIRECTOR_CLOSING_PROMPT } from "./constants/nerin-director-closing-prompt";
export {
	buildDirectorUserMessage,
	getDirectorPromptForPhase,
	NERIN_DIRECTOR_CLOSING_PROMPT as NERIN_DIRECTOR_CLOSING_PROMPT_V2,
	NERIN_DIRECTOR_EXPLORING_PROMPT,
	NERIN_DIRECTOR_OPENING_PROMPT,
	NERIN_DIRECTOR_PROMPT,
} from "./constants/nerin-director-prompt";
// Nerin farewell constants (Story 7.18)
export {
	NERIN_FAREWELL_MESSAGES,
	pickFarewellMessage,
} from "./constants/nerin-farewell";
// Nerin greeting constants (Story 7.10)
export {
	GREETING_MESSAGES,
	OPENING_QUESTIONS,
	pickOpeningQuestion,
} from "./constants/nerin-greeting";
// Nerin persona constant (Story 2.12, rewritten Story 43-4)
export { NERIN_PERSONA } from "./constants/nerin-persona";
// Ocean Hieroglyph normalized path strings (for flubber SVG morphing)
export { OCEAN_HIEROGLYPH_PATHS } from "./constants/ocean-hieroglyph-paths";
// Ocean Hieroglyph lookup table (Story 10.1)
export { OCEAN_HIEROGLYPHS } from "./constants/ocean-hieroglyphs";
// Trait descriptions (Story 8.2)
export { TRAIT_DESCRIPTIONS, type TraitDescriptions } from "./constants/trait-descriptions";
// Validation constants (Story 9.1)
export {
	CONFIDENCE_MAX,
	CONFIDENCE_MIN,
	SCORE_MAX,
	SCORE_MIN,
} from "./constants/validation";
// Auth context tag (Story 1.4 — populated by AuthMiddleware)
export { AuthenticatedUser, CurrentUser } from "./context/current-user";
// Evidence errors
export {
	EvidenceValidationError,
	FacetEvidencePersistenceError,
} from "./errors/evidence.errors";
// HTTP API errors (canonical definitions)
export {
	AccountNotFound,
	AgentInvocationError,
	AnalyzerError,
	AssessmentNotCompletedError,
	ConcurrentMessageError,
	ConversationAlreadyExists,
	CostLimitExceeded,
	DatabaseError,
	DuplicateCheckoutError,
	FeatureUnavailable,
	FinalizationInProgressError,
	FreeTierLimitReached,
	GlobalAssessmentLimitReached,
	InsufficientCreditsError,
	InvalidCredentials,
	InvalidFacetNameError,
	InvalidYearMonthError,
	InvitationAlreadyRespondedError,
	InvitationNotFoundError,
	MalformedEvidenceError,
	MessageRateLimitError,
	NerinError,
	ProfileError,
	ProfileNotFound,
	ProfilePrivate,
	QrTokenAlreadyAcceptedError,
	QrTokenExpiredError,
	QrTokenNotFoundError,
	RateLimitExceeded,
	RelationshipAnalysisNotFoundError,
	RelationshipAnalysisUnauthorizedError,
	RelationshipSharedNoteValidationError,
	SelfInvitationError,
	SessionCompletedError,
	SessionExpired,
	SessionNotCompleted,
	SessionNotFinalizing,
	SessionNotFound,
	SubscriptionRequired,
	Unauthorized,
	UnknownProductError,
	UserAlreadyExists,
	WebhookVerificationError,
	WeeklyLetterNotFound,
} from "./errors/http.errors";
// Relationship analysis prompt (Story 14.4)
export {
	buildRelationshipAnalysisPrompt,
	type RelationshipAnalysisPromptInput,
} from "./prompts/relationship-analysis.prompt";
export {
	type BuildUserSummaryPromptInput,
	buildUserSummaryPrompt,
} from "./prompts/user-summary.prompt";
export {
	buildWeeklySummaryPrompt,
	type WeeklySummaryPromptParts,
} from "./prompts/weekly-summary.prompt";
export {
	type AnalysisTarget,
	AnalyzerRepository,
} from "./repositories/analyzer.repository";
// Assessment result repository (Story 11.2)
export {
	AssessmentResultError,
	type AssessmentResultInput,
	type AssessmentResultRecord,
	AssessmentResultRepository,
	type AssessmentResultUpdateInput,
	type ResultStage,
} from "./repositories/assessment-result.repository";
// Conversanalyzer repository (Story 10.2, Story 24-1, Story 42-2, Story 43-6)
export {
	ConversanalyzerError,
	type ConversanalyzerEvidenceOutput,
	type ConversanalyzerInput,
	ConversanalyzerRepository,
} from "./repositories/conversanalyzer.repository";
// Repository interfaces (ports in hexagonal architecture)
export {
	type CheckInEligibleSession,
	ConversationRepository,
	type DropOffSession,
} from "./repositories/conversation.repository";
// Conversation evidence repository (Story 10.1)
export {
	ConversationEvidenceError,
	type ConversationEvidenceInput,
	type ConversationEvidenceRecord,
	ConversationEvidenceRepository,
} from "./repositories/conversation-evidence.repository";
export { CostGuardRepository } from "./repositories/cost-guard.repository";
export {
	type DailyCheckIn,
	type DailyCheckInMood,
	DailyCheckInRepository,
	type DailyCheckInVisibility,
	type UpsertDailyCheckIn,
} from "./repositories/daily-check-in.repository";
// Assessment exchange repository (Story 23-3)
export {
	type ExchangeRecord,
	ExchangeRepository,
	type ExchangeUpdateInput,
} from "./repositories/exchange.repository";
export { FacetEvidenceRepository } from "./repositories/facet-evidence.repository";
export {
	LifecycleEmailRepository,
	type SubscriptionNudgeEligibleUser,
} from "./repositories/lifecycle-email.repository";
export {
	type LoggerMethods,
	LoggerRepository,
} from "./repositories/logger.repository";
export { MessageRepository } from "./repositories/message.repository";
export {
	type NerinActorInvokeInput,
	type NerinActorInvokeOutput,
	NerinActorRepository,
} from "./repositories/nerin-actor.repository";
// Backward compat re-exports (consumers migrating in Story 43-5)
export {
	NerinAgentRepository,
	type NerinInvokeInput,
	type NerinInvokeOutput,
} from "./repositories/nerin-agent.repository";
// Nerin Director repository (Story 43-3)
export {
	NerinDirectorError,
	type NerinDirectorInput,
	type NerinDirectorOutput,
	NerinDirectorRepository,
} from "./repositories/nerin-director.repository";
// Portrait repository (Story 13.3, refactored for queue-based generation)
export {
	type InsertPortraitFailed,
	type InsertPortraitWithContent,
	type Portrait,
	PortraitRepository,
	type PortraitStatus,
	type PortraitTier,
} from "./repositories/portrait.repository";
export {
	PortraitGenerationError,
	type PortraitGenerationInput,
	PortraitGeneratorRepository,
} from "./repositories/portrait-generator.repository";
// Portrait rating repository (Story 19-2)
export type { InsertPortraitRating } from "./repositories/portrait-rating.repository";
export { PortraitRatingRepository } from "./repositories/portrait-rating.repository";
export {
	type ProfileAccessLogInput,
	ProfileAccessLogRepository,
} from "./repositories/profile-access-log.repository";
export {
	type CreatePublicProfileInput,
	type PublicProfileData,
	PublicProfileRepository,
} from "./repositories/public-profile.repository";
export type { InsertPurchaseEvent } from "./repositories/purchase-event.repository";
// Purchase event repository (Story 13.1)
export { PurchaseEventRepository } from "./repositories/purchase-event.repository";
export {
	PushNotificationQueueRepository,
	type QueuedPushNotification,
	type QueuePushNotificationInput,
} from "./repositories/push-notification-queue.repository";
export {
	type PushSubscriptionInput,
	type PushSubscriptionKeys,
	type PushSubscriptionRecord,
	PushSubscriptionRepository,
} from "./repositories/push-subscription.repository";
// QR token repository (Story 34-1)
export { QrTokenRepository } from "./repositories/qr-token.repository";
export {
	RedisConnectionError,
	RedisOperationError,
	RedisRepository,
} from "./repositories/redis.repository";
// Relationship analysis repository (Story 14.4)
export {
	AnalysisNotFoundError,
	RelationshipAnalysisRepository,
} from "./repositories/relationship-analysis.repository";
// Relationship analysis generator repository (Story 14.4)
export {
	RelationshipAnalysisGenerationError,
	type RelationshipAnalysisGenerationInput,
	type RelationshipAnalysisGenerationOutput,
	RelationshipAnalysisGeneratorRepository,
} from "./repositories/relationship-analysis-generator.repository";
export {
	type RelationshipSharedNoteRecord,
	RelationshipSharedNoteRepository,
	type RelationshipSharedNoteWithAuthor,
} from "./repositories/relationship-shared-note.repository";
// Resend email repository (Story 31-7)
export {
	EmailError,
	type ResendEmailMethods,
	ResendEmailRepository,
	type SendEmailInput,
} from "./repositories/resend-email.repository";
// User account repository (Story 30-2)
export {
	type ScheduleFirstDailyPromptOutcome,
	UserAccountRepository,
} from "./repositories/user-account.repository";
export {
	type UserSummaryQuoteEntry,
	type UserSummaryRecord,
	UserSummaryRepository,
	type UserSummaryThemeEntry,
	type UserSummaryUpsertInput,
} from "./repositories/user-summary.repository";
export {
	UserSummaryGenerationError,
	type UserSummaryGenerationInput,
	type UserSummaryGenerationOutput,
	UserSummaryGeneratorRepository,
} from "./repositories/user-summary-generator.repository";
// Waitlist repository (Story 15.3)
export { WaitlistRepository } from "./repositories/waitlist.repository";
export {
	PushDeliveryError,
	PushSubscriptionExpiredError,
	PushUnavailableError,
	WebPushRepository,
} from "./repositories/web-push.repository";
export {
	type WeeklySummary,
	WeeklySummaryRepository,
	type WeeklySummarySaveInput,
} from "./repositories/weekly-summary.repository";
export {
	type WeeklySummaryCheckInLine,
	WeeklySummaryGenerationError,
	type WeeklySummaryGenerationInput,
	type WeeklySummaryGenerationOutput,
	WeeklySummaryGeneratorRepository,
} from "./repositories/weekly-summary-generator.repository";
// Agent response schemas for structured LLM output (Story 2.4, Task 13)
export {
	type AnalyzerResponse,
	AnalyzerResponseJsonSchema,
	AnalyzerResponseSchema,
	BatchAnalyzerResponseJsonSchema,
	BatchAnalyzerResponseWrappedSchema,
	type BatchFacetExtraction,
	BatchFacetExtractionSchema,
	EmotionalTone,
	FacetExtractionSchema,
	HighlightRangeSchema,
	type NerinResponse,
	NerinResponseJsonSchema,
	NerinResponseSchema,
	validateAnalyzerResponse,
	validateNerinResponse,
} from "./schemas/agent-schemas";
// Big Five name schemas — typed literal schemas for TraitName and FacetName
export { FacetNameSchema, TraitNameSchema } from "./schemas/big-five-schemas";
// ConversAnalyzer extraction schemas (Story 24-1, Story 42-2, Story 43-6)
export {
	DomainFacetMapToolOutput,
	decodeDomainFacetMap,
	decodeEvidenceLenient,
	decodeEvidenceStrict,
	decodeFacetMap,
	domainFacetMapJsonSchema,
	type EvidenceOnlyExtraction,
	EvidenceOnlyToolOutput,
	evidenceOnlyJsonSchema,
	FacetMapToolOutput,
	facetMapJsonSchema,
	LenientEvidenceOnlyToolOutput,
} from "./schemas/conversanalyzer-v2-extraction";
// Evidence extraction schemas — item-level schemas and facet remap
export {
	type EvidenceItem,
	EvidenceItemJsonSchemaSource,
	EvidenceItemSchema,
	FACET_REMAP,
} from "./schemas/evidence-extraction";
// Assessment message schema — character limit enforcement (Story 4.8)
export {
	ASSESSMENT_MESSAGE_MAX_LENGTH,
	MessageContentSchema,
} from "./schemas/message";
// OCEAN code branded schemas (canonical definitions)
export { OceanCode4Schema, OceanCode5Schema } from "./schemas/ocean-code";
// Result schemas — canonical FacetResult and TraitResult types
export {
	type FacetResult,
	FacetResultSchema,
	type TraitResult,
	TraitResultSchema,
} from "./schemas/result-schemas";
// UserSummary LLM payload (Story 7.1)
export {
	type DecodeUserSummaryLlmPayloadResult,
	decodeUserSummaryLlmPayload,
	type UserSummaryLlmPayload,
	UserSummaryLlmPayloadSchema,
} from "./schemas/user-summary-llm";
// Confidence calculation service
export {
	calculateTraitConfidence,
	calculateWeightedAverage,
	initializeFacetConfidence,
	mergeConfidenceScores,
	updateFacetConfidence,
} from "./services/confidence-calculator.service";
// Cost calculation service
export {
	type CostResult,
	calculateCost,
	getPricingForModel,
	PRICING,
} from "./services/cost-calculator.service";
// Portrait job queue (webhook → Effect worker bridge)
export { type PortraitJob, PortraitJobQueue } from "./services/portrait-job-queue";
// Archetype types (Story 3.2)
export type {
	AgreeablenessLevel,
	Archetype,
	ConscientiousnessLevel,
	ExtraversionLevel,
	NeuroticismLevel,
	OceanCode4,
	OceanCode5,
	OpennessLevel,
	TraitLevel,
} from "./types/archetype";
export { getTraitLevelLabel, TRAIT_LETTER_MAP, TRAIT_LEVEL_LABELS } from "./types/archetype";
// Evidence input type (Story 9.1, v2 Story 18-1)
export type {
	EvidenceConfidence,
	EvidenceInput,
	EvidencePolarity,
	EvidenceStrength,
	ExtractedEvidence,
} from "./types/evidence";
// Facet types
export type {
	AgreeableFacet,
	BigFiveFacet,
	ConscientiousnessFacet,
	ExtravertFacet,
	FacetConfidenceScores,
	NeuroticismFacet,
	OpennessFacet,
} from "./types/facet";
export { FACETS_BY_TRAIT } from "./types/facet";
// Facet evidence and scoring types (Story 2.3)
export type {
	FacetEvidence,
	FacetScore,
	FacetScoresMap,
	HighlightRange,
	SavedFacetEvidence,
	TraitScore,
	TraitScoresMap,
} from "./types/facet-evidence";
// Facet level types and mappings (Story 8.3)
export {
	FACET_LETTER_MAP,
	FACET_LEVEL_LABELS,
	type FacetLevelCode,
	type FacetLevelLabels,
} from "./types/facet-levels";
// Domain message type (framework-agnostic conversation messages)
export type {
	AssistantMessage,
	ConversationMessage,
	DomainMessage,
	UserMessage,
} from "./types/message";
// Ocean Hieroglyph types (Story 10.1)
export type { HieroglyphDef, HieroglyphElement } from "./types/ocean-hieroglyph";
// Extraction tier type (still used by exchange repository)
export type { ExtractionTier } from "./types/pacing-pipeline.types";
// Portrait rating types (Story 19-2)
export type {
	DepthSignalLevel,
	PortraitRating,
	PortraitRatingRecord,
	PortraitType,
} from "./types/portrait-rating.types";
export {
	DEPTH_SIGNAL_LEVELS,
	PORTRAIT_RATINGS,
	PORTRAIT_TYPES,
} from "./types/portrait-rating.types";
export type {
	EntitlementFeature,
	PolarWebhookEvent,
	PurchaseEvent,
	PurchaseEventType,
	SubscriptionStatus,
	UserCapabilities,
} from "./types/purchase.types";
// Purchase event types (Story 13.1)
export {
	ENTITLEMENT_FEATURES,
	PURCHASE_EVENT_TYPES,
	parseMetadata,
	SUBSCRIPTION_STATUSES,
} from "./types/purchase.types";
// Relationship types (Story 34-1 — QR Token Infrastructure)
export type {
	QrToken,
	QrTokenStatus,
	RelationshipAnalysis,
} from "./types/relationship.types";
export { QR_TOKEN_TTL_HOURS } from "./types/relationship.types";
// Session types
export type { MessageRole, Session, SessionStatus } from "./types/session";
// Trait types (Big Five)
export type { BigFiveTrait, TraitConfidenceScores } from "./types/trait";
export { BIG_FIVE_TRAITS } from "./types/trait";
// Polarity deviation adapter (Story 42-1)
export { adaptExtractedEvidence } from "./utils/adapt-extracted-evidence";
// Coverage analyzer — evidence-to-target pure function (Story 43-2)
export {
	analyzeCoverage,
	type ConversationPhase,
	type CoverageHistoryEntry,
	type CoverageTarget,
	type CoverageTargetWithDefinitions,
	enrichWithDefinitions,
	extractCoverageHistoryEntry,
} from "./utils/coverage-analyzer";
// Date utilities for cost tracking and rate limiting
export { getNextDayMidnightUTC, getUTCDateKey } from "./utils/date.utils";
export { deriveDeviation } from "./utils/derive-deviation";
// Domain distribution utility (Story 10.2)
export { aggregateDomainDistribution, type DomainDistribution } from "./utils/domain-distribution";
// Formula functions (Story 10.3)
export {
	computeContextMean,
	computeContextWeight,
	computeFacetMetrics,
	computeFinalWeight,
	type FacetMetrics,
	FORMULA_DEFAULTS,
	type FormulaConfig,
} from "./utils/formula";
// Utility functions
export {
	buildPortraitPrompt,
	calculateConfidenceFromFacetScores,
	calculateOverallConfidence,
	createInitialFacetScoresMap,
	createInitialTraitScoresMap,
	DEFAULT_FACET_CONFIDENCE,
	DEFAULT_FACET_SCORE,
	DEFAULT_TRAIT_SCORE,
	deriveCapabilities,
	deriveTraitSummary,
	extract4LetterCode,
	generateOceanCode,
	getFacetColor,
	getFacetLevel,
	getSubscribedSinceForCurrentSubscription,
	getSubscriptionStatus,
	getTraitColor,
	getTraitGradient,
	getTribeGroup,
	hasPortraitForResult,
	type IsoWeekBounds,
	isEntitledTo,
	lookupArchetype,
	resolveIsoWeekBounds,
	type TraitConfidence,
	type TribeGroup,
	toFacetDisplayName,
} from "./utils/index";
// Score computation (Story 11.3)
export {
	computeAllFacetResults,
	computeDomainCoverage,
	computeTraitResults,
} from "./utils/score-computation";
// Version detection (Story 36-3)
export { isLatestVersion } from "./utils/version-detection";
