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
export * as dbSchema from "./db/schema";
// Analyzer repository implementation
export { AnalyzerClaudeRepositoryLive } from "./repositories/analyzer.claude.repository";

// Message repository implementation
export { AssessmentMessageDrizzleRepositoryLive } from "./repositories/assessment-message.drizzle.repository";
// Session repository implementation
export { AssessmentSessionDrizzleRepositoryLive } from "./repositories/assessment-session.drizzle.repository";
// CostGuard repository implementation
export {
	CostGuardRedisRepositoryLive,
	CostGuardTestRepositoryLive,
	createTestCostGuardRepository,
} from "./repositories/cost-guard.redis.repository";
// Logger repository implementation
export { LoggerPinoRepositoryLive } from "./repositories/logger.pino.repository";
// Nerin agent repository implementation
export { NerinAgentLangGraphRepositoryLive } from "./repositories/nerin-agent.langgraph.repository";
// Redis repository implementation
export {
	createTestRedisRepository,
	RedisIoRedisRepositoryLive,
	RedisTestRepositoryLive,
} from "./repositories/redis.ioredis.repository";
// Scorer repository implementation
export { ScorerDrizzleRepositoryLive } from "./repositories/scorer.drizzle.repository";
