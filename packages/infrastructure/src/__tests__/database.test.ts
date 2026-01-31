/**
 * Database Service Layer Tests
 *
 * Tests Effect-based Database service with test implementation (not live DB).
 */

import { describe, it, expect } from "vitest";
import { Effect, Layer } from "effect";
import { drizzle, type EffectPgDatabase } from "drizzle-orm/effect-postgres";
import type { EmptyRelations } from "drizzle-orm";
import type { PgClient } from "@effect/sql-pg";
import { Database } from "../context/database.js";
import * as authSchema from "../auth-schema.js";

/**
 * Test Database Service
 *
 * Enhances drizzle.mock() with Effect Postgres client implementation.
 * Provides minimal unsafe() method that Drizzle Effect Postgres requires.
 */
const createTestDatabase = (): EffectPgDatabase<typeof authSchema, EmptyRelations> => {
  // Create mock database with schema
  const mockDb = drizzle.mock({ schema: authSchema });

  // Create mock client with unsafe method and empty session
  const mockClient = {
    unsafe: (_sql: string, ..._params: any[]) =>
      Effect.succeed({ rows: [], fields: [] }),
    session: {}, // Add empty session if needed by client
  };

  // Override $client with our mock that has unsafe() method
  // @ts-expect-error - Mock client doesn't implement full PgClient interface
  mockDb.$client = mockClient;

  return mockDb as EffectPgDatabase<typeof authSchema, EmptyRelations>;
};

/**
 * Test Database Layer
 *
 * Provides test database implementation without requiring PgClient.
 */
export const DatabaseTest = Layer.succeed(Database, createTestDatabase() as any);

describe("Database Service", () => {
  it("should create Database service tag", () => {
    expect(Database).toBeDefined();
    expect(Database.key).toBe("Database");
  });

  it("should resolve Database service from test layer", async () => {
    const program = Effect.gen(function* () {
      const db = yield* Database;
      expect(db).toBeDefined();
      expect(db.query).toBeDefined();
      expect(db.insert).toBeDefined();
      return db;
    });

    const result = await Effect.runPromise(
      program.pipe(Effect.provide(DatabaseTest))
    );

    expect(result.query).toBeDefined();
  });

  it("should provide database instance with query builders", async () => {
    const program = Effect.gen(function* () {
      const db = yield* Database;

      // Verify database has expected query methods (not executing them)
      expect(db.select).toBeDefined();
      expect(db.insert).toBeDefined();
      expect(db.update).toBeDefined();
      expect(db.delete).toBeDefined();
      expect(db.query).toBeDefined();

      return true;
    });

    const result = await Effect.runPromise(
      program.pipe(Effect.provide(DatabaseTest))
    );

    expect(result).toBe(true);
  });

  it("should be injectable via Layer.succeed for custom test scenarios", async () => {
    const program = Effect.gen(function* () {
      const db = yield* Database;

      // Verify database has expected methods
      expect(db.select).toBeDefined();
      expect(db.insert).toBeDefined();
      expect(db.update).toBeDefined();
      expect(db.delete).toBeDefined();

      return true;
    });

    const result = await Effect.runPromise(
      program.pipe(Effect.provide(DatabaseTest))
    );

    expect(result).toBe(true);
  });

  it("should have proper EffectPgDatabase type", () => {
    const testDb = createTestDatabase();

    // Type check - EffectPgDatabase<typeof authSchema, EmptyRelations>
    const _typed: EffectPgDatabase<typeof authSchema, EmptyRelations> = testDb;
    expect(_typed).toBeDefined();
  });
});
