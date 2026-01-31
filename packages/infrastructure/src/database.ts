/**
 * Database Connection
 *
 * PostgreSQL connection using postgres.js with Drizzle ORM.
 * NOTE: This is legacy code. New code should use the Effect-based
 * Database service from ./context/database.js
 */

import { drizzle } from "drizzle-orm/postgres-js";
import * as authSchema from "./auth-schema.js";

/**
 * Create PostgreSQL connection (Drizzle v1 syntax)
 */
export function createDatabaseConnection(connectionString: string) {
  // Drizzle v1: drizzle() now takes connection string and config
  const db = drizzle(connectionString, { schema: authSchema });

  return { db };
}

/**
 * Type for database instance
 */
export type Database = ReturnType<typeof createDatabaseConnection>["db"];

// Export schema
export { authSchema };
