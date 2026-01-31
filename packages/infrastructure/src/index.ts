/**
 * Infrastructure Layer
 *
 * Exports Effect Services for dependency injection.
 * Uses official Effect Services + Layers pattern.
 */

// Effect Services (NEW - Context.Tag pattern)
export {
  Database,
  type DatabaseShape,
  DatabaseLive,
  DatabaseStack,
  PgClientLive,
} from "./context/database.js";
export {
  BetterAuthService,
  type BetterAuthShape,
  BetterAuthLive,
} from "./context/better-auth.js";

// Context bridges (Legacy FiberRef pattern - being phased out)
export * from "./context/logger.js";
export * from "./context/cost-guard.js";
export * from "./context/auth.js";

// Legacy exports (being phased out)
export { createDatabaseConnection, authSchema } from "./database.js";
export type { Database as LegacyDatabase } from "./database.js";
export * from "./auth-config.js";
export * from "./auth-schema.js";
