/**
 * Create Invitation Use Case Tests (Story 14.2)
 *
 * Validates credit check, atomic creation, shareUrl, and expiry.
 */

import { vi } from "vitest";

vi.mock("@workspace/infrastructure/repositories/purchase-event.drizzle.repository");
vi.mock("@workspace/infrastructure/repositories/relationship-invitation.drizzle.repository");
vi.mock("@workspace/domain/config/app-config");

import { beforeEach, describe, expect, it } from "@effect/vitest";
import {
	AppConfig,
	INVITATION_EXPIRY_DAYS,
	PurchaseEventRepository,
	RelationshipInvitationRepository,
} from "@workspace/domain";
import { createTestAppConfigLayer } from "@workspace/domain/config/__mocks__/app-config";
import { _resetMockState as resetPurchaseMock } from "@workspace/infrastructure/repositories/__mocks__/purchase-event.drizzle.repository";
import {
	_getCreditConsumedTokens,
	_resetMockState as resetInvitationMock,
} from "@workspace/infrastructure/repositories/__mocks__/relationship-invitation.drizzle.repository";
import { PurchaseEventDrizzleRepositoryLive } from "@workspace/infrastructure/repositories/purchase-event.drizzle.repository";
import { RelationshipInvitationDrizzleRepositoryLive } from "@workspace/infrastructure/repositories/relationship-invitation.drizzle.repository";
import { Effect, Exit, Layer } from "effect";
import { createInvitation } from "../create-invitation.use-case";

// vi.mock() swaps production layers with __mocks__/ Layer.succeed (no deps),
// but TS still infers the production RIn types. Cast is safe here.
type TestServices = PurchaseEventRepository | RelationshipInvitationRepository | AppConfig;

const TestLayer = Layer.mergeAll(
	PurchaseEventDrizzleRepositoryLive,
	RelationshipInvitationDrizzleRepositoryLive,
	createTestAppConfigLayer(),
) as Layer.Layer<TestServices>;

describe("createInvitation", () => {
	beforeEach(() => {
		resetPurchaseMock();
		resetInvitationMock();
	});

	it.effect("creates invitation with credit consumption when user has credits", () =>
		Effect.gen(function* () {
			// Seed 1 free credit
			const purchaseRepo = yield* PurchaseEventRepository;
			yield* purchaseRepo.insertEvent({
				userId: "user-1",
				eventType: "free_credit_granted",
				polarCheckoutId: "free-credit-user-1",
			});

			const result = yield* createInvitation({ userId: "user-1" });

			expect(result.invitation).toBeDefined();
			expect(result.invitation.inviterUserId).toBe("user-1");
			expect(result.invitation.status).toBe("pending");
			expect(result.invitation.inviteeUserId).toBeNull();
			expect(result.shareUrl).toContain("/invite/");
			expect(result.shareUrl).toContain(result.invitation.invitationToken);

			// Verify credit was consumed (tracked in invitation mock)
			const consumedTokens = _getCreditConsumedTokens();
			expect(consumedTokens).toHaveLength(1);
			expect(consumedTokens[0]).toBe(result.invitation.invitationToken);
		}).pipe(Effect.provide(TestLayer)),
	);

	it.effect("fails with InsufficientCreditsError when user has 0 credits", () =>
		Effect.gen(function* () {
			const exit = yield* Effect.exit(createInvitation({ userId: "user-no-credits" }));

			expect(Exit.isFailure(exit)).toBe(true);
			if (Exit.isFailure(exit)) {
				const cause = exit.cause;
				const error = cause._tag === "Fail" ? cause.error : null;
				expect(error).toBeDefined();
				expect((error as { _tag: string })._tag).toBe("InsufficientCreditsError");
			}
		}).pipe(Effect.provide(TestLayer)),
	);

	it.effect("stores personal message when provided", () =>
		Effect.gen(function* () {
			const purchaseRepo = yield* PurchaseEventRepository;
			yield* purchaseRepo.insertEvent({
				userId: "user-msg",
				eventType: "free_credit_granted",
				polarCheckoutId: "free-credit-user-msg",
			});

			const result = yield* createInvitation({
				userId: "user-msg",
				personalMessage: "Hey, let's compare!",
			});

			expect(result.invitation.personalMessage).toBe("Hey, let's compare!");
		}).pipe(Effect.provide(TestLayer)),
	);

	it.effect("sets expiry to 30 days from creation", () =>
		Effect.gen(function* () {
			const purchaseRepo = yield* PurchaseEventRepository;
			yield* purchaseRepo.insertEvent({
				userId: "user-expiry",
				eventType: "free_credit_granted",
				polarCheckoutId: "free-credit-user-expiry",
			});

			const before = Date.now();
			const result = yield* createInvitation({ userId: "user-expiry" });
			const after = Date.now();

			const expectedMinMs = before + INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
			const expectedMaxMs = after + INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

			const expiresAtMs = result.invitation.expiresAt.getTime();
			expect(expiresAtMs).toBeGreaterThanOrEqual(expectedMinMs);
			expect(expiresAtMs).toBeLessThanOrEqual(expectedMaxMs);
		}).pipe(Effect.provide(TestLayer)),
	);

	it.effect("builds shareUrl with frontendUrl from config", () =>
		Effect.gen(function* () {
			const purchaseRepo = yield* PurchaseEventRepository;
			yield* purchaseRepo.insertEvent({
				userId: "user-url",
				eventType: "free_credit_granted",
				polarCheckoutId: "free-credit-user-url",
			});

			const result = yield* createInvitation({ userId: "user-url" });

			expect(result.shareUrl).toMatch(/^http:\/\/localhost:3000\/invite\//);
		}).pipe(Effect.provide(TestLayer)),
	);
});
