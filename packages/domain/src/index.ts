/**
 * Domain Package - Core business types and errors
 */

// Configuration service interface (implementation in @workspace/infrastructure)
export { AppConfig, type AppConfigService } from "./config/index";
// Archetype constants (Story 3.2)
export { CURATED_ARCHETYPES, TEASER_TRAIT_LETTERS } from "./constants/archetypes";
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
	LIFE_DOMAINS,
	type LifeDomain,
	LifeDomainSchema,
	STEERABLE_DOMAINS,
} from "./constants/life-domain";
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
// Nerin persona constant (Story 2.12)
export { NERIN_PERSONA } from "./constants/nerin-persona";
// Territory catalog (Story 21-1)
export {
	COLD_START_TERRITORIES,
	getTerritoryById,
	TERRITORY_CATALOG,
} from "./constants/territory-catalog";
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
	AgentInvocationError,
	AnalyzerError,
	AssessmentAlreadyExists,
	ConcurrentMessageError,
	CostLimitExceeded,
	DatabaseError,
	DuplicateCheckoutError,
	FinalizationInProgressError,
	FreeTierLimitReached,
	GlobalAssessmentLimitReached,
	InsufficientCreditsError,
	InvalidCredentials,
	InvalidFacetNameError,
	InvitationAlreadyRespondedError,
	InvitationNotFoundError,
	MalformedEvidenceError,
	MessageRateLimitError,
	NerinError,
	ProfileError,
	ProfileNotFound,
	ProfilePrivate,
	RateLimitExceeded,
	RelationshipAnalysisNotFoundError,
	RelationshipAnalysisUnauthorizedError,
	SelfInvitationError,
	SessionCompletedError,
	SessionExpired,
	SessionNotCompleted,
	SessionNotFinalizing,
	SessionNotFound,
	Unauthorized,
	UnknownProductError,
	UserAlreadyExists,
	WebhookVerificationError,
} from "./errors/http.errors";
// Relationship analysis prompt (Story 14.4)
export {
	buildRelationshipAnalysisPrompt,
	type RelationshipAnalysisPromptInput,
} from "./prompts/relationship-analysis.prompt";
export {
	type AnalysisTarget,
	AnalyzerRepository,
} from "./repositories/analyzer.repository";
export { AssessmentMessageRepository } from "./repositories/assessment-message.repository";
// Assessment result repository (Story 11.2)
export {
	AssessmentResultError,
	type AssessmentResultInput,
	type AssessmentResultRecord,
	AssessmentResultRepository,
	type AssessmentResultUpdateInput,
	type ResultStage,
} from "./repositories/assessment-result.repository";
// Repository interfaces (ports in hexagonal architecture)
export { AssessmentSessionRepository } from "./repositories/assessment-session.repository";
// Conversanalyzer repository (Story 10.2)
export {
	ConversanalyzerError,
	type ConversanalyzerInput,
	type ConversanalyzerOutput,
	ConversanalyzerRepository,
} from "./repositories/conversanalyzer.repository";
// Conversation evidence repository (Story 10.1)
export {
	ConversationEvidenceError,
	type ConversationEvidenceInput,
	type ConversationEvidenceRecord,
	ConversationEvidenceRepository,
} from "./repositories/conversation-evidence.repository";
export { CostGuardRepository } from "./repositories/cost-guard.repository";
export { FacetEvidenceRepository } from "./repositories/facet-evidence.repository";
export {
	type LoggerMethods,
	LoggerRepository,
} from "./repositories/logger.repository";
export {
	NerinAgentRepository,
	type NerinInvokeInput,
	type NerinInvokeOutput,
} from "./repositories/nerin-agent.repository";
// Payment gateway repository (Story 13.2)
export { PaymentGatewayRepository } from "./repositories/payment-gateway.repository";
// Portrait repository (Story 13.3 — two-tier portrait system)
export {
	DuplicatePortraitError,
	type InsertPortraitPlaceholder,
	type Portrait,
	PortraitNotFoundError,
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
export type {
	InsertEventWithPortraitResult,
	InsertPurchaseEvent,
} from "./repositories/purchase-event.repository";
// Purchase event repository (Story 13.1, extended Story 13.3)
export { PurchaseEventRepository } from "./repositories/purchase-event.repository";
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
// Relationship invitation repository (Story 14.2)
export { RelationshipInvitationRepository } from "./repositories/relationship-invitation.repository";
// Teaser portrait repository (Story 11.5)
export {
	TeaserPortraitError,
	type TeaserPortraitInput,
	type TeaserPortraitOutput,
	TeaserPortraitRepository,
} from "./repositories/teaser-portrait.repository";
// Waitlist repository (Story 15.3)
export { WaitlistRepository } from "./repositories/waitlist.repository";
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
// Assessment message schema — character limit enforcement (Story 4.8)
export {
	ASSESSMENT_MESSAGE_MAX_LENGTH,
	AssessmentMessageContentSchema,
} from "./schemas/assessment-message";
// Big Five name schemas — typed literal schemas for TraitName and FacetName
export { FacetNameSchema, TraitNameSchema } from "./schemas/big-five-schemas";
// Evidence extraction schemas — ConversAnalyzer structured output with lenient filtering
export {
	decodeEvidenceExtraction,
	type EvidenceExtraction,
	EvidenceExtractionSchema,
	type EvidenceItem,
	EvidenceItemSchema,
	evidenceExtractionJsonSchema,
	LenientEvidenceExtractionSchema,
} from "./schemas/evidence-extraction";
// OCEAN code branded schemas (canonical definitions)
export { OceanCode4Schema, OceanCode5Schema } from "./schemas/ocean-code";
// Result schemas — canonical FacetResult and TraitResult types
export {
	type FacetResult,
	FacetResultSchema,
	type TraitResult,
	TraitResultSchema,
} from "./schemas/result-schemas";
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
	PRICING,
} from "./services/cost-calculator.service";
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
export type { EvidenceConfidence, EvidenceInput, EvidenceStrength } from "./types/evidence";
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
export type {
	AmplifyPromptInput,
	ContradictionFocus,
	ContradictionTarget,
	ConvergenceFocus,
	ConvergenceTarget,
	DomainScore,
	EntryPressureDebug,
	ExplorePromptInput,
	MoveGovernorDebug,
	NoticingFocus,
	ObservationCandidate,
	ObservationFocus,
	ObservationGatingDebug,
	OpenPromptInput,
	PromptBuilderInput,
	RankedTerritory,
	RelateFocus,
	TerritoryScoreBreakdown,
	TerritoryScorerOutput,
	TerritorySelectorOutput,
} from "./types/pacing";
// Pacing pipeline types (Story 23-1)
export {
	CONVERSATIONAL_INTENTS,
	type ConversationalIntent,
	ENERGY_BANDS,
	ENTRY_PRESSURES,
	type EnergyBand,
	type EntryPressure,
	TELLING_BANDS,
	type TellingBand,
} from "./types/pacing";
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
	PolarWebhookEvent,
	PurchaseEvent,
	PurchaseEventType,
	UserCapabilities,
} from "./types/purchase.types";
// Purchase event types (Story 13.1)
export {
	PURCHASE_EVENT_TYPES,
	parseMetadata,
} from "./types/purchase.types";
// Relationship types (Story 14.2, 14.4)
export type {
	CreateInvitationInput,
	InvitationStatus,
	RelationshipAnalysis,
	RelationshipInvitation,
} from "./types/relationship.types";
export { INVITATION_EXPIRY_DAYS } from "./types/relationship.types";
// Session types
export type { MessageRole, Session, SessionStatus } from "./types/session";
// Steering output type (Story 21-1)
export type { SteeringOutput } from "./types/steering";
// Territory types (Story 21-1)
export {
	ENERGY_LEVELS,
	type EnergyLevel,
	type Territory,
	type TerritoryId,
	TerritoryIdSchema,
} from "./types/territory";
// Trait types (Big Five)
export type { BigFiveTrait, TraitConfidenceScores } from "./types/trait";
export { BIG_FIVE_TRAITS } from "./types/trait";
// Date utilities for cost tracking and rate limiting
export { getNextDayMidnightUTC, getUTCDateKey } from "./utils/date.utils";
// Domain distribution utility (Story 10.2)
export { aggregateDomainDistribution, type DomainDistribution } from "./utils/domain-distribution";
// Formula functions (Story 10.3)
export {
	computeContextMean,
	computeContextWeight,
	computeFacetMetrics,
	computeFinalWeight,
	computeNormalizedEntropy,
	computeProjectedEntropy,
	computeSteeringTarget,
	type FacetMetrics,
	FORMULA_DEFAULTS,
	type FormulaConfig,
	GREETING_SEED_POOL,
	type SteeringTarget,
} from "./utils/formula";
// Utility functions
export {
	buildChatSystemPrompt,
	calculateConfidenceFromFacetScores,
	calculateOverallConfidence,
	computeETarget,
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
	getTraitColor,
	getTraitGradient,
	lookupArchetype,
	PACING_CONSTANTS,
	type PacingResult,
	type PacingState,
	type TraitConfidence,
	toFacetDisplayName,
} from "./utils/index";
// Score computation (Story 11.3)
export {
	computeAllFacetResults,
	computeDomainCoverage,
	computeTraitResults,
} from "./utils/score-computation";
// Steering utilities (Story 21-2, 21-3, 21-4, 21-5)
export {
	buildFacetEvidenceCounts,
	buildTerritoryPrompt,
	buildTerritorySystemPromptSection,
	computeBreadth,
	computeCoverageValue,
	computeDRS,
	computeEnergyFit,
	computeEnergyMultiplier,
	computeEngagement,
	computeFreshnessBonus,
	type DRSConfig,
	type DRSInput,
	extractDRSConfig,
	extractTerritoryScorerConfig,
	type ScoredTerritory,
	scoreAllTerritories,
	scoreTerritory,
	selectColdStartTerritory,
	selectTerritory,
	selectTerritoryWithColdStart,
	type TerritoryPromptContent,
	type TerritoryScorerConfig,
	type TerritoryVisitHistory,
} from "./utils/steering";
