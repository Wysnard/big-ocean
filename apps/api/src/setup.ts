/**
 * Application Setup
 *
 * Initializes database connection.
 */

import { createDatabaseConnection } from "@workspace/infrastructure";

/**
 * Initialize database connection
 */
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.warn("DATABASE_URL not set, using default from .env.example");
}

const { db } = createDatabaseConnection(
  databaseUrl || "postgresql://dev:devpassword@localhost:5432/bigocean"
);

console.info("Database initialized");

/**
 * Export database for use throughout the application
 */
export { db };
