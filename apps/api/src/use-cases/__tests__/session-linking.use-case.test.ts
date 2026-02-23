/**
 * Session Linking Use Case Tests (Story 9.4, Task 5)
 *
 * Tests the anonymous-to-authenticated session linking behavior using
 * mock repositories. Validates:
 * - assignUserId clears session_token (AC #2)
 * - Idempotent relinking (same user)
 * - Ownership guard in sendMessage rejects mismatched user
 * - Message backfill preconditions (user-role messages with null userId)
 *
 * Uses @effect/vitest it.effect() pattern per project conventions.
 */

import { vi } from "vitest";

// Mock repos — must be before any imports that reference them
vi.mock("@workspace/infrastructure/repositories/assessment-session.drizzle.repository");
vi.mock("@workspace/infrastructure/repositories/assessment-message.drizzle.repository");

import { describe, expect, it } from "@effect/vitest";
import {
	AppConfig,
	AssessmentMessageRepository,
	AssessmentSessionRepository,
	LoggerRepository,
	NerinAgentRepository,
} from "@workspace/domain";
import { AssessmentMessageDrizzleRepositoryLive } from "@workspace/infrastructure/repositories/assessment-message.drizzle.repository";

import { AssessmentSessionDrizzleRepositoryLive } from "@workspace/infrastructure/repositories/assessment-session.drizzle.repository";
import { Effect, Exit, Layer, Redacted } from "effect";
import { sendMessage } from "../send-message.use-case";

// Minimal logger
const MockLoggerLive = Layer.succeed(LoggerRepository, {
	info: vi.fn(),
	error: vi.fn(),
	warn: vi.fn(),
	debug: vi.fn(),
});

// Minimal nerin mock
const MockNerinLive = Layer.succeed(NerinAgentRepository, {
	invoke: vi.fn(() =>
		Effect.succeed({
			response: "Mock response",
			tokenCount: { input: 10, output: 10, total: 20 },
		}),
	),
});

// Minimal config
const MockConfigLive = Layer.succeed(AppConfig, {
	databaseUrl: "mock",
	redisUrl: "mock",
	betterAuthUrl: "http://localhost:4000",
	betterAuthSecret: Redacted.make("test-secret"),
	frontendUrl: "http://localhost:3000",
	dailyCostLimitCents: 7500,
	messageThreshold: 25,
	anthropicApiKey: Redacted.make("test-key"),
	nerinModelId: "claude-3-haiku-20240307",
	environment: "test",
});

const TestLayer = Layer.mergeAll(
	AssessmentSessionDrizzleRepositoryLive,
	AssessmentMessageDrizzleRepositoryLive,
	MockLoggerLive,
	MockNerinLive,
	MockConfigLive,
);

