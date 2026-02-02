/**
 * Test Layer Utilities
 *
 * Centralizes test Layer composition for Effect-based testing.
 * Uses @effect/vitest patterns for clean, maintainable tests.
 *
 * @see https://github.com/Effect-TS/effect/tree/main/packages/vitest
 * @see https://www.effect.solutions/testing
 */

import { Effect, Layer } from "effect"
import {
  AssessmentSessionRepository,
  AssessmentMessageRepository,
  LoggerRepository,
  CostGuardRepository,
  RedisRepository,
  NerinAgentRepository,
} from "@workspace/domain"

/**
 * Creates a test Layer for AssessmentSessionRepository.
 *
 * Provides an in-memory implementation for testing without database.
 *
 * @example
 * ```typescript
 * it.effect('should create session', () =>
 *   Effect.gen(function* () {
 *     const sessionRepo = yield* AssessmentSessionRepository
 *     const session = yield* sessionRepo.createSession("user123")
 *     expect(session.sessionId).toBeDefined()
 *   }).pipe(Effect.provide(createTestAssessmentSessionLayer()))
 * )
 * ```
 */
export const createTestAssessmentSessionLayer = () => {
  const sessions = new Map<string, any>()

  return Layer.succeed(AssessmentSessionRepository, {
    createSession: (userId?: string) =>
      Effect.sync(() => {
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`
        const session = {
          sessionId,
          userId,
          createdAt: new Date(),
          precision: {
            openness: 50,
            conscientiousness: 50,
            extraversion: 50,
            agreeableness: 50,
            neuroticism: 50,
          },
        }
        sessions.set(sessionId, session)
        return session
      }),

    getSession: (sessionId: string) =>
      Effect.sync(() => {
        const session = sessions.get(sessionId)
        if (!session) {
          throw new Error(`SessionNotFound: ${sessionId}`)
        }
        return session
      }),

    updateSession: (sessionId: string, updates: any) =>
      Effect.sync(() => {
        const session = sessions.get(sessionId)
        if (!session) {
          throw new Error(`SessionNotFound: ${sessionId}`)
        }
        const updated = { ...session, ...updates }
        sessions.set(sessionId, updated)
        return updated
      }),

    resumeSession: (sessionId: string) =>
      Effect.sync(() => {
        const session = sessions.get(sessionId)
        if (!session) {
          throw new Error(`SessionNotFound: ${sessionId}`)
        }
        return session
      }),
  })
}

/**
 * Creates a test Layer for AssessmentMessageRepository.
 *
 * Provides an in-memory message store for testing.
 */
export const createTestAssessmentMessageLayer = () => {
  const messages = new Map<string, any[]>()

  return Layer.succeed(AssessmentMessageRepository, {
    saveMessage: (sessionId: string, role: "user" | "assistant", content: string, userId?: string) =>
      Effect.sync(() => {
        const message = {
          id: `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          sessionId,
          role,
          content,
          userId,
          createdAt: new Date(),
        }
        const sessionMessages = messages.get(sessionId) || []
        sessionMessages.push(message)
        messages.set(sessionId, sessionMessages)
        return message
      }),

    getMessages: (sessionId: string) =>
      Effect.sync(() => messages.get(sessionId) || []),

    getMessageCount: (sessionId: string) =>
      Effect.sync(() => (messages.get(sessionId) || []).length),
  })
}

/**
 * Creates a test Layer for LoggerRepository.
 *
 * Provides a no-op logger for testing (logs are suppressed).
 */
export const createTestLoggerLayer = () =>
  Layer.succeed(LoggerRepository, {
    info: () => Effect.void,
    error: () => Effect.void,
    warn: () => Effect.void,
    debug: () => Effect.void,
  })

/**
 * Creates a test Layer for CostGuardRepository.
 *
 * Provides an in-memory cost tracking implementation.
 */
