import { vi } from "vitest";

vi.mock("@workspace/infrastructure/repositories/relationship-invitation.drizzle.repository");

import { beforeEach, describe, expect, it } from "@effect/vitest";
import { RelationshipInvitationRepository } from "@workspace/domain";
import { _resetMockState } from "@workspace/infrastructure/repositories/__mocks__/relationship-invitation.drizzle.repository";
import { RelationshipInvitationDrizzleRepositoryLive } from "@workspace/infrastructure/repositories/relationship-invitation.drizzle.repository";
import { Effect, Exit, Layer } from "effect";
import { getInvitationByToken } from "../get-invitation-by-token.use-case";

const TestLayer = Layer.mergeAll(
	RelationshipInvitationDrizzleRepositoryLive,
) as Layer.Layer<RelationshipInvitationRepository>;

const TOKEN = "test-token-abc";

const seedInvitation = () =>
	Effect.gen(function* () {
		const repo = yield* RelationshipInvitationRepository;
		yield* repo.createWithCreditConsumption({
			inviterUserId: "inviter-1",
			invitationToken: TOKEN,
			personalMessage: "Let's compare!",
			expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
		});
	});

describe("getInvitationByToken", () => {
	beforeEach(() => {
		_resetMockState();
	});

	it.effect("fails with InvitationNotFoundError for non-existent token", () =>
		Effect.gen(function* () {
			const exit = yield* Effect.exit(getInvitationByToken("non-existent"));

			expect(Exit.isFailure(exit)).toBe(true);
			if (Exit.isFailure(exit)) {
				const error = exit.cause._tag === "Fail" ? exit.cause.error : null;
				expect((error as { _tag: string })._tag).toBe("InvitationNotFoundError");
			}
		}).pipe(Effect.provide(TestLayer)),
	);

	it.effect("returns invitation and inviterDisplayName for valid token", () =>
		Effect.gen(function* () {
			yield* seedInvitation();

			const result = yield* getInvitationByToken(TOKEN);

			expect(result.invitation).toBeDefined();
			expect(result.invitation.invitationToken).toBe(TOKEN);
			expect(result.invitation.inviterUserId).toBe("inviter-1");
			expect(result.inviterDisplayName).toBe("Test User");
		}).pipe(Effect.provide(TestLayer)),
	);
});