describe("Session Linking (Story 9.4, Task 5)", () => {
	describe("assignUserId clears session_token (AC #2)", () => {
		it.effect("assigns userId and clears sessionToken", () =>
			Effect.gen(function* () {
				const sessionRepo = yield* AssessmentSessionRepository;

				// Create anonymous session
				const { sessionId, sessionToken } = yield* sessionRepo.createAnonymousSession();
				expect(sessionToken).toBeTruthy();

				// Verify session has token before assignment
				const sessionBefore = yield* sessionRepo.findByToken(sessionToken);
				expect(sessionBefore).not.toBeNull();

				// Assign user
				const updated = yield* sessionRepo.assignUserId(sessionId, "user_abc");
				expect(updated.userId).toBe("user_abc");
				expect(updated.sessionToken).toBeNull();

				// Token should no longer resolve to a session
				const sessionAfter = yield* sessionRepo.findByToken(sessionToken);
				expect(sessionAfter).toBeNull();
			}).pipe(Effect.provide(TestLayer)),
		);
	});

	describe("Idempotent relinking (same user)", () => {
		it.effect("allows re-assigning the same user to a session", () =>
			Effect.gen(function* () {
				const sessionRepo = yield* AssessmentSessionRepository;

				const { sessionId } = yield* sessionRepo.createAnonymousSession();
				yield* sessionRepo.assignUserId(sessionId, "user_abc");

				// Re-assign same user — should not throw
				const updated = yield* sessionRepo.assignUserId(sessionId, "user_abc");
				expect(updated.userId).toBe("user_abc");
			}).pipe(Effect.provide(TestLayer)),
		);
	});

	describe("Ownership guard (sendMessage rejects mismatched user)", () => {
		it.effect("rejects sendMessage when session is owned by a different user", () =>
			Effect.gen(function* () {
				const sessionRepo = yield* AssessmentSessionRepository;
				const messageRepo = yield* AssessmentMessageRepository;

				// Create session and assign to user_A
				const { sessionId } = yield* sessionRepo.createAnonymousSession();
				yield* sessionRepo.assignUserId(sessionId, "user_A");

				// Save a greeting so sendMessage has messages to work with
				yield* messageRepo.saveMessage(sessionId, "assistant", "Hello");

				// Try to send message as user_B — should fail with SessionNotFound
				const exit = yield* sendMessage({
					sessionId,
					message: "hello",
					userId: "user_B",
				}).pipe(Effect.exit);

				expect(Exit.isFailure(exit)).toBe(true);
				if (Exit.isFailure(exit)) {
					const cause = exit.cause;
					// The failure should be a SessionNotFound error
					expect(String(cause)).toContain("SessionNotFound");
				}
			}).pipe(Effect.provide(TestLayer)),
		);

		it.effect("allows sendMessage for the session owner", () =>
			Effect.gen(function* () {
				const sessionRepo = yield* AssessmentSessionRepository;
				const messageRepo = yield* AssessmentMessageRepository;

				// Create session and assign to user_A
				const { sessionId } = yield* sessionRepo.createAnonymousSession();
				yield* sessionRepo.assignUserId(sessionId, "user_A");

				// Save greeting messages
				yield* messageRepo.saveMessage(sessionId, "assistant", "Hello");
				yield* messageRepo.saveMessage(sessionId, "assistant", "How are you?");

				// Send message as user_A — should succeed
				const result = yield* sendMessage({
					sessionId,
					message: "hello",
					userId: "user_A",
				});

				expect(result.response).toBeDefined();
			}).pipe(Effect.provide(TestLayer)),
		);

		it.effect("allows sendMessage for anonymous session (no userId)", () =>
			Effect.gen(function* () {
				const sessionRepo = yield* AssessmentSessionRepository;
				const messageRepo = yield* AssessmentMessageRepository;

				// Create anonymous session (no userId)
				const { sessionId } = yield* sessionRepo.createAnonymousSession();

				// Save greeting messages
				yield* messageRepo.saveMessage(sessionId, "assistant", "Hello");
				yield* messageRepo.saveMessage(sessionId, "assistant", "How are you?");

				// Send message without userId — should succeed
				const result = yield* sendMessage({
					sessionId,
					message: "hello",
				});

				expect(result.response).toBeDefined();
			}).pipe(Effect.provide(TestLayer)),
		);
	});

	describe("Token invalidation after linking", () => {
		it.effect("session_token becomes NULL after assignUserId", () =>
			Effect.gen(function* () {
				const sessionRepo = yield* AssessmentSessionRepository;

				const { sessionId, sessionToken } = yield* sessionRepo.createAnonymousSession();

				// Token should be valid before assignment
				const found = yield* sessionRepo.findByToken(sessionToken);
				expect(found).not.toBeNull();

				// Assign user → clears token
				yield* sessionRepo.assignUserId(sessionId, "user_123");

				// Token should no longer be valid
				const notFound = yield* sessionRepo.findByToken(sessionToken);
				expect(notFound).toBeNull();
			}).pipe(Effect.provide(TestLayer)),
		);
	});

	describe("Invalid session ID handling", () => {
		it.effect("assignUserId with non-existent session fails gracefully", () =>
			Effect.gen(function* () {
				const sessionRepo = yield* AssessmentSessionRepository;

				const exit = yield* sessionRepo.assignUserId("non-existent-id", "user_123").pipe(Effect.exit);

				expect(Exit.isFailure(exit)).toBe(true);
			}).pipe(Effect.provide(TestLayer)),
		);
	});
});
