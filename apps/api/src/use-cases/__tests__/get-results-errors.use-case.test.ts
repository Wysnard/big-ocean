/**
 * Get Results Use Case Tests — Error handling
 *
 * Tests error scenarios: session not found, not completed, ownership checks.
 * After Story 11.1, get-results is read-only — no lazy finalization or portrait generation.
 */

import { SessionNotFound } from "@workspace/domain";
import { Effect } from "effect";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getResults } from "../get-results.use-case";
import {
	createTestLayer,
	mockResultRepo,
	mockSessionRepo,
	setupDefaultMocks,
	TEST_SESSION_ID,
} from "./__fixtures__/get-results.fixtures";

describe("getResults Use Case", () => {
	beforeEach(() => {
		setupDefaultMocks();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe("Error handling", () => {
		it("should fail with SessionNotCompleted when session is not completed", async () => {
			mockSessionRepo.getSession.mockImplementation((_sessionId: string) =>
				Effect.succeed({
					id: TEST_SESSION_ID,
					sessionId: TEST_SESSION_ID,
					userId: null,
					createdAt: new Date(),
					updatedAt: new Date(),
					status: "active",
					messageCount: 10,
					personalDescription: null,
				}),
			);

			const error = await Effect.runPromise(
				getResults({ sessionId: TEST_SESSION_ID }).pipe(Effect.provide(createTestLayer()), Effect.flip),
			);

			expect(error._tag).toBe("SessionNotCompleted");
			expect(mockResultRepo.getBySessionId).not.toHaveBeenCalled();
		});

		it("should fail with SessionNotCompleted when session is finalizing", async () => {
			mockSessionRepo.getSession.mockImplementation((_sessionId: string) =>
				Effect.succeed({
					id: TEST_SESSION_ID,
					sessionId: TEST_SESSION_ID,
					userId: null,
					createdAt: new Date(),
					updatedAt: new Date(),
					status: "finalizing",
					messageCount: 10,
					personalDescription: null,
				}),
			);

			const error = await Effect.runPromise(
				getResults({ sessionId: TEST_SESSION_ID }).pipe(Effect.provide(createTestLayer()), Effect.flip),
			);

			expect(error._tag).toBe("SessionNotCompleted");
		});

		it("should fail with SessionNotFound when linked session is accessed by non-owner", async () => {
			mockSessionRepo.getSession.mockImplementation((_sessionId: string) =>
				Effect.succeed({
					id: TEST_SESSION_ID,
					sessionId: TEST_SESSION_ID,
					userId: "owner_user",
					createdAt: new Date(),
					updatedAt: new Date(),
					status: "completed",
					messageCount: 10,
					personalDescription: null,
				}),
			);

			const error = await Effect.runPromise(
				getResults({ sessionId: TEST_SESSION_ID, authenticatedUserId: "another_user" }).pipe(
					Effect.provide(createTestLayer()),
					Effect.flip,
				),
			);

			expect(error._tag).toBe("SessionNotFound");
			expect(mockResultRepo.getBySessionId).not.toHaveBeenCalled();
		});

		it("should fail with SessionNotFound when linked session is accessed without authentication", async () => {
			mockSessionRepo.getSession.mockImplementation((_sessionId: string) =>
				Effect.succeed({
					id: TEST_SESSION_ID,
					sessionId: TEST_SESSION_ID,
					userId: "owner_user",
					createdAt: new Date(),
					updatedAt: new Date(),
					status: "completed",
					messageCount: 10,
					personalDescription: null,
				}),
			);

			const error = await Effect.runPromise(
				getResults({ sessionId: TEST_SESSION_ID }).pipe(Effect.provide(createTestLayer()), Effect.flip),
			);

			expect(error._tag).toBe("SessionNotFound");
			expect(mockResultRepo.getBySessionId).not.toHaveBeenCalled();
		});

		it("should allow linked session access for owner", async () => {
			mockSessionRepo.getSession.mockImplementation((_sessionId: string) =>
				Effect.succeed({
					id: TEST_SESSION_ID,
					sessionId: TEST_SESSION_ID,
					userId: "owner_user",
					createdAt: new Date(),
					updatedAt: new Date(),
					status: "completed",
					messageCount: 10,
					personalDescription: null,
				}),
			);
			const result = await Effect.runPromise(
				getResults({ sessionId: TEST_SESSION_ID, authenticatedUserId: "owner_user" }).pipe(
					Effect.provide(createTestLayer()),
				),
			);

			expect(result.oceanCode5).toBeDefined();
			expect(mockResultRepo.getBySessionId).toHaveBeenCalledWith(TEST_SESSION_ID);
		});

		it("should fail with SessionNotFound when session does not exist", async () => {
			mockSessionRepo.getSession.mockImplementation((sessionId: string) =>
				Effect.fail(
					new SessionNotFound({
						sessionId,
						message: "Session not found",
					}),
				),
			);

			const error = await Effect.runPromise(
				getResults({ sessionId: "nonexistent_session" }).pipe(
					Effect.provide(createTestLayer()),
					Effect.flip,
				),
			);

			expect(error._tag).toBe("SessionNotFound");
		});
	});
});
