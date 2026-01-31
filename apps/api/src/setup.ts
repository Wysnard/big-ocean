/**
 * Application Setup
 *
 * Initializes database, Better Auth, and other services.
 * Provides them via FiberRefs for dependency injection.
 */

import { createDatabaseConnection } from "@workspace/infrastructure";
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

logger.info("Database initialized");

/**
 * Export database and logger for use throughout the application
 */
export { db, logger };
