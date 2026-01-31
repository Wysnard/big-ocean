/**
 * Database Connection
 *
 * PostgreSQL connection using postgres.js with Drizzle ORM.
 */

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as authSchema from "./auth-schema.js";

/**
 * Create PostgreSQL connection
 */
export function createDatabaseConnection(connectionString: string) {
  const client = postgres(connectionString);
  const db = drizzle(client, { schema: authSchema });

  return { client, db };
}

/**
 * Type for database instance
 */
export type Database = ReturnType<typeof createDatabaseConnection>["db"];

// Export schema
export { authSchema };
