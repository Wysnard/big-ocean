/**
 * Shared fixtures for start-assessment use-case tests.
 *
 * Extracted from start-assessment.use-case.test.ts — no logic changes.
 */

import {
	AssessmentMessageRepository,
	AssessmentSessionRepository,
	CostGuardRepository,
	LoggerRepository,
} from "@workspace/domain";
import { Effect, Layer } from "effect";
import { vi } from "vitest";

// Define mock repo objects locally with vi.fn() for spy access
export const mockAssessmentSessionRepo = {
	createSession: vi.fn(),
	getActiveSessionByUserId: vi.fn(),
	getSession: vi.fn(),
	updateSession: vi.fn(),
	getSessionsByUserId: vi.fn(),
	findSessionByUserId: vi.fn(),
	createAnonymousSession: vi.fn(),
	findByToken: vi.fn(),
	assignUserId: vi.fn(),
	rotateToken: vi.fn(),
};

export const mockAssessmentMessageRepo = {
	saveMessage: vi.fn(),
	getMessages: vi.fn(),
	getMessageCount: vi.fn(),
};

export const mockLoggerRepo = {
	info: vi.fn(),
	error: vi.fn(),
	warn: vi.fn(),
	debug: vi.fn(),
};

export const mockCostGuardRepo = {
	incrementDailyCost: vi.fn(),
	getDailyCost: vi.fn(),
	incrementAssessmentCount: vi.fn(),
	getAssessmentCount: vi.fn(),
	canStartAssessment: vi.fn(),
	recordAssessmentStart: vi.fn(),
};

export let saveMessageCallCount = 0;

export function resetSaveMessageCallCount() {
	saveMessageCallCount = 0;
}

export const createTestLayer = () =>
	Layer.mergeAll(
		Layer.succeed(AssessmentSessionRepository, mockAssessmentSessionRepo),
		Layer.succeed(AssessmentMessageRepository, mockAssessmentMessageRepo),
		Layer.succeed(LoggerRepository, mockLoggerRepo),
		Layer.succeed(CostGuardRepository, mockCostGuardRepo),
	);

/**
 * Set up default mock behaviors. Call in beforeEach().
 */
export function setupDefaultMocks() {
	saveMessageCallCount = 0;

	mockAssessmentSessionRepo.createSession.mockImplementation((userId?: string) =>
		Effect.succeed({
			sessionId: "session_new_789",
			userId,
			createdAt: new Date("2026-02-01T10:00:00Z"),
		}),
	);
	mockAssessmentSessionRepo.getActiveSessionByUserId.mockImplementation(() => Effect.succeed(null));
	mockAssessmentSessionRepo.getSessionsByUserId.mockImplementation(() => Effect.succeed([]));
	mockAssessmentSessionRepo.findSessionByUserId.mockImplementation(() => Effect.succeed(null));
	mockAssessmentSessionRepo.getSession.mockImplementation(() => Effect.succeed(undefined));
	mockAssessmentSessionRepo.updateSession.mockImplementation(() => Effect.succeed(undefined));
	mockAssessmentSessionRepo.createAnonymousSession.mockImplementation(() =>
		Effect.succeed({
			sessionId: "session_anon_123",
			sessionToken: "mock_token_abc123def456",
		}),
	);
	mockAssessmentSessionRepo.findByToken.mockImplementation(() => Effect.succeed(null));
	mockAssessmentSessionRepo.assignUserId.mockImplementation(() => Effect.succeed(undefined));
	mockAssessmentSessionRepo.rotateToken.mockImplementation(() =>
		Effect.succeed({ sessionToken: "new_token" }),
	);

	mockAssessmentMessageRepo.saveMessage.mockImplementation(
		(sessionId: string, role: string, content: string) => {
			saveMessageCallCount++;
			return Effect.succeed({
				id: `msg-${saveMessageCallCount}`,
				sessionId,
				role,
				content,
				createdAt: new Date("2026-02-01T10:00:00Z"),
			});
		},
	);
	mockAssessmentMessageRepo.getMessages.mockImplementation(() => Effect.succeed([]));
	mockAssessmentMessageRepo.getMessageCount.mockImplementation(() => Effect.succeed(0));

	mockLoggerRepo.info.mockImplementation(() => {});
	mockLoggerRepo.error.mockImplementation(() => {});
	mockLoggerRepo.warn.mockImplementation(() => {});
	mockLoggerRepo.debug.mockImplementation(() => {});

	mockCostGuardRepo.canStartAssessment.mockImplementation(() => Effect.succeed(true));
	mockCostGuardRepo.recordAssessmentStart.mockImplementation(() => Effect.succeed(undefined));
	mockCostGuardRepo.incrementDailyCost.mockImplementation(() => Effect.succeed(0));
	mockCostGuardRepo.getDailyCost.mockImplementation(() => Effect.succeed(0));
	mockCostGuardRepo.incrementAssessmentCount.mockImplementation(() => Effect.succeed(0));
	mockCostGuardRepo.getAssessmentCount.mockImplementation(() => Effect.succeed(0));
}
