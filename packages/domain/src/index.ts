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
export { CurrentUser } from "./context/current-user";
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
	InvalidCredentials,
	InvalidFacetNameError,
	MalformedEvidenceError,
	MessageRateLimitError,
	NerinError,
	ProfileError,
	ProfileNotFound,
	ProfilePrivate,
	RateLimitExceeded,
	SessionCompletedError,
	SessionExpired,
	SessionNotCompleted,
	SessionNotFinalizing,
	SessionNotFound,
	Unauthorized,
	UserAlreadyExists,
} from "./errors/http.errors";
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
// Finalization evidence repository (Story 11.2)
export {
	FinalizationEvidenceError,
	type FinalizationEvidenceInput,
	type FinalizationEvidenceRecord,
	FinalizationEvidenceRepository,
} from "./repositories/finalization-evidence.repository";
// FinAnalyzer repository (Story 11.2)
export {
	type FinalizationEvidenceOutput,
	FinanalyzerError,
	type FinanalyzerMessage,
	type FinanalyzerOutput,
	FinanalyzerRepository,
} from "./repositories/finanalyzer.repository";
export {
	type LoggerMethods,
	LoggerRepository,
} from "./repositories/logger.repository";
export {
	NerinAgentRepository,
	type NerinInvokeInput,
	type NerinInvokeOutput,
} from "./repositories/nerin-agent.repository";
export {
	BudgetPausedError,
	ConfidenceGapError,
	OrchestrationError,
	OrchestratorRepository,
	PrecisionGapError,
	type ProcessAnalysisInput,
	type ProcessMessageInput,
	type ProcessMessageOutput,
} from "./repositories/orchestrator.repository";
export {
	type GraphInput,
	type GraphOutput,
	OrchestratorGraphRepository,
} from "./repositories/orchestrator-graph.repository";
export {
	PortraitGenerationError,
	type PortraitGenerationInput,
	PortraitGeneratorRepository,
} from "./repositories/portrait-generator.repository";
export {
	type CreatePublicProfileInput,
	type PublicProfileData,
	PublicProfileRepository,
} from "./repositories/public-profile.repository";
export type { InsertPurchaseEvent } from "./repositories/purchase-event.repository";
// Purchase event repository (Story 13.1)
export { PurchaseEventRepository } from "./repositories/purchase-event.repository";
export {
	RedisConnectionError,
	RedisOperationError,
	RedisRepository,
} from "./repositories/redis.repository";
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
export { TRAIT_LETTER_MAP, TRAIT_LEVEL_LABELS } from "./types/archetype";
// Evidence input type (Story 9.1)
export type { EvidenceInput } from "./types/evidence";
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
	PurchaseEvent,
	PurchaseEventType,
	UserCapabilities,
} from "./types/purchase.types";
// Purchase event types (Story 13.1)
export {
	PURCHASE_EVENT_TYPES,
	parseMetadata,
} from "./types/purchase.types";
// Session types
export type { MessageRole, Session, SessionStatus } from "./types/session";
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
	computeNormalizedEntropy,
	computeProjectedEntropy,
	computeSteeringTarget,
	type FacetMetrics,
	FORMULA_DEFAULTS,
	type FormulaConfig,
	GREETING_SEED_POOL,
	type SteeringTarget,
} from "./utils/formula";
// Highlight position computation (Story 11.2)
export { computeHighlightPositions } from "./utils/highlight";
// Utility functions
export {
	aggregateFacetScores,
	buildChatSystemPrompt,
	calculateConfidenceFromFacetScores,
	calculateOverallConfidence,
	createInitialFacetScoresMap,
	createInitialTraitScoresMap,
	DEFAULT_FACET_CONFIDENCE,
	DEFAULT_FACET_SCORE,
	DEFAULT_TRAIT_SCORE,
	deriveCapabilities,
	deriveTraitScores,
	deriveTraitSummary,
	extract4LetterCode,
	generateOceanCode,
	getFacetColor,
	getFacetLevel,
	getTraitColor,
	getTraitGradient,
	lookupArchetype,
	type TraitConfidence,
	toFacetDisplayName,
} from "./utils/index";
