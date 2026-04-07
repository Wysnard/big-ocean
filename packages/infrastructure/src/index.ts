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
// Assessment result repository implementation (Story 11.2)
export { AssessmentResultDrizzleRepositoryLive } from "./repositories/assessment-result.drizzle.repository";
// Conversanalyzer repository implementations (Story 10.2)
export { ConversanalyzerAnthropicRepositoryLive } from "./repositories/conversanalyzer.anthropic.repository";
export { ConversanalyzerMockRepositoryLive } from "./repositories/conversanalyzer.mock.repository";
// Session repository implementation
export { ConversationDrizzleRepositoryLive } from "./repositories/conversation.drizzle.repository";
// Conversation evidence repository implementation (Story 10.1)
export { ConversationEvidenceDrizzleRepositoryLive } from "./repositories/conversation-evidence.drizzle.repository";
// CostGuard repository implementation
export { CostGuardRedisRepositoryLive } from "./repositories/cost-guard.redis.repository";
// Assessment exchange repository implementation (Story 23-3)
export { ExchangeDrizzleRepositoryLive } from "./repositories/exchange.drizzle.repository";
// Facet evidence repository — queries conversation_evidence, maps to SavedFacetEvidence contract
export { FacetEvidenceDrizzleRepositoryLive } from "./repositories/facet-evidence.drizzle.repository";
// Logger repository implementation
export { LoggerPinoRepositoryLive } from "./repositories/logger.pino.repository";
// Message repository implementation
export { MessageDrizzleRepositoryLive } from "./repositories/message.drizzle.repository";
// Nerin Actor repository implementations (Story 43-4, ADR-DM-3)
export { NerinActorAnthropicRepositoryLive } from "./repositories/nerin-actor.anthropic.repository";
export { NerinActorMockRepositoryLive } from "./repositories/nerin-actor.mock.repository";
// Nerin agent repository implementations — backward compat (removed in Story 43-5)
export { NerinAgentAnthropicRepositoryLive } from "./repositories/nerin-agent.anthropic.repository";
export { NerinAgentMockRepositoryLive } from "./repositories/nerin-agent.mock.repository";
// Nerin Director repository implementations (Story 43-3, ADR-DM-1)
export { NerinDirectorAnthropicRepositoryLive } from "./repositories/nerin-director.anthropic.repository";
export { NerinDirectorMockRepositoryLive } from "./repositories/nerin-director.mock.repository";
// Portrait repository implementation (Story 13.3)
export { PortraitDrizzleRepositoryLive } from "./repositories/portrait.drizzle.repository";
// Portrait generator repository implementations
export { PortraitGeneratorClaudeRepositoryLive } from "./repositories/portrait-generator.claude.repository";
export { PortraitGeneratorMockRepositoryLive } from "./repositories/portrait-generator.mock.repository";
// Portrait rating repository implementation (Story 19-2)
export { PortraitRatingDrizzleRepositoryLive } from "./repositories/portrait-rating.drizzle.repository";
// Profile access log repository implementation (Story 15.1)
export { ProfileAccessLogDrizzleRepositoryLive } from "./repositories/profile-access-log.drizzle.repository";
// Public profile repository implementation
export { PublicProfileDrizzleRepositoryLive } from "./repositories/public-profile.drizzle.repository";
// Purchase event repository implementation (Story 13.1)
export { PurchaseEventDrizzleRepositoryLive } from "./repositories/purchase-event.drizzle.repository";
// QR token repository implementation (Story 34-1)
export { QrTokenDrizzleRepositoryLive } from "./repositories/qr-token.drizzle.repository";
// Redis repository implementation
export { RedisIoRedisRepositoryLive } from "./repositories/redis.ioredis.repository";
// Relationship analysis repositories (Story 14.4)
export { RelationshipAnalysisDrizzleRepositoryLive } from "./repositories/relationship-analysis.drizzle.repository";
export { RelationshipAnalysisGeneratorAnthropicRepositoryLive } from "./repositories/relationship-analysis-generator.anthropic.repository";
export { RelationshipAnalysisGeneratorMockRepositoryLive } from "./repositories/relationship-analysis-generator.mock.repository";
export { ResendEmailMockRepositoryLive } from "./repositories/resend-email.mock.repository";
// Resend email repository implementations (Story 31-7)
export { ResendEmailResendRepositoryLive } from "./repositories/resend-email.resend.repository";
// User account repository implementation (Story 30-2)
export { UserAccountDrizzleRepositoryLive } from "./repositories/user-account.drizzle.repository";
// Waitlist repository implementation (Story 15.3)
export { WaitlistDrizzleRepositoryLive } from "./repositories/waitlist.drizzle.repository";
