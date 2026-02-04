/**
 * Database Service with Effect + Drizzle
 *
 * Official patterns:
 * - Effect Services: https://effect.website/docs/requirements-management/services/
 * - Effect Layers: https://effect.website/docs/requirements-management/layers/#database
 * - Drizzle Effect Postgres: https://orm.drizzle.team/docs/connect-effect-postgres
 *
 * Key principle: "Layers act as constructors for creating services,
 * allowing us to manage dependencies during construction rather than at the service level."
 */

import { PgClient } from "@effect/sql-pg";
import { AppConfig } from "@workspace/domain";
import { drizzle } from "drizzle-orm/effect-postgres";
import { Context, Effect, Layer, Redacted } from "effect";
import { types } from "pg";
import * as authSchema from "../db/drizzle/schema";

/**
 * PostgreSQL Client Layer
 *
 * Manages connection pool with Effect-based lifecycle.
 * Preserves PostgreSQL date/time types as strings (not parsed to Date).
 *
 * Requires AppConfig to be provided for DATABASE_URL.
 */
/**
 * Create PgClient Layer dynamically using AppConfig
 *
 * Uses Layer.unwrapEffect to inject AppConfig and create PgClient.layer
 * PgClient.layer handles Scope and Reactivity internally.
 */
export const PgClientLive = Layer.unwrapEffect(
	Effect.gen(function* () {
		const config = yield* AppConfig;

		// Return a layer that creates PgClient with injected config
		return PgClient.layer({
			url: Redacted.make(config.databaseUrl),
			types: {
				// Preserve PostgreSQL date/time types as strings
				// biome-ignore lint/suspicious/noExplicitAny: pg library doesn't export TypeParser types
				getTypeParser: (typeId: number, format: any) => {
					// Type IDs for: timestamptz, timestamp, date, interval, etc.
					if ([1184, 1114, 1082, 1186, 1231, 1115, 1185, 1187, 1182].includes(typeId)) {
						// biome-ignore lint/suspicious/noExplicitAny: pg type parser callback
						return (val: any) => val;
					}
					return types.getTypeParser(typeId, format);
				},
			},
		});
	}),
);

/**
 * Database Service Tag
 *
 * CRITICAL: Service interface has NO requirements parameter.
 * Dependencies managed during layer construction, not at service level.
 *
 * Using Context.Tag for proper Effect dependency injection.
 */
export class Database extends Context.Tag("Database")<Database, ReturnType<typeof drizzle>>() {}

/**
 * Extract service shape using Context.Tag.Service utility
 */
export type DatabaseShape = Context.Tag.Service<Database>;

/**
 * Database Layer
 *
 * Layer type: Layer<Database, never, PgClient>
 * Notice: Service has no requirements, only layer has dependencies.
 *
 * "Layers act as constructors" - dependencies resolved during construction.
 */
export const DatabaseLive = Layer.effect(
	Database,
	Effect.gen(function* () {
		const config = yield* AppConfig;
		// Dependency: PgClient resolved during layer construction
		const client = yield* PgClient.PgClient;

		// Create Drizzle instance with Effect Postgres driver
		const db = drizzle(client, {
			schema: authSchema,
			logger: config.nodeEnv === "development",
		});

		return db;
	}),
);

/**
 * Complete Database Stack
 *
 * Merges PgClient and Database layers.
 * Requires AppConfig to be provided.
 *
 * Usage: Layer.provide(DatabaseStack, AppConfigLive)
 */
export const DatabaseStack = DatabaseLive.pipe(Layer.provide(PgClientLive));
