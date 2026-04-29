/**
 * List User Sessions Use Case Tests (Story 7.13)
 *
 * Verifies session listing for authenticated users.
 */

import {
	ALL_FACETS,
	AppConfig,
	AssessmentResultRepository,
	ConversationRepository,
	type FacetName,
} from "@workspace/domain";
import { Effect, Layer, Redacted } from "effect";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { listUserSessions } from "../list-user-sessions.use-case";

const TEST_USER_ID = "user_test_123";

const mockSessionRepo = {
	createSession: vi.fn(),
	getSession: vi.fn(),
	updateSession: vi.fn(),
	getActiveSessionByUserId: vi.fn(),
	getSessionsByUserId: vi.fn(),
};

const mockResultRepo = {
	create: vi.fn(),
	getBySessionId: vi.fn(),
	getById: vi.fn(),
	update: vi.fn(),
	upsert: vi.fn(),
	updateStage: vi.fn(),
	getLatestByUserId: vi.fn(),
};

const buildAllHighFacetScores = () => {
	const facets = {} as Record<FacetName, { score: number; confidence: number }>;
	for (const facetName of ALL_FACETS) {
		facets[facetName] = { score: 20, confidence: 0.9 };
	}
	return facets;
};

const createTestLayer = () =>
	Layer.mergeAll(
		Layer.succeed(ConversationRepository, mockSessionRepo),
		Layer.succeed(AssessmentResultRepository, mockResultRepo),
		Layer.succeed(AppConfig, {
			databaseUrl: "postgres://test:test@localhost:5432/test",
			redisUrl: "redis://localhost:6379",
			anthropicApiKey: Redacted.make("test-key"),
			betterAuthSecret: Redacted.make("test-secret"),
			betterAuthUrl: "http://localhost:4000",
			frontendUrl: "http://localhost:3000",
			port: 4000,
			nodeEnv: "test",
			analyzerModelId: "claude-sonnet-4-20250514",
			analyzerMaxTokens: 2048,
			analyzerTemperature: 0.3,
			nerinModelId: "claude-haiku-4-5-20251001",
			nerinMaxTokens: 1024,
			nerinTemperature: 0.7,
			dailyCostLimit: 75,
			assessmentTurnCount: 15,
			shareMinConfidence: 70,
		}),
	);

describe("listUserSessions Use Case", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockResultRepo.getBySessionId.mockReturnValue(Effect.succeed(null));
	});

	it("should return sessions for a user with assessments", async () => {
		const mockSessions = [
			{
				id: "session-1",
				createdAt: new Date("2026-02-15"),
				updatedAt: new Date("2026-02-15"),
				status: "active",
				messageCount: 5,
			},
			{
				id: "session-2",
				createdAt: new Date("2026-02-10"),
				updatedAt: new Date("2026-02-14"),
				status: "active",
				messageCount: 15,
			},
		];

		mockSessionRepo.getSessionsByUserId.mockReturnValue(Effect.succeed(mockSessions));
		mockResultRepo.getBySessionId.mockImplementation((sessionId: string) =>
			Effect.succeed(
				sessionId === "session-2"
					? {
							id: "result-2",
							assessmentSessionId: "session-2",
							facets: buildAllHighFacetScores(),
							traits: {},
							domainCoverage: {},
							portrait: "",
							stage: "completed",
							createdAt: new Date(),
						}
					: null,
			),
		);

		const result = await Effect.runPromise(
			listUserSessions({ userId: TEST_USER_ID }).pipe(Effect.provide(createTestLayer())),
		);

		expect(result.sessions).toHaveLength(2);
		expect(result.sessions[0]?.id).toBe("session-1");
		expect(result.sessions[0]?.messageCount).toBe(5);
		expect(result.sessions[0]?.oceanCode5).toBeNull();
		expect(result.sessions[1]?.oceanCode5).toBe("OCEAN");
		expect(result.sessions[1]?.archetypeName).toBeDefined();
		expect(result.assessmentTurnCount).toBe(15);
		expect(mockSessionRepo.getSessionsByUserId).toHaveBeenCalledWith(TEST_USER_ID);
	});

	it("should return empty array for a user with no assessments", async () => {
		mockSessionRepo.getSessionsByUserId.mockReturnValue(Effect.succeed([]));

		const result = await Effect.runPromise(
			listUserSessions({ userId: TEST_USER_ID }).pipe(Effect.provide(createTestLayer())),
		);

		expect(result.sessions).toHaveLength(0);
		expect(result.assessmentTurnCount).toBe(15);
	});

	it("should propagate database errors", async () => {
		const { DatabaseError } = await import("@workspace/domain/errors/http.errors");
		mockSessionRepo.getSessionsByUserId.mockReturnValue(
			Effect.fail(new DatabaseError({ message: "Connection failed" })),
		);

		const exit = await Effect.runPromiseExit(
			listUserSessions({ userId: TEST_USER_ID }).pipe(Effect.provide(createTestLayer())),
		);

		expect(exit._tag).toBe("Failure");
	});

	it("should include assessmentTurnCount from config", async () => {
		mockSessionRepo.getSessionsByUserId.mockReturnValue(Effect.succeed([]));

		const customLayer = Layer.mergeAll(
			Layer.succeed(ConversationRepository, mockSessionRepo),
			Layer.succeed(AssessmentResultRepository, mockResultRepo),
			Layer.succeed(AppConfig, {
				databaseUrl: "postgres://test:test@localhost:5432/test",
				redisUrl: "redis://localhost:6379",
				anthropicApiKey: Redacted.make("test-key"),
				betterAuthSecret: Redacted.make("test-secret"),
				betterAuthUrl: "http://localhost:4000",
				frontendUrl: "http://localhost:3000",
				port: 4000,
				nodeEnv: "test",
				analyzerModelId: "claude-sonnet-4-20250514",
				analyzerMaxTokens: 2048,
				analyzerTemperature: 0.3,
				nerinModelId: "claude-haiku-4-5-20251001",
				nerinMaxTokens: 1024,
				nerinTemperature: 0.7,
				dailyCostLimit: 75,
				assessmentTurnCount: 30,
				shareMinConfidence: 70,
			}),
		);

		const result = await Effect.runPromise(
			listUserSessions({ userId: TEST_USER_ID }).pipe(Effect.provide(customLayer)),
		);

		expect(result.assessmentTurnCount).toBe(30);
	});
});
