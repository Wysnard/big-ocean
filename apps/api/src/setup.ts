/**
 * Application Setup
 *
 * Initializes database connection using postgres-js.
 * TODO: Migrate to Effect-based Database service in Story 2.1
 */

import { drizzle } from "drizzle-orm/postgres-js";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { dbSchema as authSchema } from "@workspace/infrastructure";

/**
 * Initialize database connection
 */
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.warn("DATABASE_URL not set, using default from .env.example");
}

const db: PostgresJsDatabase<typeof authSchema> = drizzle(
  databaseUrl || "postgresql://dev:devpassword@localhost:5432/bigocean",
  { schema: authSchema },
);

console.info("Database initialized");

/**
 * Export database for use throughout the application
 */
export { db };
export type Database = typeof db;
