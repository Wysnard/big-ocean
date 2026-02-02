/**
 * Start Assessment Use Case Tests (Migrated to @effect/vitest)
 *
 * Tests for the startAssessment business logic using @effect/vitest.
 * Demonstrates proper Effect testing patterns with test Layers.
 */

import { describe, expect } from 'vitest'
import { it } from '@effect/vitest'
import { Effect } from 'effect'
import { TestRepositoriesLayer } from '../../test-utils/test-layers.js'
import { AssessmentSessionRepository, LoggerRepository } from '@workspace/domain'
import { startAssessment } from '../../use-cases/start-assessment.use-case.js'

describe('startAssessment Use Case (@effect/vitest)', () => {
  describe('Success scenarios', () => {
    it.effect('should create a new assessment session', () =>
      Effect.gen(function* () {
        const result = yield* startAssessment({})

        expect(result.sessionId).toMatch(/^session_/)
        expect(result.createdAt).toBeInstanceOf(Date)
      }).pipe(Effect.provide(TestRepositoriesLayer))
    )

    it.effect('should create session with user ID when provided', () =>
      Effect.gen(function* () {
        const sessionRepo = yield* AssessmentSessionRepository

        const result = yield* startAssessment({ userId: 'user_123' })

        expect(result.sessionId).toBeDefined()

        // Verify session was created with correct user ID
        const session = yield* sessionRepo.getSession(result.sessionId)
        expect(session.userId).toBe('user_123')
      }).pipe(Effect.provide(TestRepositoriesLayer))
    )

    it.effect('should create session without user ID when not provided', () =>
      Effect.gen(function* () {
        const sessionRepo = yield* AssessmentSessionRepository

        const result = yield* startAssessment({})

        // Verify session was created without user ID
        const session = yield* sessionRepo.getSession(result.sessionId)
        expect(session.userId).toBeUndefined()
      }).pipe(Effect.provide(TestRepositoriesLayer))
    )

    it.effect('should return session ID and creation timestamp', () =>
      Effect.gen(function* () {
        const beforeTime = new Date()
        const result = yield* startAssessment({})
        const afterTime = new Date()

        expect(result).toHaveProperty('sessionId')
        expect(result).toHaveProperty('createdAt')
        expect(result.createdAt.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime())
        expect(result.createdAt.getTime()).toBeLessThanOrEqual(afterTime.getTime())
      }).pipe(Effect.provide(TestRepositoriesLayer))
    )

    it.effect('should handle multiple session creations independently', () =>
      Effect.gen(function* () {
        const result1 = yield* startAssessment({ userId: 'user_1' })
        const result2 = yield* startAssessment({ userId: 'user_2' })

        expect(result1.sessionId).not.toBe(result2.sessionId)
      }).pipe(Effect.provide(TestRepositoriesLayer))
    )
  })

  describe('Error handling', () => {
    it.effect('should propagate repository errors', () =>
      Effect.gen(function* () {
        // Create a custom layer with failing repository
        const failingSessionRepo = {
          createSession: () => Effect.fail(new Error('Database connection failed')),
          getSession: () => Effect.fail(new Error('Not implemented')),
          updateSession: () => Effect.fail(new Error('Not implemented')),
          resumeSession: () => Effect.fail(new Error('Not implemented')),
        }

        const failingLayer = Effect.provideService(
          startAssessment({}),
          AssessmentSessionRepository,
          failingSessionRepo
        )

        const exit = yield* Effect.exit(failingLayer.pipe(Effect.provide(TestRepositoriesLayer)))

        expect(exit._tag).toBe('Failure')
      }).pipe(Effect.provide(TestRepositoriesLayer))
    )
  })

  describe('Edge cases', () => {
    it.effect('should handle empty user ID string', () =>
      Effect.gen(function* () {
        const sessionRepo = yield* AssessmentSessionRepository

        const result = yield* startAssessment({ userId: '' })

        const session = yield* sessionRepo.getSession(result.sessionId)
        expect(session.userId).toBe('')
      }).pipe(Effect.provide(TestRepositoriesLayer))
    )

    it.effect('should handle special characters in user ID', () =>
      Effect.gen(function* () {
        const specialUserId = 'user+test@example.com'
        const sessionRepo = yield* AssessmentSessionRepository

        const result = yield* startAssessment({ userId: specialUserId })

        const session = yield* sessionRepo.getSession(result.sessionId)
        expect(session.userId).toBe(specialUserId)
      }).pipe(Effect.provide(TestRepositoriesLayer))
    )

    it.effect('should handle very long user ID', () =>
      Effect.gen(function* () {
        const longUserId = 'a'.repeat(1000)
        const sessionRepo = yield* AssessmentSessionRepository

        const result = yield* startAssessment({ userId: longUserId })

        const session = yield* sessionRepo.getSession(result.sessionId)
        expect(session.userId).toBe(longUserId)
      }).pipe(Effect.provide(TestRepositoriesLayer))
    )
  })

  describe('Integration scenarios', () => {
    it.effect('should create session for anonymous user', () =>
      Effect.gen(function* () {
        const result = yield* startAssessment({ userId: undefined })

        expect(result).toHaveProperty('sessionId')
        expect(result.sessionId).toBeDefined()
      }).pipe(Effect.provide(TestRepositoriesLayer))
    )

    it.effect('should be idempotent - each call creates new session', () =>
      Effect.gen(function* () {
        const result1 = yield* startAssessment({ userId: 'user_test' })
        const result2 = yield* startAssessment({ userId: 'user_test' })

        expect(result1.sessionId).not.toBe(result2.sessionId)
        expect(result1.sessionId).toMatch(/^session_/)
        expect(result2.sessionId).toMatch(/^session_/)
      }).pipe(Effect.provide(TestRepositoriesLayer))
    )
  })
})
