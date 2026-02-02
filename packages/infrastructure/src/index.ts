/**
 * Infrastructure Package Exports
 *
 * Provides repository implementations, database context, and database schema.
 */

// Configuration
export {
  AppConfig,
  AppConfigLive,
  loadConfig,
  type AppConfigService,
  createTestAppConfig,
  AppConfigTestLive,
  defaultTestConfig,
} from "./config/index.js";

// Database context
export { Database, DatabaseStack } from "./context/database.js";

// Better Auth context
export { BetterAuthService, BetterAuthLive } from "./context/better-auth.js";

// Logger repository implementation
export { LoggerPinoRepositoryLive } from "./repositories/logger.pino.repository.js";

// Session repository implementation
export { AssessmentSessionDrizzleRepositoryLive } from "./repositories/assessment-session.drizzle.repository.js";

// Message repository implementation
export { AssessmentMessageDrizzleRepositoryLive } from "./repositories/assessment-message.drizzle.repository.js";

// Nerin agent repository implementation
export { NerinAgentLangGraphRepositoryLive } from "./repositories/nerin-agent.langgraph.repository.js";

// Analyzer repository implementation
export { AnalyzerClaudeRepositoryLive } from "./repositories/analyzer.claude.repository.js";

// Scorer repository implementation
export { ScorerDrizzleRepositoryLive } from "./repositories/scorer.drizzle.repository.js";

// Redis repository implementation
export {
  RedisIoRedisRepositoryLive,
  createTestRedisRepository,
  RedisTestRepositoryLive,
} from "./repositories/redis.ioredis.repository.js";

// CostGuard repository implementation
export {
  CostGuardRedisRepositoryLive,
  createTestCostGuardRepository,
  CostGuardTestRepositoryLive,
} from "./repositories/cost-guard.redis.repository.js";

// Database schema (for Better Auth adapter and migrations)
export * as dbSchema from "./db/schema.js";
