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
// Conversanalyzer repository implementation (Story 10.2)
export { ConversanalyzerAnthropicRepositoryLive } from "./repositories/conversanalyzer.anthropic.repository";
// Conversation evidence repository implementation (Story 10.1)
export { ConversationEvidenceDrizzleRepositoryLive } from "./repositories/conversation-evidence.drizzle.repository";
// CostGuard repository implementation
export { CostGuardRedisRepositoryLive } from "./repositories/cost-guard.redis.repository";
// Facet evidence repository — queries finalization_evidence, maps to SavedFacetEvidence contract
export { FacetEvidenceDrizzleRepositoryLive } from "./repositories/facet-evidence.drizzle.repository";
// Facet evidence no-op repository (Story 9.1 — stub for orchestrator compat, write path only)
export { FacetEvidenceNoopRepositoryLive } from "./repositories/facet-evidence.noop.repository";
// Finalization evidence repository implementation (Story 11.2)
export { FinalizationEvidenceDrizzleRepositoryLive } from "./repositories/finalization-evidence.drizzle.repository";
// FinAnalyzer repository implementation (Story 11.2)
export { FinanalyzerAnthropicRepositoryLive } from "./repositories/finanalyzer.anthropic.repository";
export { FinanalyzerMockRepositoryLive } from "./repositories/finanalyzer.mock.repository";
// Logger repository implementation
export { LoggerPinoRepositoryLive } from "./repositories/logger.pino.repository";
// Nerin agent repository implementations (direct ChatAnthropic invocation)
export { NerinAgentAnthropicRepositoryLive } from "./repositories/nerin-agent.anthropic.repository";
export { NerinAgentMockRepositoryLive } from "./repositories/nerin-agent.mock.repository";
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
// Relationship analysis repositories (Story 14.4)
export { RelationshipAnalysisDrizzleRepositoryLive } from "./repositories/relationship-analysis.drizzle.repository";
export { RelationshipAnalysisGeneratorAnthropicRepositoryLive } from "./repositories/relationship-analysis-generator.anthropic.repository";
export { RelationshipAnalysisGeneratorMockRepositoryLive } from "./repositories/relationship-analysis-generator.mock.repository";
// Relationship invitation repository implementation (Story 14.2)
export { RelationshipInvitationDrizzleRepositoryLive } from "./repositories/relationship-invitation.drizzle.repository";
// Teaser portrait repository implementations (Story 11.5)
export { TeaserPortraitAnthropicRepositoryLive } from "./repositories/teaser-portrait.anthropic.repository";
export { TeaserPortraitMockRepositoryLive } from "./repositories/teaser-portrait.mock.repository";
// Waitlist repository implementation (Story 15.3)
export { WaitlistDrizzleRepositoryLive } from "./repositories/waitlist.drizzle.repository";
