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
 *
 * IMPLEMENTATION NOTE:
 * Using drizzle-orm/node-postgres with @effect/sql-pg since drizzle-orm/effect-postgres
 * is only available in beta versions. We access the underlying pg.Pool from PgClient.
 */

import { Context, Layer, Effect, Redacted } from "effect";
import { drizzle } from "drizzle-orm/node-postgres";
import { PgClient } from "@effect/sql-pg";
import { SqlClient, SqlError } from "@effect/sql";
import { types } from "pg";
import * as authSchema from "../auth-schema.js";

/**
 * PostgreSQL Client Layer
 *
 * Manages connection pool with Effect-based lifecycle.
 * Preserves PostgreSQL date/time types as strings (not parsed to Date).
 */
export const PgClientLive: Layer.Layer<PgClient.PgClient | SqlClient.SqlClient, SqlError.SqlError, never> = PgClient.layer({
  url: Redacted.make(
    process.env.DATABASE_URL ||
      "postgresql://dev:devpassword@localhost:5432/bigocean"
  ),
  types: {
    // Preserve PostgreSQL date/time types as strings
    getTypeParser: (typeId: number, format: any) => {
      // Type IDs for: timestamptz, timestamp, date, interval, etc.
      if (
        [1184, 1114, 1082, 1186, 1231, 1115, 1185, 1187, 1182].includes(typeId)
      ) {
        return (val: any) => val;
      }
      return types.getTypeParser(typeId, format);
    },
  },
});

/**
 * Database Service Tag
 *
 * CRITICAL: Service interface has NO requirements parameter.
 * Dependencies managed during layer construction, not at service level.
 *
 * Using Context.Tag for proper Effect dependency injection.
 */
export class Database extends Context.Tag("Database")<
  Database,
  ReturnType<typeof drizzle>
>() {}

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
    // Dependency: PgClient resolved during layer construction
    const sqlClient = yield* PgClient.PgClient;

    // Access the underlying pg.Pool from @effect/sql-pg
    // @ts-expect-error - Accessing internal pool property
    const pool = sqlClient.pool;

    // Create Drizzle instance with node-postgres driver using the Effect-managed pool
    const db = drizzle(pool, {
      schema: authSchema,
      logger: process.env.NODE_ENV === "development",
    });

    return db;
  })
);

/**
 * Complete Database Stack
 *
 * Merges PgClient and Database layers.
 * Usage: Layer.provide(DatabaseStack, program)
 */
export const DatabaseStack: Layer.Layer<Database, SqlError.SqlError, never> = DatabaseLive.pipe(Layer.provide(PgClientLive));
