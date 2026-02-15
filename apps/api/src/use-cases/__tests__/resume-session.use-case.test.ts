/**
 * Resume Session Use Case Tests
 *
 * Verifies session ownership behavior for linked vs anonymous sessions.
 */

import {
	AppConfig,
	AssessmentMessageRepository,
	AssessmentSessionRepository,
	FacetEvidenceRepository,
	LoggerRepository,
} from "@workspace/domain";
import { Effect, Layer, Redacted } from "effect";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { resumeSession } from "../resume-session.use-case";

const TEST_SESSION_ID = "session_resume_test_123";

const mockSessionRepo = {
	createSession: vi.fn(),
	getSession: vi.fn(),
	updateSession: vi.fn(),
};

const mockMessageRepo = {
	saveMessage: vi.fn(),
	getMessages: vi.fn(),
	getMessageCount: vi.fn(),
};

const mockEvidenceRepo = {
	saveEvidence: vi.fn(),
	getEvidenceByMessage: vi.fn(),
	getEvidenceByFacet: vi.fn(),
	getEvidenceBySession: vi.fn(),
};

const mockLogger = {
	info: vi.fn(),
	warn: vi.fn(),
	error: vi.fn(),
	debug: vi.fn(),
};

const createTestLayer = () =>
	Layer.mergeAll(
		Layer.succeed(AssessmentSessionRepository, mockSessionRepo),
		Layer.succeed(AssessmentMessageRepository, mockMessageRepo),
		Layer.succeed(FacetEvidenceRepository, mockEvidenceRepo),
		Layer.succeed(LoggerRepository, mockLogger),
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
			freeTierMessageThreshold: 15,
			shareMinConfidence: 70,
		}),
	);

describe("resumeSession Use Case", () => {
	beforeEach(() => {
		vi.clearAllMocks();

		mockSessionRepo.getSession.mockReturnValue(
			Effect.succeed({
				id: TEST_SESSION_ID,
				userId: null,
				createdAt: new Date(),
				updatedAt: new Date(),
				status: "active",
				messageCount: 2,
			}),
		);
		mockMessageRepo.getMessages.mockReturnValue(
			Effect.succeed([
				{
					id: "msg_1",
					sessionId: TEST_SESSION_ID,
					role: "assistant",
					content: "Welcome back!",
					createdAt: new Date(),
				},
			]),
		);
		mockEvidenceRepo.getEvidenceBySession.mockReturnValue(Effect.succeed([]));
		mockLogger.info.mockImplementation(() => {});
		mockLogger.warn.mockImplementation(() => {});
		mockLogger.error.mockImplementation(() => {});
		mockLogger.debug.mockImplementation(() => {});
	});

	it("allows anonymous pre-link sessions to resume without authentication", async () => {
		const result = await Effect.runPromise(
			resumeSession({ sessionId: TEST_SESSION_ID }).pipe(Effect.provide(createTestLayer())),
		);

		expect(result.messages).toHaveLength(1);
		expect(result.freeTierMessageThreshold).toBe(15);
		expect(mockMessageRepo.getMessages).toHaveBeenCalledWith(TEST_SESSION_ID);
		expect(mockEvidenceRepo.getEvidenceBySession).toHaveBeenCalledWith(TEST_SESSION_ID);
	});

	it("allows linked session owner to resume", async () => {
		mockSessionRepo.getSession.mockReturnValue(
			Effect.succeed({
				id: TEST_SESSION_ID,
				userId: "owner_user",
				createdAt: new Date(),
				updatedAt: new Date(),
				status: "active",
				messageCount: 2,
			}),
		);

		const result = await Effect.runPromise(
			resumeSession({
				sessionId: TEST_SESSION_ID,
				authenticatedUserId: "owner_user",
			}).pipe(Effect.provide(createTestLayer())),
		);

		expect(result.messages).toHaveLength(1);
		expect(mockMessageRepo.getMessages).toHaveBeenCalledWith(TEST_SESSION_ID);
	});

	it("denies linked session for non-owner before loading messages", async () => {
		mockSessionRepo.getSession.mockReturnValue(
			Effect.succeed({
				id: TEST_SESSION_ID,
				userId: "owner_user",
				createdAt: new Date(),
				updatedAt: new Date(),
				status: "active",
				messageCount: 2,
			}),
		);

		const error = await Effect.runPromise(
			resumeSession({
				sessionId: TEST_SESSION_ID,
				authenticatedUserId: "other_user",
			}).pipe(Effect.provide(createTestLayer()), Effect.flip),
		);

		expect(error._tag).toBe("SessionNotFound");
		expect(mockMessageRepo.getMessages).not.toHaveBeenCalled();
		expect(mockEvidenceRepo.getEvidenceBySession).not.toHaveBeenCalled();
	});

	it("denies linked session when unauthenticated", async () => {
		mockSessionRepo.getSession.mockReturnValue(
			Effect.succeed({
				id: TEST_SESSION_ID,
				userId: "owner_user",
				createdAt: new Date(),
				updatedAt: new Date(),
				status: "active",
				messageCount: 2,
			}),
		);

		const error = await Effect.runPromise(
			resumeSession({ sessionId: TEST_SESSION_ID }).pipe(
				Effect.provide(createTestLayer()),
				Effect.flip,
			),
		);

		expect(error._tag).toBe("SessionNotFound");
		expect(mockMessageRepo.getMessages).not.toHaveBeenCalled();
		expect(mockEvidenceRepo.getEvidenceBySession).not.toHaveBeenCalled();
	});
});
