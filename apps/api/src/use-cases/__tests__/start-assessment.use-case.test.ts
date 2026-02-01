/**
 * Start Assessment Use Case Tests
 *
 * Tests for the startAssessment business logic.
 * Uses mock repositories to test:
 * - Session creation
 * - User ID handling
 * - Logging
 * - Response format
 */

import { Effect, Layer } from "effect";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  AssessmentSessionRepository,
  LoggerRepository,
} from "@workspace/domain";
import { startAssessment } from "../start-assessment.use-case.js";

describe("startAssessment Use Case", () => {
  // @biome-ignore lint/suspicious/noExplicitAny: vitest mocks require flexible types
  let mockSessionRepo: any;
  // @biome-ignore lint/suspicious/noExplicitAny: vitest mocks require flexible types
  let mockLogger: any;

  beforeEach(() => {
    mockSessionRepo = {
      createSession: vi.fn().mockReturnValue(
        Effect.succeed({
          sessionId: "session_new_789",
          userId: undefined,
          createdAt: new Date("2026-02-01T10:00:00Z"),
          precision: {
            openness: 50,
            conscientiousness: 50,
            extraversion: 50,
            agreeableness: 50,
            neuroticism: 50,
          },
        })
      ),
      getSession: vi.fn(),
      updateSession: vi.fn(),
      resumeSession: vi.fn(),
    };

    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Success scenarios", () => {
    it("should create a new assessment session", async () => {
      const testLayer = Layer.mergeAll(
        Layer.succeed(AssessmentSessionRepository, mockSessionRepo),
        Layer.succeed(LoggerRepository, mockLogger)
      );

      const input = {};

      const result = await Effect.runPromise(
        startAssessment(input).pipe(Effect.provide(testLayer))
      );

      expect(result.sessionId).toBe("session_new_789");
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    it("should create session with user ID when provided", async () => {
      const testLayer = Layer.mergeAll(
        Layer.succeed(AssessmentSessionRepository, mockSessionRepo),
        Layer.succeed(LoggerRepository, mockLogger)
      );

      const input = {
        userId: "user_123",
      };

      await Effect.runPromise(
        startAssessment(input).pipe(Effect.provide(testLayer))
      );

      expect(mockSessionRepo.createSession).toHaveBeenCalledWith("user_123");
    });

    it("should create session without user ID when not provided", async () => {
      const testLayer = Layer.mergeAll(
        Layer.succeed(AssessmentSessionRepository, mockSessionRepo),
        Layer.succeed(LoggerRepository, mockLogger)
      );

      const input = {};

      await Effect.runPromise(
        startAssessment(input).pipe(Effect.provide(testLayer))
      );

      expect(mockSessionRepo.createSession).toHaveBeenCalledWith(undefined);
    });

    it("should log session creation event", async () => {
      const testLayer = Layer.mergeAll(
        Layer.succeed(AssessmentSessionRepository, mockSessionRepo),
        Layer.succeed(LoggerRepository, mockLogger)
      );

      const input = {
        userId: "user_456",
      };

      await Effect.runPromise(
        startAssessment(input).pipe(Effect.provide(testLayer))
      );

      expect(mockLogger.info).toHaveBeenCalledWith(
        "Assessment session started",
        {
          sessionId: "session_new_789",
          userId: "user_456",
        }
      );
    });

    it("should return session ID and creation timestamp", async () => {
      const testLayer = Layer.mergeAll(
        Layer.succeed(AssessmentSessionRepository, mockSessionRepo),
        Layer.succeed(LoggerRepository, mockLogger)
      );

      const beforeTime = new Date();
      const input = {};

      const result = await Effect.runPromise(
        startAssessment(input).pipe(Effect.provide(testLayer))
      );

      const afterTime = new Date();

      expect(result).toHaveProperty("sessionId");
      expect(result).toHaveProperty("createdAt");
      expect(result.sessionId).toBe("session_new_789");
      expect(result.createdAt.getTime()).toBeGreaterThanOrEqual(
        beforeTime.getTime()
      );
      expect(result.createdAt.getTime()).toBeLessThanOrEqual(
        afterTime.getTime()
      );
    });

    it("should handle multiple session creations independently", async () => {
      const testLayer = Layer.mergeAll(
        Layer.succeed(AssessmentSessionRepository, mockSessionRepo),
        Layer.succeed(LoggerRepository, mockLogger)
      );

      const input1 = { userId: "user_1" };
      const input2 = { userId: "user_2" };

      await Effect.runPromise(
        startAssessment(input1).pipe(Effect.provide(testLayer))
      );

      await Effect.runPromise(
        startAssessment(input2).pipe(Effect.provide(testLayer))
      );

      expect(mockSessionRepo.createSession).toHaveBeenCalledTimes(2);
      expect(mockSessionRepo.createSession).toHaveBeenNthCalledWith(
        1,
        "user_1"
      );
      expect(mockSessionRepo.createSession).toHaveBeenNthCalledWith(
        2,
        "user_2"
      );
    });
  });

  describe("Error handling", () => {
    it("should fail when session creation fails", async () => {
      const creationError = new Error("Database connection failed");
      mockSessionRepo.createSession.mockReturnValue(Effect.fail(creationError));

      const testLayer = Layer.mergeAll(
        Layer.succeed(AssessmentSessionRepository, mockSessionRepo),
        Layer.succeed(LoggerRepository, mockLogger)
      );

      const input = {};

      await expect(
        Effect.runPromise(
          startAssessment(input).pipe(Effect.provide(testLayer))
        )
      ).rejects.toThrow("Database connection failed");
    });

    it("should handle repository errors gracefully", async () => {
      const repoError = new Error("Repository unavailable");
      mockSessionRepo.createSession.mockReturnValue(Effect.fail(repoError));

      const testLayer = Layer.mergeAll(
        Layer.succeed(AssessmentSessionRepository, mockSessionRepo),
        Layer.succeed(LoggerRepository, mockLogger)
      );

      const input = { userId: "user_test" };

      await expect(
        Effect.runPromise(
          startAssessment(input).pipe(Effect.provide(testLayer))
        )
      ).rejects.toThrow("Repository unavailable");
    });
  });

  describe("Edge cases", () => {
    it("should handle empty user ID string", async () => {
      const testLayer = Layer.mergeAll(
        Layer.succeed(AssessmentSessionRepository, mockSessionRepo),
        Layer.succeed(LoggerRepository, mockLogger)
      );

      const input = {
        userId: "",
      };

      await Effect.runPromise(
        startAssessment(input).pipe(Effect.provide(testLayer))
      );

      expect(mockSessionRepo.createSession).toHaveBeenCalledWith("");
    });

    it("should handle special characters in user ID", async () => {
      const specialUserId = "user+test@example.com";

      const testLayer = Layer.mergeAll(
        Layer.succeed(AssessmentSessionRepository, mockSessionRepo),
        Layer.succeed(LoggerRepository, mockLogger)
      );

      const input = {
        userId: specialUserId,
      };

      await Effect.runPromise(
        startAssessment(input).pipe(Effect.provide(testLayer))
      );

      expect(mockSessionRepo.createSession).toHaveBeenCalledWith(specialUserId);
    });

    it("should handle very long user ID", async () => {
      const longUserId = "a".repeat(1000);

      const testLayer = Layer.mergeAll(
        Layer.succeed(AssessmentSessionRepository, mockSessionRepo),
        Layer.succeed(LoggerRepository, mockLogger)
      );

      const input = {
        userId: longUserId,
      };

      await Effect.runPromise(
        startAssessment(input).pipe(Effect.provide(testLayer))
      );

      expect(mockSessionRepo.createSession).toHaveBeenCalledWith(longUserId);
    });

    it("should return current time, not repository creation time", async () => {
      const repositoryTime = new Date("2025-01-01T00:00:00Z");
      mockSessionRepo.createSession.mockReturnValue(
        Effect.succeed({
          sessionId: "session_test_old",
          userId: undefined,
          createdAt: repositoryTime,
          precision: {
            openness: 50,
            conscientiousness: 50,
            extraversion: 50,
            agreeableness: 50,
            neuroticism: 50,
          },
        })
      );

      const testLayer = Layer.mergeAll(
        Layer.succeed(AssessmentSessionRepository, mockSessionRepo),
        Layer.succeed(LoggerRepository, mockLogger)
      );

      const beforeTime = new Date();
      const input = {};

      const result = await Effect.runPromise(
        startAssessment(input).pipe(Effect.provide(testLayer))
      );

      const afterTime = new Date();

      // The result should have a createdAt that's close to current time,
      // not the repository's old timestamp
      expect(result.createdAt.getTime()).toBeGreaterThanOrEqual(
        beforeTime.getTime()
      );
      expect(result.createdAt.getTime()).toBeLessThanOrEqual(
        afterTime.getTime()
      );
    });
  });

  describe("Integration scenarios", () => {
    it("should create session for anonymous user", async () => {
      const testLayer = Layer.mergeAll(
        Layer.succeed(AssessmentSessionRepository, mockSessionRepo),
        Layer.succeed(LoggerRepository, mockLogger)
      );

      const input = { userId: undefined };

      const result = await Effect.runPromise(
        startAssessment(input).pipe(Effect.provide(testLayer))
      );

      expect(result).toHaveProperty("sessionId");
      expect(mockLogger.info).toHaveBeenCalledWith(
        "Assessment session started",
        {
          sessionId: "session_new_789",
          userId: undefined,
        }
      );
    });

    it("should be idempotent - each call creates new session", async () => {
      let callCount = 0;
      mockSessionRepo.createSession.mockImplementation(() => {
        callCount++;
        return Effect.succeed({
          sessionId: `session_${callCount}`,
          userId: "user_test",
          createdAt: new Date(),
          precision: {
            openness: 50,
            conscientiousness: 50,
            extraversion: 50,
            agreeableness: 50,
            neuroticism: 50,
          },
        });
      });

      const testLayer = Layer.mergeAll(
        Layer.succeed(AssessmentSessionRepository, mockSessionRepo),
        Layer.succeed(LoggerRepository, mockLogger)
      );

      const input = { userId: "user_test" };

      const result1 = await Effect.runPromise(
        startAssessment(input).pipe(Effect.provide(testLayer))
      );

      const result2 = await Effect.runPromise(
        startAssessment(input).pipe(Effect.provide(testLayer))
      );

      expect(result1.sessionId).toBe("session_1");
      expect(result2.sessionId).toBe("session_2");
      expect(result1.sessionId).not.toBe(result2.sessionId);
    });
  });
});
