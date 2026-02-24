/**
 * Infrastructure Package Exports
 *
 * Provides repository implementations, database context, and database schema.
 */

// Configuration
export {
	AppConfig,
	AppConfigLive,
	type AppConfigService,
	AppConfigTestLive,
	createTestAppConfig,
	defaultTestConfig,
	loadConfig,
} from "./config/index";
// Better Auth context
export { BetterAuthLive, BetterAuthService } from "./context/better-auth";
// Database context
export { Database, DatabaseStack } from "./context/database";
// Database schema (for Better Auth adapter and migrations)
export * as dbSchema from "./db/drizzle/schema";
// Analyzer repository implementations
export { AnalyzerClaudeRepositoryLive } from "./repositories/analyzer.claude.repository";
export { AnalyzerMockRepositoryLive } from "./repositories/analyzer.mock.repository";
// Message repository implementation
export { AssessmentMessageDrizzleRepositoryLive } from "./repositories/assessment-message.drizzle.repository";
// Assessment result repository implementation (Story 11.2)
export { AssessmentResultDrizzleRepositoryLive } from "./repositories/assessment-result.drizzle.repository";
// Session repository implementation
export { AssessmentSessionDrizzleRepositoryLive } from "./repositories/assessment-session.drizzle.repository";
// Checkpointer repository implementations
export { CheckpointerMemoryRepositoryLive } from "./repositories/checkpointer.memory.repository";
export { CheckpointerPostgresRepositoryLive } from "./repositories/checkpointer.postgres.repository";
// Checkpointer repository interface (lives in infrastructure — wraps LangGraph-specific type)
export { CheckpointerRepository } from "./repositories/checkpointer.repository";
// Conversanalyzer repository implementation (Story 10.2)
export { ConversanalyzerAnthropicRepositoryLive } from "./repositories/conversanalyzer.anthropic.repository";
// Conversation evidence repository implementation (Story 10.1)
export { ConversationEvidenceDrizzleRepositoryLive } from "./repositories/conversation-evidence.drizzle.repository";
// CostGuard repository implementation
export { CostGuardRedisRepositoryLive } from "./repositories/cost-guard.redis.repository";
// Facet evidence no-op repository (Story 9.1 — old table dropped, stub for orchestrator compat)
export { FacetEvidenceNoopRepositoryLive } from "./repositories/facet-evidence.noop.repository";
// Facet steering hints
export { FACET_STEERING_HINTS } from "./repositories/facet-steering";
// Finalization evidence repository implementation (Story 11.2)
export { FinalizationEvidenceDrizzleRepositoryLive } from "./repositories/finalization-evidence.drizzle.repository";
// FinAnalyzer repository implementation (Story 11.2)
export { FinanalyzerAnthropicRepositoryLive } from "./repositories/finanalyzer.anthropic.repository";
// Logger repository implementation
export { LoggerPinoRepositoryLive } from "./repositories/logger.pino.repository";
// Nerin agent repository implementations
export { NerinAgentLangGraphRepositoryLive } from "./repositories/nerin-agent.langgraph.repository";
export { NerinAgentMockRepositoryLive } from "./repositories/nerin-agent.mock.repository";
// Orchestrator repository implementation
export { OrchestratorLangGraphRepositoryLive } from "./repositories/orchestrator.langgraph.repository";
// Orchestrator nodes and helpers
export {
	calculateCostFromTokens,
	DAILY_COST_LIMIT,
	getNextDayMidnightUTC,
	getSteeringHint,
	getSteeringTarget,
	MESSAGE_COST_ESTIMATE,
	routerNode,
	shouldTriggerBatch,
} from "./repositories/orchestrator.nodes";
export {
	type OrchestratorInput,
	type OrchestratorOutput,
	type OrchestratorState,
	OrchestratorStateAnnotation,
	type SerializableGraphError,
} from "./repositories/orchestrator.state";
// Orchestrator graph repository implementation
export { OrchestratorGraphLangGraphRepositoryLive } from "./repositories/orchestrator-graph.langgraph.repository";
// Payment gateway repository implementation (Story 13.2)
export { PaymentGatewayPolarRepositoryLive } from "./repositories/payment-gateway.polar.repository";
// Portrait repository implementation (Story 13.3)
export { PortraitDrizzleRepositoryLive } from "./repositories/portrait.drizzle.repository";
// Portrait generator repository implementations
export { PortraitGeneratorClaudeRepositoryLive } from "./repositories/portrait-generator.claude.repository";
export { PortraitGeneratorMockRepositoryLive } from "./repositories/portrait-generator.mock.repository";
// Profile access log repository implementation (Story 15.1)
export { ProfileAccessLogDrizzleRepositoryLive } from "./repositories/profile-access-log.drizzle.repository";
// Public profile repository implementation
export { PublicProfileDrizzleRepositoryLive } from "./repositories/public-profile.drizzle.repository";
// Purchase event repository implementation (Story 13.1)
export { PurchaseEventDrizzleRepositoryLive } from "./repositories/purchase-event.drizzle.repository";
// Redis repository implementation
export { RedisIoRedisRepositoryLive } from "./repositories/redis.ioredis.repository";
// Teaser portrait repository implementations (Story 11.5)
export { TeaserPortraitAnthropicRepositoryLive } from "./repositories/teaser-portrait.anthropic.repository";
export { TeaserPortraitMockRepositoryLive } from "./repositories/teaser-portrait.mock.repository";
