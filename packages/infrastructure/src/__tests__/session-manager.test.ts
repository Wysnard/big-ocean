/**
 * SessionManager Service Tests
 *
 * Following Story 2-0.5 pattern: Test service wiring, NOT library behavior
 *
 * Focus:
 * - Service tag existence
 * - Layer construction succeeds
 * - Method availability
 * - Correct parameters passed to dependencies
 */

import { describe, it, expect } from "vitest"
import { Layer, Effect } from "effect"
import { drizzle, type EffectPgDatabase } from "drizzle-orm/effect-postgres"
import type { EmptyRelations } from "drizzle-orm"
import { SessionManager, SessionManagerLive } from "../context/session-manager.js"
import { Database } from "../context/database.js"
import * as authSchema from "../auth-schema.js"

/**
 * Test Database Service
 *
 * Provides mock database for testing SessionManager service wiring.
 */
const createTestDatabase = (): EffectPgDatabase<typeof authSchema, EmptyRelations> => {
  // Create mock database with schema
  const mockDb = drizzle.mock({ schema: authSchema })

  // Create mock client with unsafe method
  const mockClient = {
    unsafe: (_sql: string, ..._params: any[]) =>
      Effect.succeed({ rows: [], fields: [] }),
    session: {},
  }

  // Override $client with our mock that has unsafe() method
  // @ts-expect-error - Mock client doesn't implement full PgClient interface
  mockDb.$client = mockClient

  return mockDb as EffectPgDatabase<typeof authSchema, EmptyRelations>
}

/**
 * Test Database Layer
 */
const DatabaseTest = Layer.succeed(Database, createTestDatabase() as any)

describe("SessionManager Service", () => {
  describe("Service Layer Composition", () => {
    it("should define SessionManager service tag", () => {
      expect(SessionManager).toBeDefined()
    })

    it("should construct with mock database", async () => {
      const test = Effect.gen(function* () {
        const sessionMgr = yield* SessionManager
        expect(sessionMgr).toBeDefined()
        expect(sessionMgr.createSession).toBeDefined()
        expect(sessionMgr.saveMessage).toBeDefined()
        expect(sessionMgr.getSession).toBeDefined()
        expect(sessionMgr.updatePrecision).toBeDefined()
      })

      const testLayer = SessionManagerLive.pipe(Layer.provide(DatabaseTest))

      await Effect.runPromise(test.pipe(Effect.provide(testLayer)))
    })
  })

  describe("Service Method Availability", () => {
    it("should expose createSession method", async () => {
      const test = Effect.gen(function* () {
        const sessionMgr = yield* SessionManager
        expect(typeof sessionMgr.createSession).toBe("function")
      })

      const testLayer = SessionManagerLive.pipe(Layer.provide(DatabaseTest))

      await Effect.runPromise(test.pipe(Effect.provide(testLayer)))
    })

    it("should expose saveMessage method", async () => {
      const test = Effect.gen(function* () {
        const sessionMgr = yield* SessionManager
        expect(typeof sessionMgr.saveMessage).toBe("function")
      })

      const testLayer = SessionManagerLive.pipe(Layer.provide(DatabaseTest))

      await Effect.runPromise(test.pipe(Effect.provide(testLayer)))
    })

    it("should expose getSession method", async () => {
      const test = Effect.gen(function* () {
        const sessionMgr = yield* SessionManager
        expect(typeof sessionMgr.getSession).toBe("function")
      })

      const testLayer = SessionManagerLive.pipe(Layer.provide(DatabaseTest))

      await Effect.runPromise(test.pipe(Effect.provide(testLayer)))
    })

    it("should expose updatePrecision method", async () => {
      const test = Effect.gen(function* () {
        const sessionMgr = yield* SessionManager
        expect(typeof sessionMgr.updatePrecision).toBe("function")
      })

      const testLayer = SessionManagerLive.pipe(Layer.provide(DatabaseTest))

      await Effect.runPromise(test.pipe(Effect.provide(testLayer)))
    })
  })

  describe("Service Method Execution", () => {
    it("should create session and return sessionId", async () => {
      const test = Effect.gen(function* () {
        const sessionMgr = yield* SessionManager
        const result = yield* sessionMgr.createSession("test-user-id")

        expect(result).toHaveProperty("sessionId")
        expect(typeof result.sessionId).toBe("string")
      })

      const testLayer = SessionManagerLive.pipe(Layer.provide(DatabaseTest))

      await Effect.runPromise(test.pipe(Effect.provide(testLayer)))
    })

    it("should save message for a session", async () => {
      const test = Effect.gen(function* () {
        const sessionMgr = yield* SessionManager

        // Should not throw
        yield* sessionMgr.saveMessage(
          "test-session-id",
          "user",
          "Hello, tell me about myself"
        )
      })

      const testLayer = SessionManagerLive.pipe(Layer.provide(DatabaseTest))

      await Effect.runPromise(test.pipe(Effect.provide(testLayer)))
    })

    it("should retrieve session with messages", async () => {
      const test = Effect.gen(function* () {
        const sessionMgr = yield* SessionManager
        const result = yield* sessionMgr.getSession("test-session-id")

        expect(result).toHaveProperty("session")
        expect(result).toHaveProperty("messages")
        expect(Array.isArray(result.messages)).toBe(true)
      })

      const testLayer = SessionManagerLive.pipe(Layer.provide(DatabaseTest))

      await Effect.runPromise(test.pipe(Effect.provide(testLayer)))
    })

    it("should update precision for a session", async () => {
      const test = Effect.gen(function* () {
        const sessionMgr = yield* SessionManager

        // Should not throw
        yield* sessionMgr.updatePrecision("test-session-id", {
          openness: 0.7,
          conscientiousness: 0.6,
          extraversion: 0.8,
          agreeableness: 0.5,
          neuroticism: 0.3,
        })
      })

      const testLayer = SessionManagerLive.pipe(Layer.provide(DatabaseTest))

      await Effect.runPromise(test.pipe(Effect.provide(testLayer)))
    })
  })
})
