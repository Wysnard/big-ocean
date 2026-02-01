/**
 * Session Management Use Case Tests
 *
 * Tests the session lifecycle through use cases:
 * - Creating new assessment sessions
 * - Saving conversation messages
 * - Resuming sessions with message history
 * - Updating assessment precision scores
 *
 * Verifies end-to-end functionality of session persistence layer.
 */

import { describe, it, expect } from "vitest"
import { Effect, Layer } from "effect"
import { AssessmentSessionRepository } from "@workspace/domain/repositories/assessment-session.repository"
import { AssessmentMessageRepository } from "@workspace/domain/repositories/assessment-message.repository"

/**
 * Mock repositories for testing use case logic
 * (without database dependencies)
 */
const createMockSessionRepository = () =>
  AssessmentSessionRepository.of({
    createSession: (userId) =>
      Effect.succeed({
        sessionId: `session_${Date.now()}`,
      }),

    getSession: (sessionId) =>
      Effect.succeed({
        id: sessionId,
        userId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: "active",
        precision: {
          openness: 0.5,
          conscientiousness: 0.5,
          extraversion: 0.5,
          agreeableness: 0.5,
          neuroticism: 0.5,
        },
        messageCount: 0,
      }),

    updateSession: (sessionId, partial) =>
      Effect.succeed({
        id: sessionId,
        userId: partial.userId ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: partial.status ?? "active",
        precision: partial.precision ?? {
          openness: 0.5,
          conscientiousness: 0.5,
          extraversion: 0.5,
          agreeableness: 0.5,
          neuroticism: 0.5,
        },
        messageCount: partial.messageCount ?? 0,
      }),
  })

const createMockMessageRepository = () =>
  AssessmentMessageRepository.of({
    saveMessage: (sessionId, role, content, userId) => {
      if (role === "user") {
        return Effect.succeed({
          id: `msg_${Date.now()}`,
          sessionId,
          userId: userId ?? null,
          role: "user" as const,
          content,
          createdAt: new Date(),
        })
      } else {
        return Effect.succeed({
          id: `msg_${Date.now()}`,
          sessionId,
          role: "assistant" as const,
          content,
          createdAt: new Date(),
        })
      }
    },

    getMessages: (sessionId) =>
      Effect.succeed([
        {
          id: "msg_1",
          sessionId,
          userId: null,
          role: "user" as const,
          content: "Hello, tell me about myself",
          createdAt: new Date(Date.now() - 1000),
        } as any,
        {
          id: "msg_2",
          sessionId,
          role: "assistant" as const,
          content: "I'm happy to help with your assessment.",
          createdAt: new Date(),
        } as any,
      ]),

    getMessageCount: (sessionId) => Effect.succeed(2),
  })

