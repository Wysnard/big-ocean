/**
 * Programmatic Drizzle Migration Runner
 *
 * Runs all pending migrations from the drizzle/ folder against the database.
 * Used by the production Docker entrypoint before starting the API server.
 *
 * Custom runner that executes each migration in its own transaction.
 * This is required because PostgreSQL's ALTER TYPE ADD VALUE creates enum
 * values that cannot be used until the transaction commits (error 55P04).
 * Drizzle's built-in migrate() wraps ALL migrations in a single transaction,
 * which breaks when a later migration references a newly-added enum value.
 */

import "dotenv/config";
import crypto from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
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

interface LocalMigration {
	name: string;
	sql: string[];
	hash: string;
	folderMillis: number;
}

function readMigrations(folder: string): LocalMigration[] {
	const migrations = readdirSync(folder)
		.map((subdir) => ({ path: join(folder, subdir, "migration.sql"), name: subdir }))
		.filter((it) => existsSync(it.path));

	migrations.sort((a, b) => a.name.localeCompare(b.name));

	return migrations.map(({ path, name }) => {
		const query = readFileSync(path, "utf-8");
		const dateStr = name.slice(0, 14);
		const folderMillis = Number.parseInt(
			`${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}T${dateStr.slice(8, 10)}:${dateStr.slice(10, 12)}:${dateStr.slice(12, 14)}Z`,
			10,
		)
			? new Date(
					`${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}T${dateStr.slice(8, 10)}:${dateStr.slice(10, 12)}:${dateStr.slice(12, 14)}Z`,
				).getTime()
			: Date.now();
		return {
			name,
			sql: query.split("--> statement-breakpoint"),
			hash: crypto.createHash("sha256").update(query).digest("hex"),
			folderMillis,
		};
	});
}

const migrationsFolder = resolveMigrationsFolder();
const pool = new pg.Pool({ connectionString: DATABASE_URL });

try {
	console.log(`Running migrations from ${migrationsFolder}...`);

	const client = await pool.connect();
	try {
		// Ensure migrations tracking schema and table exist (matches Drizzle's schema)
		await client.query(`CREATE SCHEMA IF NOT EXISTS "drizzle"`);
		await client.query(`
			CREATE TABLE IF NOT EXISTS "drizzle"."__drizzle_migrations" (
				id SERIAL PRIMARY KEY,
				hash text NOT NULL,
				created_at bigint
			)
		`);

		// Get already-applied migrations
		const { rows: applied } = await client.query<{ hash: string }>(
			`SELECT hash FROM "drizzle"."__drizzle_migrations"`,
		);
		const appliedHashes = new Set(applied.map((r) => r.hash));

		const allMigrations = readMigrations(migrationsFolder);
		const pending = allMigrations.filter((m) => !appliedHashes.has(m.hash));

		if (pending.length === 0) {
			console.log("No pending migrations");
		} else {
			console.log(`${pending.length} migration(s) to run`);

			for (const migration of pending) {
				console.log(`  Running: ${migration.name}`);
				await client.query("BEGIN");
				try {
					for (const stmt of migration.sql) {
						if (stmt.trim()) await client.query(stmt);
					}
					await client.query(
						`INSERT INTO "drizzle"."__drizzle_migrations" (hash, created_at) VALUES ($1, $2)`,
						[migration.hash, migration.folderMillis],
					);
					await client.query("COMMIT");
				} catch (error) {
					await client.query("ROLLBACK");
					throw error;
				}
			}
		}
	} finally {
		client.release();
	}

	console.log("Migrations complete");
} catch (error) {
	console.error("Migration failed:", error);
	process.exit(1);
} finally {
	await pool.end();
}
