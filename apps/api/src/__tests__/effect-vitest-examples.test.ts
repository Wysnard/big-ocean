/**
 * @effect/vitest Feature Examples
 *
 * Demonstrates all @effect/vitest testing patterns:
 * - it.effect for Effect programs
 * - TestClock for time-dependent code
 * - it.scoped for resource management
 * - it.live for real-time execution
 * - Test modifiers (skip, only, fails)
 * - Effect.exit for testing failures
 * - Layer composition patterns
 *
 * @see https://github.com/Effect-TS/effect/tree/main/packages/vitest
 * @see https://www.effect.solutions/testing
 */

import { describe, expect } from 'vitest'
import { it } from '@effect/vitest'
import { Effect, Layer, Fiber, TestClock } from 'effect'
import { TestRepositoriesLayer } from '../test-utils/test-layers.js'
import { AssessmentSessionRepository, LoggerRepository } from '@workspace/domain'

describe('@effect/vitest Feature Examples', () => {
  describe('Basic it.effect Usage', () => {
    it.effect('should run simple Effect programs', () =>
      Effect.gen(function* () {
        const value = yield* Effect.succeed(42)
        expect(value).toBe(42)
      })
    )

    it.effect('should handle Effect.gen with multiple yields', () =>
      Effect.gen(function* () {
        const a = yield* Effect.succeed(1)
        const b = yield* Effect.succeed(2)
        const c = yield* Effect.succeed(3)

        expect(a + b + c).toBe(6)
      })
    )

    it.effect('should work with test Layers', () =>
      Effect.gen(function* () {
        const sessionRepo = yield* AssessmentSessionRepository
        const session = yield* sessionRepo.createSession('test-user')

        expect(session.sessionId).toMatch(/^session_/)
        expect(session.userId).toBe('test-user')
      }).pipe(Effect.provide(TestRepositoriesLayer))
    )
  })

  describe('TestClock Examples', () => {
    it.effect('should advance virtual time with TestClock', () =>
      Effect.gen(function* () {
        const testClock = yield* TestClock.TestClock

        // Start delayed operation
        const deferred = yield* Effect.fork(
          Effect.sleep('5 seconds').pipe(Effect.as('completed'))
        )

        // Time hasn't advanced yet - fiber shouldn't be done
        const beforeAdjust = yield* Fiber.poll(deferred)
        expect(beforeAdjust._tag).toBe('None')

        // Advance virtual time by 5 seconds
        yield* testClock.adjust('5 seconds')

        // Now fiber should be complete
        const result = yield* Fiber.join(deferred)
        expect(result).toBe('completed')
      })
    )

    it.effect('should test time-dependent operations without delays', () =>
      Effect.gen(function* () {
        const testClock = yield* TestClock.TestClock

        let counter = 0
        const incrementAfterDelay = Effect.gen(function* () {
          yield* Effect.sleep('10 seconds')
          counter++
          return counter
        })

        const fiber = yield* Effect.fork(incrementAfterDelay)

        // Counter shouldn't increment yet
        expect(counter).toBe(0)

        // Advance time by 10 seconds
        yield* testClock.adjust('10 seconds')

        // Now counter should be incremented
        const result = yield* Fiber.join(fiber)
        expect(result).toBe(1)
        expect(counter).toBe(1)
      })
    )
  })

  describe('Effect.exit for Testing Failures', () => {
    it.effect('should test successful outcomes with Exit', () =>
      Effect.gen(function* () {
        const program = Effect.succeed(42)
        const exit = yield* Effect.exit(program)

        expect(exit._tag).toBe('Success')
        if (exit._tag === 'Success') {
          expect(exit.value).toBe(42)
        }
      })
    )

    it.effect('should test failure outcomes with Exit', () =>
      Effect.gen(function* () {
        const program = Effect.fail(new Error('Test error'))
        const exit = yield* Effect.exit(program)

        expect(exit._tag).toBe('Failure')
        if (exit._tag === 'Failure') {
          // Can inspect cause details
          expect(exit.cause).toBeDefined()
        }
      })
    )

    it.effect('should handle custom error types', () =>
      Effect.gen(function* () {
        class CustomError {
          readonly _tag = 'CustomError'
          constructor(readonly message: string) {}
        }

        const program = Effect.fail(new CustomError('Custom failure'))
        const exit = yield* Effect.exit(program)

        expect(exit._tag).toBe('Failure')
      })
    )
  })

  describe('Layer Composition Examples', () => {
    it.effect('should use Layer.mergeAll for multiple dependencies', () =>
      Effect.gen(function* () {
        // TestRepositoriesLayer already merges all dependencies
        const sessionRepo = yield* AssessmentSessionRepository
        const logger = yield* LoggerRepository

        const session = yield* sessionRepo.createSession('layer-test')
        yield* logger.info('Session created', { sessionId: session.sessionId })

        expect(session.sessionId).toBeDefined()
      }).pipe(Effect.provide(TestRepositoriesLayer))
    )

    it.effect('should override specific Layer services', () => {
      // Create custom logger that tracks calls
      let callCount = 0
      const trackingLogger = {
        info: () => Effect.sync(() => { callCount++ }),
        error: () => Effect.void,
        warn: () => Effect.void,
        debug: () => Effect.void,
      }

      const customLayer = Layer.mergeAll(
        TestRepositoriesLayer,
        Layer.succeed(LoggerRepository, trackingLogger)
      )

      return Effect.gen(function* () {
        const logger = yield* LoggerRepository
        yield* logger.info('Test message')
        yield* logger.info('Another message')

        expect(callCount).toBe(2)
      }).pipe(Effect.provide(customLayer))
    })
  })

  describe('Test Modifiers', () => {
    // Skip this test temporarily
    it.effect.skip('should skip this test', () =>
      Effect.gen(function* () {
        // This test won't run
        const value = yield* Effect.succeed('skipped')
        expect(value).toBe('skipped')
      })
    )

    // Run only this test when debugging (commented out to not interfere with other tests)
    // it.effect.only('should run only this test', () =>
    //   Effect.succeed(undefined)
    // )

    // Assert expected failure
    it.effect.fails('should expect this test to fail', () =>
      Effect.gen(function* () {
        yield* Effect.fail(new Error('Expected failure'))
      })
    )
  })

  describe('Real-world Use Case Examples', () => {
    it.effect('should test session creation workflow', () =>
      Effect.gen(function* () {
        const sessionRepo = yield* AssessmentSessionRepository

        // Create session
        const session = yield* sessionRepo.createSession('workflow-user')

        // Verify session exists
        const retrieved = yield* sessionRepo.getSession(session.sessionId)

        expect(retrieved.sessionId).toBe(session.sessionId)
        expect(retrieved.userId).toBe('workflow-user')
        expect(retrieved.precision).toMatchObject({
          openness: 50,
          conscientiousness: 50,
          extraversion: 50,
          agreeableness: 50,
          neuroticism: 50,
        })
      }).pipe(Effect.provide(TestRepositoriesLayer))
    )

    it.effect('should test concurrent operations', () =>
      Effect.gen(function* () {
        const sessionRepo = yield* AssessmentSessionRepository

        // Create sessions concurrently
        const [session1, session2, session3] = yield* Effect.all([
          sessionRepo.createSession('user-1'),
          sessionRepo.createSession('user-2'),
          sessionRepo.createSession('user-3'),
        ], { concurrency: 'unbounded' })

        // All sessions should have unique IDs
        const ids = [session1.sessionId, session2.sessionId, session3.sessionId]
        const uniqueIds = new Set(ids)
        expect(uniqueIds.size).toBe(3)
      }).pipe(Effect.provide(TestRepositoriesLayer))
    )

    it.effect('should test error recovery patterns', () =>
      Effect.gen(function* () {
        const sessionRepo = yield* AssessmentSessionRepository

        // Attempt to get non-existent session
        const exit = yield* Effect.exit(
          sessionRepo.getSession('non-existent-session-id')
        )

        // Should fail
        expect(exit._tag).toBe('Failure')

        // Recover by creating new session
        const newSession = yield* sessionRepo.createSession('recovery-user')
        expect(newSession.sessionId).toBeDefined()
      }).pipe(Effect.provide(TestRepositoriesLayer))
    )
  })

  describe('Advanced Testing Patterns', () => {
    it.scoped('should handle scoped resources with automatic cleanup', () =>
      Effect.gen(function* () {
        // Create a scoped resource (automatically cleaned up)
        let resourceClosed = false
        const resource = yield* Effect.acquireRelease(
          Effect.sync(() => ({ value: 'test-resource' })),
          () => Effect.sync(() => { resourceClosed = true })
        )

        expect(resource.value).toBe('test-resource')
        expect(resourceClosed).toBe(false)

        // After test completes, resource is automatically released
        // (verified by resourceClosed being set to true in cleanup)
      }).pipe(Effect.provide(TestRepositoriesLayer))
    )

    it.live('should use real time instead of virtual time', () =>
      Effect.gen(function* () {
        const start = Date.now()

        // This uses REAL time, not virtual time
        yield* Effect.sleep('50 millis')

        const elapsed = Date.now() - start

        // Verify at least 50ms passed (real time)
        expect(elapsed).toBeGreaterThanOrEqual(50)
        expect(elapsed).toBeLessThan(200) // Should complete quickly
      })
    )
  })
})