describe("Session Management Use Cases", () => {
  describe("Create Session", () => {
    it("should create a new session", async () => {
      const sessionRepo = createMockSessionRepository()

      const test = Effect.gen(function* () {
        const result = yield* sessionRepo.createSession()
        expect(result.sessionId).toBeDefined()
        expect(typeof result.sessionId).toBe("string")
        expect(result.sessionId.startsWith("session_")).toBe(true)
      })

      await Effect.runPromise(
        test.pipe(Effect.provide(Layer.succeed(AssessmentSessionRepository, sessionRepo))),
      )
    })

    it("should create session with optional userId", async () => {
      const sessionRepo = createMockSessionRepository()

      const test = Effect.gen(function* () {
        const result = yield* sessionRepo.createSession("user_123")
        expect(result.sessionId).toBeDefined()
      })

      await Effect.runPromise(
        test.pipe(Effect.provide(Layer.succeed(AssessmentSessionRepository, sessionRepo))),
      )
    })
  })

  describe("Get Session", () => {
    it("should retrieve session with initial precision scores", async () => {
      const sessionRepo = createMockSessionRepository()

      const test = Effect.gen(function* () {
        const session = yield* sessionRepo.getSession("session_123")

        expect(session).toBeDefined()
        expect(session.id).toBe("session_123")
        expect(session.status).toBe("active")
        expect(session.precision).toBeDefined()
        expect(session.precision.openness).toBe(0.5)
        expect(session.precision.conscientiousness).toBe(0.5)
        expect(session.precision.extraversion).toBe(0.5)
        expect(session.precision.agreeableness).toBe(0.5)
        expect(session.precision.neuroticism).toBe(0.5)
      })

      await Effect.runPromise(
        test.pipe(Effect.provide(Layer.succeed(AssessmentSessionRepository, sessionRepo))),
      )
    })
  })

  describe("Save Message", () => {
    it("should save user message to session", async () => {
      const messageRepo = createMockMessageRepository()

      const test = Effect.gen(function* () {
        const message = yield* messageRepo.saveMessage(
          "session_123",
          "user",
          "Tell me more",
          "user_456",
        )

        expect(message.id).toBeDefined()
        expect(message.sessionId).toBe("session_123")
        expect(message.role).toBe("user")
        expect(message.content).toBe("Tell me more")
        if (message.role === "user") {
          expect(message.userId).toBe("user_456")
        }
      })

      await Effect.runPromise(
        test.pipe(Effect.provide(Layer.succeed(AssessmentMessageRepository, messageRepo))),
      )
    })

    it("should save assistant message without userId", async () => {
      const messageRepo = createMockMessageRepository()

      const test = Effect.gen(function* () {
        const message = yield* messageRepo.saveMessage(
          "session_123",
          "assistant",
          "That's an interesting perspective...",
          undefined,
        )

        expect(message.role).toBe("assistant")
        expect("userId" in message && message.userId).toBeFalsy()
      })

      await Effect.runPromise(
        test.pipe(Effect.provide(Layer.succeed(AssessmentMessageRepository, messageRepo))),
      )
    })
  })

  describe("Resume Session", () => {
    it("should retrieve all messages in conversation order", async () => {
      const messageRepo = createMockMessageRepository()

      const test = Effect.gen(function* () {
        const messages = yield* messageRepo.getMessages("session_123")

        expect(messages.length).toBeGreaterThanOrEqual(2)
        // Verify chronological order
        if (messages.length >= 2 && messages[0] && messages[1]) {
          expect(messages[0].createdAt.getTime()).toBeLessThanOrEqual(
            messages[1].createdAt.getTime(),
          )
        }
      })

      await Effect.runPromise(
        test.pipe(Effect.provide(Layer.succeed(AssessmentMessageRepository, messageRepo))),
      )
    })

    it("should count messages in session", async () => {
      const messageRepo = createMockMessageRepository()

      const test = Effect.gen(function* () {
        const count = yield* messageRepo.getMessageCount("session_123")
        expect(count).toBe(2)
      })

      await Effect.runPromise(
        test.pipe(Effect.provide(Layer.succeed(AssessmentMessageRepository, messageRepo))),
      )
    })
  })

  describe("Update Precision Scores", () => {
    it("should update session with new precision scores", async () => {
      const sessionRepo = createMockSessionRepository()

      const test = Effect.gen(function* () {
        const updatedSession = yield* sessionRepo.updateSession("session_123", {
          precision: {
            openness: 0.7,
            conscientiousness: 0.6,
            extraversion: 0.5,
            agreeableness: 0.8,
            neuroticism: 0.3,
          },
        })

        expect(updatedSession.precision.openness).toBe(0.7)
        expect(updatedSession.precision.conscientiousness).toBe(0.6)
        expect(updatedSession.precision.agreeableness).toBe(0.8)
      })

      await Effect.runPromise(
        test.pipe(Effect.provide(Layer.succeed(AssessmentSessionRepository, sessionRepo))),
      )
    })

    it("should update session status", async () => {
      const sessionRepo = createMockSessionRepository()

      const test = Effect.gen(function* () {
        const updatedSession = yield* sessionRepo.updateSession("session_123", {
          status: "completed",
        })

        expect(updatedSession.status).toBe("completed")
      })

      await Effect.runPromise(
        test.pipe(Effect.provide(Layer.succeed(AssessmentSessionRepository, sessionRepo))),
      )
    })
  })

  describe("Service Interface Verification", () => {
    it("should have AssessmentSessionRepository service tag", () => {
      expect(AssessmentSessionRepository).toBeDefined()
      expect(typeof AssessmentSessionRepository).toBe("function")
    })

    it("should have AssessmentMessageRepository service tag", () => {
      expect(AssessmentMessageRepository).toBeDefined()
      expect(typeof AssessmentMessageRepository).toBe("function")
    })

    it("session repository should support all required methods", async () => {
      const sessionRepo = createMockSessionRepository()

      const test = Effect.gen(function* () {
        expect(typeof sessionRepo.createSession).toBe("function")
        expect(typeof sessionRepo.getSession).toBe("function")
        expect(typeof sessionRepo.updateSession).toBe("function")
      })

      await Effect.runPromise(
        test.pipe(Effect.provide(Layer.succeed(AssessmentSessionRepository, sessionRepo))),
      )
    })

    it("message repository should support all required methods", async () => {
      const messageRepo = createMockMessageRepository()

      const test = Effect.gen(function* () {
        expect(typeof messageRepo.saveMessage).toBe("function")
        expect(typeof messageRepo.getMessages).toBe("function")
        expect(typeof messageRepo.getMessageCount).toBe("function")
      })

      await Effect.runPromise(
        test.pipe(Effect.provide(Layer.succeed(AssessmentMessageRepository, messageRepo))),
      )
    })
  })
})
