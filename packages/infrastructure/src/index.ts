/**
 * Infrastructure Package Exports
 *
 * Provides repository implementations, database context, and database schema.
 */

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

// Database schema (for Better Auth adapter and migrations)
export * as dbSchema from "./infrastructure/db/schema.js";
