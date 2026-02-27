import { vi } from "vitest";

vi.mock("@workspace/infrastructure/repositories/relationship-invitation.drizzle.repository");

import { beforeEach, describe, expect, it } from "@effect/vitest";

import { RelationshipInvitationRepository } from "@workspace/domain";
import { _resetMockState as resetInvitationMock } from "@workspace/infrastructure/repositories/__mocks__/relationship-invitation.drizzle.repository";
import { RelationshipInvitationDrizzleRepositoryLive } from "@workspace/infrastructure/repositories/relationship-invitation.drizzle.repository";
import { Effect, Exit, Layer } from "effect";
import { acceptInvitation } from "../accept-invitation.use-case";

const TestLayer = Layer.mergeAll(
	RelationshipInvitationDrizzleRepositoryLive,
) as Layer.Layer<RelationshipInvitationRepository>;

const INVITER_ID = "inviter-user-1";
const INVITEE_ID = "invitee-user-2";
const TOKEN = "test-token-abc";

const seedPendingInvitation = () =>
	Effect.gen(function* () {
		const repo = yield* RelationshipInvitationRepository;
		yield* repo.createWithCreditConsumption({
			inviterUserId: INVITER_ID,
			invitationToken: TOKEN,
			personalMessage: "Let's compare!",
			expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
		});
	});

const seedExpiredInvitation = () =>
	Effect.gen(function* () {
		const repo = yield* RelationshipInvitationRepository;
		yield* repo.createWithCreditConsumption({
			inviterUserId: INVITER_ID,
			invitationToken: TOKEN,
			personalMessage: null,
			expiresAt: new Date(Date.now() - 1000), // Already expired
		});
	});

describe("acceptInvitation use-case", () => {
	beforeEach(() => {
		resetInvitationMock();
	});

	it.effect("accepts invitation for existing user (happy path)", () =>
		Effect.gen(function* () {
			yield* seedPendingInvitation();

			const result = yield* acceptInvitation({ token: TOKEN, inviteeUserId: INVITEE_ID });

			expect(result.invitation).toBeDefined();
			expect(result.invitation.status).toBe("accepted");
			expect(result.invitation.inviteeUserId).toBe(INVITEE_ID);
			expect(result.invitation.inviterUserId).toBe(INVITER_ID);
		}).pipe(Effect.provide(TestLayer)),
	);

	it.effect("fails with SelfInvitationError when inviter tries to accept own invitation", () =>
		Effect.gen(function* () {
			yield* seedPendingInvitation();

			const exit = yield* Effect.exit(acceptInvitation({ token: TOKEN, inviteeUserId: INVITER_ID }));

			expect(Exit.isFailure(exit)).toBe(true);
			if (Exit.isFailure(exit)) {
				const cause = exit.cause;
				const error = cause._tag === "Fail" ? cause.error : null;
				expect((error as { _tag: string })._tag).toBe("SelfInvitationError");
			}
		}).pipe(Effect.provide(TestLayer)),
	);

	it.effect("fails with InvitationAlreadyRespondedError when already accepted", () =>
		Effect.gen(function* () {
			yield* seedPendingInvitation();

			// Accept first time
			yield* acceptInvitation({ token: TOKEN, inviteeUserId: INVITEE_ID });

			// Try to accept again
			const exit = yield* Effect.exit(
				acceptInvitation({ token: TOKEN, inviteeUserId: "another-user" }),
			);

			expect(Exit.isFailure(exit)).toBe(true);
			if (Exit.isFailure(exit)) {
				const cause = exit.cause;
				const error = cause._tag === "Fail" ? cause.error : null;
				expect((error as { _tag: string })._tag).toBe("InvitationAlreadyRespondedError");
			}
		}).pipe(Effect.provide(TestLayer)),
	);

	it.effect("fails with InvitationAlreadyRespondedError when already refused", () =>
		Effect.gen(function* () {
			yield* seedPendingInvitation();

			// Refuse first
			const repo = yield* RelationshipInvitationRepository;
			yield* repo.refuseInvitation({ token: TOKEN });

			// Try to accept
			const exit = yield* Effect.exit(acceptInvitation({ token: TOKEN, inviteeUserId: INVITEE_ID }));

			expect(Exit.isFailure(exit)).toBe(true);
			if (Exit.isFailure(exit)) {
				const cause = exit.cause;
				const error = cause._tag === "Fail" ? cause.error : null;
				expect((error as { _tag: string })._tag).toBe("InvitationAlreadyRespondedError");
			}
		}).pipe(Effect.provide(TestLayer)),
	);

	it.effect("fails with InvitationNotFoundError for expired invitation", () =>
		Effect.gen(function* () {
			yield* seedExpiredInvitation();

			const exit = yield* Effect.exit(acceptInvitation({ token: TOKEN, inviteeUserId: INVITEE_ID }));

			expect(Exit.isFailure(exit)).toBe(true);
			if (Exit.isFailure(exit)) {
				const cause = exit.cause;
				const error = cause._tag === "Fail" ? cause.error : null;
				expect((error as { _tag: string })._tag).toBe("InvitationNotFoundError");
			}
		}).pipe(Effect.provide(TestLayer)),
	);

	it.effect("fails with InvitationNotFoundError for non-existent token", () =>
		Effect.gen(function* () {
			const exit = yield* Effect.exit(
				acceptInvitation({ token: "non-existent-token", inviteeUserId: INVITEE_ID }),
			);

			expect(Exit.isFailure(exit)).toBe(true);
			if (Exit.isFailure(exit)) {
				const cause = exit.cause;
				const error = cause._tag === "Fail" ? cause.error : null;
				expect((error as { _tag: string })._tag).toBe("InvitationNotFoundError");
			}
		}).pipe(Effect.provide(TestLayer)),
	);
});