export const createTestCostGuardLayer = () => {
  const costs = new Map<string, number>()
  const assessments = new Map<string, number>()

  return Layer.succeed(CostGuardRepository, {
    incrementDailyCost: (userId: string, costCents: number) =>
      Effect.sync(() => {
        const key = `cost:${userId}:${new Date().toISOString().split('T')[0]}`
        const current = costs.get(key) || 0
        const updated = current + costCents
        costs.set(key, updated)
        return updated
      }),

    getDailyCost: (userId: string) =>
      Effect.sync(() => {
        const key = `cost:${userId}:${new Date().toISOString().split('T')[0]}`
        return costs.get(key) || 0
      }),

    incrementAssessmentCount: (userId: string) =>
      Effect.sync(() => {
        const key = `assessments:${userId}:${new Date().toISOString().split('T')[0]}`
        const current = assessments.get(key) || 0
        const updated = current + 1
        assessments.set(key, updated)
        return updated
      }),

    getAssessmentCount: (userId: string) =>
      Effect.sync(() => {
        const key = `assessments:${userId}:${new Date().toISOString().split('T')[0]}`
        return assessments.get(key) || 0
      }),
  })
}

/**
 * Creates a test Layer for RedisRepository.
 *
 * Provides an in-memory Redis implementation for testing.
 */
export const createTestRedisLayer = () => {
  const store = new Map<string, string>()
  const ttls = new Map<string, number>()

  return Layer.succeed(RedisRepository, {
    get: (key: string) =>
      Effect.sync(() => store.get(key) || null),

    set: (key: string, value: string) =>
      Effect.sync(() => {
        store.set(key, value)
        return "OK"
      }),

    incrby: (key: string, increment: number) =>
      Effect.sync(() => {
        const current = Number.parseInt(store.get(key) || "0", 10)
        const updated = current + increment
        store.set(key, updated.toString())
        return updated
      }),

    incr: (key: string) =>
      Effect.sync(() => {
        const current = Number.parseInt(store.get(key) || "0", 10)
        const updated = current + 1
        store.set(key, updated.toString())
        return updated
      }),

    expire: (key: string, seconds: number) =>
      Effect.sync(() => {
        ttls.set(key, seconds)
        return 1
      }),

    ttl: (key: string) =>
      Effect.sync(() => ttls.get(key) || -1),
  })
}

/**
 * Creates a test Layer for NerinAgentRepository.
 *
 * Provides a mock Nerin agent for testing without Claude API calls.
 */
export const createTestNerinAgentLayer = () =>
  Layer.succeed(NerinAgentRepository, {
    sendMessage: (sessionId: string, message: string) =>
      Effect.succeed({
        response: `Mock response to: "${message}"`,
        precision: {
          openness: 0.5 + Math.random() * 0.2,
          conscientiousness: 0.5 + Math.random() * 0.2,
          extraversion: 0.5 + Math.random() * 0.2,
          agreeableness: 0.5 + Math.random() * 0.2,
          neuroticism: 0.5 + Math.random() * 0.2,
        },
        usage: {
          inputTokens: 100,
          outputTokens: 50,
        },
      }),
  })

/**
 * Complete test Layer merging all repository mocks.
 *
 * Provides all dependencies needed for use-case testing.
 *
 * @example
 * ```typescript
 * it.effect('should process message', () =>
 *   Effect.gen(function* () {
 *     const result = yield* sendMessage({ sessionId: "test", message: "Hello" })
 *     expect(result.response).toBeDefined()
 *   }).pipe(Effect.provide(TestRepositoriesLayer))
 * )
 * ```
 */
export const TestRepositoriesLayer = Layer.mergeAll(
  createTestAssessmentSessionLayer(),
  createTestAssessmentMessageLayer(),
  createTestLoggerLayer(),
  createTestCostGuardLayer(),
  createTestRedisLayer(),
  createTestNerinAgentLayer()
)

/**
 * Helper to provide test Layer to Effect programs.
 *
 * Simplifies test setup by automatically providing TestRepositoriesLayer.
 *
 * @deprecated Use Effect.provide directly with TestRepositoriesLayer for better type safety
 * @example
 * ```typescript
 * // Preferred approach (direct):
 * const result = await Effect.runPromise(
 *   myUseCase({ ... }).pipe(Effect.provide(TestRepositoriesLayer))
 * )
 *
 * // Alternative (helper):
 * const result = await Effect.runPromise(
 *   provideTestLayer(myUseCase({ ... }))
 * )
 * ```
 */
export const provideTestLayer = <A, E>(effect: Effect.Effect<A, E, any>) =>
  Effect.provide(effect, TestRepositoriesLayer)
