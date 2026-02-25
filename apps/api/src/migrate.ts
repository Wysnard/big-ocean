/**
 * Programmatic Drizzle Migration Runner
 *
 * Runs all pending migrations from the drizzle/ folder against the database.
 * Used by the production Docker entrypoint before starting the API server.
 *
 * Uses drizzle-orm/node-postgres/migrator (already a production dependency)
 * instead of drizzle-kit (dev-only CLI tool).
 */

import "dotenv/config";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
	console.error("DATABASE_URL is required for migrations");
	process.exit(1);
}

/**
 * Resolve the drizzle migrations folder.
 *
 * Production Docker: /app/drizzle (COPY'd by Dockerfile)
 * Development:       <repo-root>/drizzle (run from apps/api/)
 */
function resolveMigrationsFolder(): string {
	const candidates = [
		resolve(import.meta.dirname, "../drizzle"), // production: /app/src/../drizzle = /app/drizzle
		resolve(import.meta.dirname, "../../../drizzle"), // dev: apps/api/src/../../../drizzle = <repo>/drizzle
	];

	for (const candidate of candidates) {
		if (existsSync(candidate)) {
			return candidate;
		}
	}

	console.error("Could not find drizzle migrations folder. Searched:", candidates);
	process.exit(1);
}

const migrationsFolder = resolveMigrationsFolder();
const pool = new pg.Pool({ connectionString: DATABASE_URL });
const db = drizzle({ client: pool });

try {
	console.log(`Running migrations from ${migrationsFolder}...`);
	await migrate(db, { migrationsFolder });
	console.log("Migrations complete");
} catch (error) {
	console.error("Migration failed:", error);
	process.exit(1);
} finally {
	await pool.end();
}
