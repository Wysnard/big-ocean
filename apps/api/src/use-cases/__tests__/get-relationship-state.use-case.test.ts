/**
 * Get Relationship State Use Case Tests (Story 14.4)
 *
 * Tests all 7 states from Decision Tree 1, including pending-received for invitees.
 */

import { beforeEach, describe, expect, it } from "@effect/vitest";
import {
	PurchaseEventRepository,
	RelationshipAnalysisRepository,
	RelationshipInvitationRepository,
} from "@workspace/domain";
import { Effect, Layer } from "effect";
import { vi } from "vitest";
import { getRelationshipState } from "../get-relationship-state.use-case";

const USER_ID = "user-123";

const mockInvitationRepo = {
	createWithCreditConsumption: vi.fn(),
	getByToken: vi.fn(),
	listByInviter: vi.fn(),
	listByInvitee: vi.fn(),
	updateStatus: vi.fn(),
	acceptInvitation: vi.fn(),
	refuseInvitation: vi.fn(),
	getByTokenWithInviterName: vi.fn(),
};

const mockAnalysisRepo = {
	insertPlaceholder: vi.fn(),
	updateContent: vi.fn(),
	incrementRetryCount: vi.fn(),
	getByInvitationId: vi.fn(),
	getByUserId: vi.fn(),
	getById: vi.fn(),
};

const mockPurchaseRepo = {
	insertEvent: vi.fn(),
	getEventsByUserId: vi.fn(),
	getCapabilities: vi.fn(),
	getByCheckoutId: vi.fn(),
	insertEventWithPortraitPlaceholder: vi.fn(),
};

const createTestLayer = () =>
	Layer.mergeAll(
		Layer.succeed(RelationshipInvitationRepository, mockInvitationRepo),
		Layer.succeed(RelationshipAnalysisRepository, mockAnalysisRepo),
		Layer.succeed(PurchaseEventRepository, mockPurchaseRepo),
	);

