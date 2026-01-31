/**
 * Application Setup
 *
 * Initializes database, Better Auth, and other services.
 * Provides them via FiberRefs for dependency injection.
 */

import {
  createDatabaseConnection,
  createAuth,
  type Auth,
} from "@workspace/infrastructure";
import logger from "./logger.js";

/**
 * Initialize database connection
 */
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  logger.warn("DATABASE_URL not set, using default from .env.example");
}

const { db } = createDatabaseConnection(
  databaseUrl || "postgresql://dev:devpassword@localhost:5432/bigocean"
);

/**
 * Initialize Better Auth
 */
const betterAuthSecret = process.env.BETTER_AUTH_SECRET;
const betterAuthUrl = process.env.BETTER_AUTH_URL;

if (!betterAuthSecret) {
  logger.warn("BETTER_AUTH_SECRET not set, using placeholder");
}

if (!betterAuthUrl) {
  logger.warn("BETTER_AUTH_URL not set, using default");
}

const auth = createAuth(db, {
  secret: betterAuthSecret || "placeholder-secret-for-development-only",
  baseURL: betterAuthUrl || "http://localhost:4000",
  trustedOrigins: [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:4000",
    process.env.FRONTEND_URL,
  ].filter(Boolean) as string[],
});

logger.info("Database and Better Auth initialized");

/**
 * Export instances for direct use if needed
 */
export { db, auth };
export type { Auth };
