/**
 * Get Relationship State Use Case Tests (Story 34-1 — QR Token Model)
 */

import { vi } from "vitest";

vi.mock("@workspace/infrastructure/repositories/qr-token.drizzle.repository");
vi.mock("@workspace/infrastructure/repositories/relationship-analysis.drizzle.repository");

import { beforeEach, describe, expect, it } from "@effect/vitest";
import {
	PurchaseEventRepository,
	QrTokenRepository,
	RelationshipAnalysisRepository,
} from "@workspace/domain";
import {
	QrTokenDrizzleRepositoryLive,
	_resetMockState as resetQrMock,
} from "@workspace/infrastructure/repositories/qr-token.drizzle.repository";
import {
	RelationshipAnalysisDrizzleRepositoryLive,
	_resetMockState as resetAnalysisMock,
} from "@workspace/infrastructure/repositories/relationship-analysis.drizzle.repository";
import { Effect, Layer } from "effect";
import { getRelationshipState } from "../get-relationship-state.use-case";

const TEST_USER_ID = "user-123";

const mockPurchaseRepo = {
	getCapabilities: vi.fn(),
	insertEvent: vi.fn(),
	getByCheckoutId: vi.fn(),
	getByUserId: vi.fn(),
};

const TestLayer = Layer.mergeAll(
	QrTokenDrizzleRepositoryLive,
	RelationshipAnalysisDrizzleRepositoryLive,
	Layer.succeed(PurchaseEventRepository, mockPurchaseRepo),
);

describe("getRelationshipState Use Case (Story 34-1)", () => {
	beforeEach(() => {
		resetQrMock();
		resetAnalysisMock();
		vi.clearAllMocks();

		mockPurchaseRepo.getCapabilities.mockReturnValue(
			Effect.succeed({ availableCredits: 0, hasPortrait: false, canExtend: false }),
		);
	});

	it.effect("returns no-credits when user has no credits and no tokens", () =>
		Effect.gen(function* () {
			const result = yield* getRelationshipState(TEST_USER_ID);
			expect(result._tag).toBe("no-credits");
		}).pipe(Effect.provide(TestLayer)),
	);

	it.effect("returns invite-prompt when user has credits", () =>
		Effect.gen(function* () {
			mockPurchaseRepo.getCapabilities.mockReturnValue(
				Effect.succeed({ availableCredits: 2, hasPortrait: false, canExtend: false }),
			);

			const result = yield* getRelationshipState(TEST_USER_ID);
			expect(result._tag).toBe("invite-prompt");
			if (result._tag === "invite-prompt") {
				expect(result.availableCredits).toBe(2);
			}
		}).pipe(Effect.provide(TestLayer)),
	);

	it.effect("returns qr-active when user has an active QR token", () =>
		Effect.gen(function* () {
			const qrRepo = yield* QrTokenRepository;
			yield* qrRepo.generate(TEST_USER_ID);

			const result = yield* getRelationshipState(TEST_USER_ID);
			expect(result._tag).toBe("qr-active");
		}).pipe(Effect.provide(TestLayer)),
	);

	it.effect("returns generating when analysis has null content", () =>
		Effect.gen(function* () {
			const analysisRepo = yield* RelationshipAnalysisRepository;
			yield* analysisRepo.insertPlaceholder({
				userAId: TEST_USER_ID,
				userBId: "user-456",
				userAResultId: "result-1",
				userBResultId: "result-2",
			});

			const result = yield* getRelationshipState(TEST_USER_ID);
			expect(result._tag).toBe("generating");
		}).pipe(Effect.provide(TestLayer)),
	);
});
