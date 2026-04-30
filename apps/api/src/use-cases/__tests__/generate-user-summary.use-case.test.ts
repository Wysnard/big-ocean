/**
 * Generate UserSummary use case (Story 7.1)
 */

import { vi } from "vitest";

vi.mock("@workspace/infrastructure/repositories/assessment-result.drizzle.repository");
vi.mock("@workspace/infrastructure/repositories/conversation-evidence.drizzle.repository");
vi.mock("@workspace/infrastructure/repositories/user-summary.drizzle.repository");

import { describe, expect, it } from "@effect/vitest";
import { LoggerRepository } from "@workspace/domain";
import type { ConversationEvidenceRecord } from "@workspace/domain/repositories/conversation-evidence.repository";
import {
	AssessmentResultDrizzleRepositoryLive,
	_resetMockState as resetResults,
	_seedResult as seedResult,
} from "@workspace/infrastructure/repositories/assessment-result.drizzle.repository";
import {
	ConversationEvidenceDrizzleRepositoryLive,
	_resetMockState as resetConversationEvidence,
	_seedEvidence as seedConversationEvidence,
} from "@workspace/infrastructure/repositories/conversation-evidence.drizzle.repository";
import {
	_getUserSummaryByResultId as getUserSummaryByResultId,
	_resetUserSummaryMockState as resetUserSummary,
	UserSummaryDrizzleRepositoryLive,
} from "@workspace/infrastructure/repositories/user-summary.drizzle.repository";
import { UserSummaryGeneratorMockRepositoryLive } from "@workspace/infrastructure/repositories/user-summary-generator.mock.repository";
import { Effect, Layer } from "effect";
import type { AuthenticatedConversation } from "../authenticated-conversation/access";
import { generateUserSummary } from "../generate-user-summary.use-case";

const mockLoggerRepo = {
	info: vi.fn(),
	error: vi.fn(),
	warn: vi.fn(),
	debug: vi.fn(),
};

const makeEvidence = (sessionId: string): ConversationEvidenceRecord[] => [
	{
		id: crypto.randomUUID(),
		sessionId,
		messageId: "m1",
		exchangeId: "e1",
		bigfiveFacet: "imagination",
		deviation: 1,
		strength: "moderate",
		confidence: "medium",
		domain: "work",
		polarity: "high",
		note: "creative spark",
		createdAt: new Date(),
	},
];

const makeConversation = (
	sessionId: string,
	parentConversationId: string | null = null,
): AuthenticatedConversation => ({
	policy: "owned-session",
	session: {
		id: sessionId,
		userId: "user_1",
		createdAt: new Date(),
		updatedAt: new Date(),
		status: "completed",
		finalizationProgress: "completed",
		messageCount: 12,
		parentConversationId,
	},
});

const testLayer = Layer.mergeAll(
	Layer.succeed(LoggerRepository, mockLoggerRepo),
	AssessmentResultDrizzleRepositoryLive,
	ConversationEvidenceDrizzleRepositoryLive,
	UserSummaryDrizzleRepositoryLive,
	UserSummaryGeneratorMockRepositoryLive,
);

describe("generateUserSummary", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		resetResults();
		resetConversationEvidence();
		resetUserSummary();
		mockLoggerRepo.info.mockImplementation(() => {});
	});

	it.effect("persists summary with version 1 on first run", () =>
		Effect.gen(function* () {
			const seeded = seedResult("session_abc", {
				stage: "scored",
				facets: {
					imagination: { score: 60, confidence: 0.5 },
				} as never,
				traits: {} as never,
				domainCoverage: {} as never,
			});
			seedConversationEvidence(makeEvidence("session_abc"));

			yield* generateUserSummary({ conversation: makeConversation("session_abc") });

			expect(mockLoggerRepo.info).toHaveBeenCalledWith(
				"User summary: persisted",
				expect.objectContaining({ sessionId: "session_abc" }),
			);

			const stored = getUserSummaryByResultId(seeded.id);
			expect(stored).not.toBeNull();
			expect(stored?.version).toBe(1);
			expect(stored?.userId).toBe("user_1");
			expect(stored?.assessmentResultId).toBe(seeded.id);
		}).pipe(Effect.provide(testLayer)),
	);

	it.effect("skips when summary already exists", () =>
		Effect.gen(function* () {
			const seeded = seedResult("session_abc", {
				stage: "scored",
				facets: { imagination: { score: 60, confidence: 0.5 } } as never,
				traits: {} as never,
				domainCoverage: {} as never,
			});
			seedConversationEvidence(makeEvidence("session_abc"));

			yield* generateUserSummary({ conversation: makeConversation("session_abc") });
			vi.clearAllMocks();
			mockLoggerRepo.info.mockImplementation(() => {});

			yield* generateUserSummary({ conversation: makeConversation("session_abc") });

			expect(mockLoggerRepo.info).toHaveBeenCalledWith(
				"User summary: already exists for assessment result, skipping generation",
				expect.objectContaining({ assessmentResultId: seeded.id }),
			);
		}).pipe(Effect.provide(testLayer)),
	);

	it.effect(
		"conversation extension bumps version and ties new row to extension result (ADR-55)",
		() =>
			Effect.gen(function* () {
				const parentSeeded = seedResult("session_parent", {
					stage: "scored",
					facets: { imagination: { score: 55, confidence: 0.5 } } as never,
					traits: {} as never,
					domainCoverage: {} as never,
				});
				seedConversationEvidence(makeEvidence("session_parent"));
				yield* generateUserSummary({ conversation: makeConversation("session_parent") });

				const extSeeded = seedResult("session_ext", {
					stage: "scored",
					facets: { imagination: { score: 58, confidence: 0.55 } } as never,
					traits: {} as never,
					domainCoverage: {} as never,
				});
				seedConversationEvidence(makeEvidence("session_ext"));

				yield* generateUserSummary({
					conversation: makeConversation("session_ext", "session_parent"),
				});

				const parentStored = getUserSummaryByResultId(parentSeeded.id);
				const extStored = getUserSummaryByResultId(extSeeded.id);
				expect(parentStored?.version).toBe(1);
				expect(extStored?.version).toBe(2);
				expect(extStored?.assessmentResultId).toBe(extSeeded.id);
				expect(extStored?.refreshSource).toBe("conversation_extension");
			}).pipe(Effect.provide(testLayer)),
	);
});
