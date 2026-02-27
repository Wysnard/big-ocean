import { vi } from "vitest";

vi.mock("@workspace/infrastructure/repositories/relationship-invitation.drizzle.repository");

import { beforeEach, describe, expect, it } from "@effect/vitest";

import { RelationshipInvitationRepository } from "@workspace/domain";
import { _resetMockState as resetInvitationMock } from "@workspace/infrastructure/repositories/__mocks__/relationship-invitation.drizzle.repository";
import { RelationshipInvitationDrizzleRepositoryLive } from "@workspace/infrastructure/repositories/relationship-invitation.drizzle.repository";
import { Effect, Exit, Layer } from "effect";
import { acceptInvitation } from "../accept-invitation.use-case";
import { refuseInvitation } from "../refuse-invitation.use-case";

const TestLayer = Layer.mergeAll(
	RelationshipInvitationDrizzleRepositoryLive,
) as Layer.Layer<RelationshipInvitationRepository>;

const INVITER_ID = "inviter-user-1";
const TOKEN = "test-token-abc";

const seedPendingInvitation = () =>
	Effect.gen(function* () {
		const repo = yield* RelationshipInvitationRepository;
		yield* repo.createWithCreditConsumption({
			inviterUserId: INVITER_ID,
			invitationToken: TOKEN,
			personalMessage: null,
			expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
		});
	});

const seedExpiredInvitation = () =>
	Effect.gen(function* () {
		const repo = yield* RelationshipInvitationRepository;
		yield* repo.createWithCreditConsumption({
			inviterUserId: INVITER_ID,
			invitationToken: TOKEN,
			personalMessage: null,
			expiresAt: new Date(Date.now() - 1000),
		});
	});

describe("refuseInvitation use-case", () => {
	beforeEach(() => {
		resetInvitationMock();
	});

	it.effect("refuses invitation (happy path)", () =>
		Effect.gen(function* () {
			yield* seedPendingInvitation();

			const result = yield* refuseInvitation(TOKEN);

			expect(result.invitation).toBeDefined();
			expect(result.invitation.status).toBe("refused");
			expect(result.invitation.inviteeUserId).toBeNull();
		}).pipe(Effect.provide(TestLayer)),
	);

	it.effect("fails with InvitationAlreadyRespondedError when already accepted", () =>
		Effect.gen(function* () {
			yield* seedPendingInvitation();

			// Accept first
			yield* acceptInvitation({ token: TOKEN, inviteeUserId: "some-user" });

			// Try to refuse
			const exit = yield* Effect.exit(refuseInvitation(TOKEN));

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

			const exit = yield* Effect.exit(refuseInvitation(TOKEN));

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
			const exit = yield* Effect.exit(refuseInvitation("non-existent-token"));

			expect(Exit.isFailure(exit)).toBe(true);
			if (Exit.isFailure(exit)) {
				const cause = exit.cause;
				const error = cause._tag === "Fail" ? cause.error : null;
				expect((error as { _tag: string })._tag).toBe("InvitationNotFoundError");
			}
		}).pipe(Effect.provide(TestLayer)),
	);
});
