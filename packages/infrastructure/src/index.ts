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
export {
  LoggerService,
  LoggerServiceLive,
  getLogger,
  type Logger,
} from "./context/logger-service.js";

// Cost Guard Service (Context.Tag pattern)
export {
  CostGuardService,
  type CostGuardShape,
  CostGuardServiceLive,
} from "./context/cost-guard.js";

// Schema exports (used by applications)
export {
  user,
  session,
  account,
  verification,
  relations,
} from "./auth-schema.js";
