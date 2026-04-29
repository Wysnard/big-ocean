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
	mockProfileRepo,
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
					userId: "owner_user",
					createdAt: new Date(),
					updatedAt: new Date(),
					status: "active",
					messageCount: 10,
				}),
			);

			const error = await Effect.runPromise(
				getResults({ sessionId: TEST_SESSION_ID, authenticatedUserId: "owner_user" }).pipe(
					Effect.provide(createTestLayer()),
					Effect.flip,
				),
			);

			expect(error._tag).toBe("SessionNotCompleted");
			expect(mockResultRepo.getBySessionId).not.toHaveBeenCalled();
		});

		it("should fail with SessionNotCompleted when session is finalizing", async () => {
			mockSessionRepo.getSession.mockImplementation((_sessionId: string) =>
				Effect.succeed({
					id: TEST_SESSION_ID,
					sessionId: TEST_SESSION_ID,
					userId: "owner_user",
					createdAt: new Date(),
					updatedAt: new Date(),
					status: "finalizing",
					messageCount: 10,
				}),
			);

			const error = await Effect.runPromise(
				getResults({ sessionId: TEST_SESSION_ID, authenticatedUserId: "owner_user" }).pipe(
					Effect.provide(createTestLayer()),
					Effect.flip,
				),
			);

			expect(error._tag).toBe("SessionNotCompleted");
			expect(mockResultRepo.getBySessionId).not.toHaveBeenCalled();
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

		it("should fail with AssessmentResultsNotReady when assessment result is missing", async () => {
			mockResultRepo.getBySessionId.mockImplementation(() => Effect.succeed(null));

			const error = await Effect.runPromise(
				getResults({ sessionId: TEST_SESSION_ID, authenticatedUserId: "owner_user" }).pipe(
					Effect.provide(createTestLayer()),
					Effect.flip,
				),
			);

			expect(error._tag).toBe("AssessmentResultsNotReady");
			expect(mockResultRepo.getBySessionId).toHaveBeenCalledWith(TEST_SESSION_ID);
		});

		it("should fail with AssessmentResultsNotReady when assessment result is not stage=completed", async () => {
			mockResultRepo.getBySessionId.mockImplementation(() =>
				Effect.succeed({
					id: "ar_test",
					assessmentSessionId: TEST_SESSION_ID,
					facets: {},
					traits: {},
					domainCoverage: {},
					portrait: "",
					stage: "scored",
					createdAt: new Date(),
				}),
			);

			const error = await Effect.runPromise(
				getResults({ sessionId: TEST_SESSION_ID, authenticatedUserId: "owner_user" }).pipe(
					Effect.provide(createTestLayer()),
					Effect.flip,
				),
			);

			expect(error._tag).toBe("AssessmentResultsNotReady");
		});

		it("should fail with PublicProfileNotProvisioned when profile row is missing", async () => {
			mockProfileRepo.getProfileBySessionId.mockImplementation(() => Effect.succeed(null));

			const error = await Effect.runPromise(
				getResults({ sessionId: TEST_SESSION_ID, authenticatedUserId: "owner_user" }).pipe(
					Effect.provide(createTestLayer()),
					Effect.flip,
				),
			);

			expect(error._tag).toBe("PublicProfileNotProvisioned");
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
				getResults({ sessionId: "nonexistent_session", authenticatedUserId: "owner_user" }).pipe(
					Effect.provide(createTestLayer()),
					Effect.flip,
				),
			);

			expect(error._tag).toBe("SessionNotFound");
		});
	});
});