describe("getRelationshipState Use Case (Story 14.4)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockInvitationRepo.listByInviter.mockReturnValue(Effect.succeed([]));
		mockInvitationRepo.listByInvitee.mockReturnValue(Effect.succeed([]));
		mockAnalysisRepo.getByUserId.mockReturnValue(Effect.succeed([]));
		mockAnalysisRepo.getByInvitationId.mockReturnValue(Effect.succeed(null));
		mockPurchaseRepo.getCapabilities.mockReturnValue(
			Effect.succeed({ availableCredits: 0, hasFullPortrait: false, hasExtendedConversation: false }),
		);
	});

	it.effect("returns invite-prompt when user has credits and no invitations", () =>
		Effect.gen(function* () {
			mockPurchaseRepo.getCapabilities.mockReturnValue(
				Effect.succeed({ availableCredits: 2, hasFullPortrait: false, hasExtendedConversation: false }),
			);

			const state = yield* getRelationshipState(USER_ID);
			expect(state._tag).toBe("invite-prompt");
			if (state._tag === "invite-prompt") {
				expect(state.availableCredits).toBe(2);
			}
		}).pipe(Effect.provide(createTestLayer())),
	);

	it.effect("returns no-credits when user has no credits and no invitations", () =>
		Effect.gen(function* () {
			const state = yield* getRelationshipState(USER_ID);
			expect(state._tag).toBe("no-credits");
		}).pipe(Effect.provide(createTestLayer())),
	);

	it.effect("returns pending-received when user has a pending invitation as invitee", () =>
		Effect.gen(function* () {
			mockInvitationRepo.listByInvitee.mockReturnValue(
				Effect.succeed([
					{
						id: "inv-1",
						inviterUserId: "other-user",
						inviteeUserId: USER_ID,
						invitationToken: "tok",
						personalMessage: null,
						status: "pending",
						expiresAt: new Date(Date.now() + 86400000),
						updatedAt: new Date(),
						createdAt: new Date(),
					},
				]),
			);

			const state = yield* getRelationshipState(USER_ID);
			expect(state._tag).toBe("pending-received");
			if (state._tag === "pending-received") {
				expect(state.invitationId).toBe("inv-1");
			}
		}).pipe(Effect.provide(createTestLayer())),
	);

	it.effect("returns pending-sent when inviter has a pending invitation", () =>
		Effect.gen(function* () {
			mockInvitationRepo.listByInviter.mockReturnValue(
				Effect.succeed([
					{
						id: "inv-1",
						inviterUserId: USER_ID,
						inviteeUserId: null,
						invitationToken: "tok",
						personalMessage: null,
						status: "pending",
						expiresAt: new Date(Date.now() + 86400000),
						updatedAt: new Date(),
						createdAt: new Date(),
					},
				]),
			);

			const state = yield* getRelationshipState(USER_ID);
			expect(state._tag).toBe("pending-sent");
		}).pipe(Effect.provide(createTestLayer())),
	);

	it.effect("returns generating when invitation accepted but analysis not ready", () =>
		Effect.gen(function* () {
			mockInvitationRepo.listByInviter.mockReturnValue(
				Effect.succeed([
					{
						id: "inv-1",
						inviterUserId: USER_ID,
						inviteeUserId: "invitee-1",
						invitationToken: "tok",
						personalMessage: null,
						status: "accepted",
						expiresAt: new Date(Date.now() + 86400000),
						updatedAt: new Date(),
						createdAt: new Date(),
					},
				]),
			);
			mockAnalysisRepo.getByInvitationId.mockReturnValue(
				Effect.succeed({ id: "a-1", content: null, retryCount: 0 }),
			);

			const state = yield* getRelationshipState(USER_ID);
			expect(state._tag).toBe("generating");
		}).pipe(Effect.provide(createTestLayer())),
	);

	it.effect("returns ready when analysis has content (inviter side)", () =>
		Effect.gen(function* () {
			mockInvitationRepo.listByInviter.mockReturnValue(
				Effect.succeed([
					{
						id: "inv-1",
						inviterUserId: USER_ID,
						inviteeUserId: "invitee-1",
						invitationToken: "tok",
						personalMessage: null,
						status: "accepted",
						expiresAt: new Date(Date.now() + 86400000),
						updatedAt: new Date(),
						createdAt: new Date(),
					},
				]),
			);
			mockAnalysisRepo.getByInvitationId.mockReturnValue(
				Effect.succeed({ id: "a-1", content: "Analysis content", retryCount: 0 }),
			);

			const state = yield* getRelationshipState(USER_ID);
			expect(state._tag).toBe("ready");
			if (state._tag === "ready") {
				expect(state.analysisId).toBe("a-1");
			}
		}).pipe(Effect.provide(createTestLayer())),
	);

	it.effect("returns declined when invitation was refused", () =>
		Effect.gen(function* () {
			mockInvitationRepo.listByInviter.mockReturnValue(
				Effect.succeed([
					{
						id: "inv-1",
						inviterUserId: USER_ID,
						inviteeUserId: "invitee-1",
						invitationToken: "tok",
						personalMessage: null,
						status: "refused",
						expiresAt: new Date(Date.now() + 86400000),
						updatedAt: new Date(),
						createdAt: new Date(),
					},
				]),
			);

			const state = yield* getRelationshipState(USER_ID);
			expect(state._tag).toBe("declined");
		}).pipe(Effect.provide(createTestLayer())),
	);

	it.effect("returns ready when user is invitee and analysis is complete", () =>
		Effect.gen(function* () {
			mockAnalysisRepo.getByUserId.mockReturnValue(
				Effect.succeed([
					{
						id: "a-1",
						invitationId: "inv-1",
						userAId: "other-user",
						userBId: USER_ID,
						content: "Relationship analysis...",
						modelUsed: "sonnet",
						retryCount: 0,
						createdAt: new Date(),
					},
				]),
			);

			const state = yield* getRelationshipState(USER_ID);
			expect(state._tag).toBe("ready");
			if (state._tag === "ready") {
				expect(state.analysisId).toBe("a-1");
			}
		}).pipe(Effect.provide(createTestLayer())),
	);

	it.effect("prioritizes ready over declined when user has both", () =>
		Effect.gen(function* () {
			mockInvitationRepo.listByInviter.mockReturnValue(
				Effect.succeed([
					{
						id: "inv-refused",
						inviterUserId: USER_ID,
						inviteeUserId: "other-1",
						invitationToken: "tok1",
						personalMessage: null,
						status: "refused",
						expiresAt: new Date(Date.now() + 86400000),
						updatedAt: new Date(),
						createdAt: new Date(),
					},
					{
						id: "inv-accepted",
						inviterUserId: USER_ID,
						inviteeUserId: "other-2",
						invitationToken: "tok2",
						personalMessage: null,
						status: "accepted",
						expiresAt: new Date(Date.now() + 86400000),
						updatedAt: new Date(),
						createdAt: new Date(),
					},
				]),
			);
			mockAnalysisRepo.getByInvitationId.mockImplementation((invId: string) =>
				invId === "inv-accepted"
					? Effect.succeed({ id: "a-1", content: "Analysis", retryCount: 0 })
					: Effect.succeed(null),
			);

			const state = yield* getRelationshipState(USER_ID);
			expect(state._tag).toBe("ready");
		}).pipe(Effect.provide(createTestLayer())),
	);
});
