/**
 * Rate Portrait Use Case Tests (Story 19-2)
 *
 * Tests:
 * - Successful rating insertion
 * - Session not found error
 * - Session ownership validation
 */

import { describe, expect, it } from "@effect/vitest";
import {
	AssessmentSessionRepository,
	PortraitRatingRepository,
	SessionNotFound,
	Unauthorized,
} from "@workspace/domain";
import { Effect, Exit, Layer } from "effect";
import { vi } from "vitest";
import { ratePortrait } from "../rate-portrait.use-case";

const mockSessionRepo = {
	createSession: vi.fn(),
	getSession: vi.fn(),
	getActiveSessionByUserId: vi.fn(),
	getSessionsByUserId: vi.fn(),
	updateSession: vi.fn(),
	claimAnonymousSession: vi.fn(),
	acquireProcessingLock: vi.fn(),
	createAnonymousSession: vi.fn(),
};

const mockRatingRepo = {
	insertRating: vi.fn(),
};

const TestLayer = Layer.mergeAll(
	Layer.succeed(AssessmentSessionRepository, mockSessionRepo),
	Layer.succeed(PortraitRatingRepository, mockRatingRepo),
);

const validInput = {
	userId: "user_123",
	assessmentSessionId: "session_456",
	portraitType: "full" as const,
	rating: "up" as const,
	depthSignal: "rich" as const,
	evidenceCount: 42,
};

const mockSession = {
	id: "session_456",
	userId: "user_123",
	status: "completed",
	messageCount: 25,
	createdAt: new Date(),
	updatedAt: new Date(),
	sessionToken: null,
	finalizationProgress: null,
};

describe("ratePortrait", () => {
	it.effect("should insert a rating successfully", () =>
		Effect.gen(function* () {
			const expectedRecord = {
				id: "rating_789",
				...validInput,
				createdAt: new Date(),
			};

			mockSessionRepo.getSession.mockReturnValue(Effect.succeed(mockSession));
			mockRatingRepo.insertRating.mockReturnValue(Effect.succeed(expectedRecord));

			const result = yield* ratePortrait(validInput);

			expect(result.id).toBe("rating_789");
			expect(result.portraitType).toBe("full");
			expect(result.rating).toBe("up");
		}).pipe(Effect.provide(TestLayer)),
	);

	it.effect("should fail with SessionNotFound when session does not exist", () =>
		Effect.gen(function* () {
			mockSessionRepo.getSession.mockReturnValue(
				Effect.fail(new SessionNotFound({ sessionId: "session_456", message: "Not found" })),
			);

			const exit = yield* Effect.exit(ratePortrait(validInput));

			expect(Exit.isFailure(exit)).toBe(true);
			if (Exit.isFailure(exit)) {
				const cause = exit.cause;
				const failure = cause._tag === "Fail" ? cause.error : null;
				expect(failure).toBeInstanceOf(SessionNotFound);
			}
		}).pipe(Effect.provide(TestLayer)),
	);

	it.effect("should fail with Unauthorized when session belongs to different user", () =>
		Effect.gen(function* () {
			const otherUserSession = { ...mockSession, userId: "other_user" };
			mockSessionRepo.getSession.mockReturnValue(Effect.succeed(otherUserSession));

			const exit = yield* Effect.exit(ratePortrait(validInput));

			expect(Exit.isFailure(exit)).toBe(true);
			if (Exit.isFailure(exit)) {
				const cause = exit.cause;
				const failure = cause._tag === "Fail" ? cause.error : null;
				expect(failure).toBeInstanceOf(Unauthorized);
			}
		}).pipe(Effect.provide(TestLayer)),
	);
});
