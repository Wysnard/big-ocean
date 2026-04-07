/**
 * Accept QR Invitation Use Case Tests (Story 34-1)
 */

import { vi } from "vitest";

vi.mock("@workspace/infrastructure/repositories/qr-token.drizzle.repository");
vi.mock("@workspace/infrastructure/repositories/relationship-analysis.drizzle.repository");

import { beforeEach, describe, expect, it } from "@effect/vitest";
import {
	AssessmentResultRepository,
	ConversationRepository,
	PurchaseEventRepository,
	QrTokenRepository,
} from "@workspace/domain";
import {
	QrTokenDrizzleRepositoryLive,
	_resetMockState as resetQrMock,
} from "@workspace/infrastructure/repositories/qr-token.drizzle.repository";
import {
	RelationshipAnalysisDrizzleRepositoryLive,
	_resetMockState as resetAnalysisMock,
} from "@workspace/infrastructure/repositories/relationship-analysis.drizzle.repository";
import { Effect, Exit, Layer } from "effect";
import { acceptQrInvitation } from "../accept-qr-invitation.use-case";

const GENERATOR_USER_ID = "generator-user-1";
const ACCEPTOR_USER_ID = "acceptor-user-2";

const mockPurchaseRepo = {
	getCapabilities: vi.fn(),
	insertEvent: vi.fn(),
	getByCheckoutId: vi.fn(),
	getByUserId: vi.fn(),
};

const mockSessionRepo = {
	create: vi.fn(),
	getById: vi.fn(),
	updateStatus: vi.fn(),
	updateMessageCount: vi.fn(),
	updateUserId: vi.fn(),
	findSessionByUserId: vi.fn(),
	createAnonymousSession: vi.fn(),
	getByAnonymousToken: vi.fn(),
	updateOceanCodeAndArchetype: vi.fn(),
	getSessionsByUserId: vi.fn(),
};

const mockResultRepo = {
	getBySessionId: vi.fn(),
	getByUserId: vi.fn(),
	upsert: vi.fn(),
	getById: vi.fn(),
	delete: vi.fn(),
};

const TestLayer = Layer.mergeAll(
	QrTokenDrizzleRepositoryLive,
	RelationshipAnalysisDrizzleRepositoryLive,
	Layer.succeed(PurchaseEventRepository, mockPurchaseRepo),
	Layer.succeed(ConversationRepository, mockSessionRepo),
	Layer.succeed(AssessmentResultRepository, mockResultRepo),
);

describe("acceptQrInvitation Use Case (Story 34-1)", () => {
	beforeEach(() => {
		resetQrMock();
		resetAnalysisMock();
		vi.clearAllMocks();

		// Default successful mocks
		mockPurchaseRepo.getCapabilities.mockReturnValue(
			Effect.succeed({ availableCredits: 3, hasPortrait: false, canExtend: false }),
		);
		mockPurchaseRepo.insertEvent.mockReturnValue(Effect.succeed(undefined));
		mockSessionRepo.findSessionByUserId.mockImplementation((userId: string) =>
			Effect.succeed({ id: `session-${userId}`, status: "completed" }),
		);
		mockResultRepo.getBySessionId.mockImplementation((sessionId: string) =>
			Effect.succeed({ id: `result-${sessionId}`, facets: {} }),
		);
	});

	it.effect("accepts QR token, consumes credit, and creates analysis placeholder", () =>
		Effect.gen(function* () {
			const qrRepo = yield* QrTokenRepository;

			// Generate a token for the generator user
			const token = yield* qrRepo.generate(GENERATOR_USER_ID);

			// Accept it as the acceptor
			const result = yield* acceptQrInvitation({
				token: token.token,
				acceptedByUserId: ACCEPTOR_USER_ID,
			});

			expect(result.analysisId).toBeDefined();

			// Verify credit was consumed
			expect(mockPurchaseRepo.insertEvent).toHaveBeenCalledWith(
				expect.objectContaining({
					userId: ACCEPTOR_USER_ID,
					eventType: "credit_consumed",
				}),
			);

			// Verify token was accepted
			const status = yield* qrRepo.getStatus(token.token);
			expect(status).toBe("accepted");
		}).pipe(Effect.provide(TestLayer)),
	);

	it.effect("fails with InsufficientCreditsError when no credits", () =>
		Effect.gen(function* () {
			const qrRepo = yield* QrTokenRepository;
			const token = yield* qrRepo.generate(GENERATOR_USER_ID);

			mockPurchaseRepo.getCapabilities.mockReturnValue(
				Effect.succeed({ availableCredits: 0, hasPortrait: false, canExtend: false }),
			);

			const exit = yield* Effect.exit(
				acceptQrInvitation({
					token: token.token,
					acceptedByUserId: ACCEPTOR_USER_ID,
				}),
			);

			expect(Exit.isFailure(exit)).toBe(true);
			if (Exit.isFailure(exit)) {
				const cause = exit.cause;
				const error = cause._tag === "Fail" ? cause.error : null;
				expect((error as { _tag: string })._tag).toBe("InsufficientCreditsError");
			}
		}).pipe(Effect.provide(TestLayer)),
	);

	it.effect("fails with SelfInvitationError when accepting own token", () =>
		Effect.gen(function* () {
			const qrRepo = yield* QrTokenRepository;
			const token = yield* qrRepo.generate(GENERATOR_USER_ID);

			const exit = yield* Effect.exit(
				acceptQrInvitation({
					token: token.token,
					acceptedByUserId: GENERATOR_USER_ID,
				}),
			);

			expect(Exit.isFailure(exit)).toBe(true);
			if (Exit.isFailure(exit)) {
				const cause = exit.cause;
				const error = cause._tag === "Fail" ? cause.error : null;
				expect((error as { _tag: string })._tag).toBe("SelfInvitationError");
			}
		}).pipe(Effect.provide(TestLayer)),
	);
});
