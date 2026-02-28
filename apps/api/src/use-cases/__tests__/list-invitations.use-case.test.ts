import { vi } from "vitest";

vi.mock("@workspace/infrastructure/repositories/relationship-invitation.drizzle.repository");

import { beforeEach, describe, expect, it } from "@effect/vitest";
import { RelationshipInvitationRepository } from "@workspace/domain";
import { _resetMockState } from "@workspace/infrastructure/repositories/__mocks__/relationship-invitation.drizzle.repository";
import { RelationshipInvitationDrizzleRepositoryLive } from "@workspace/infrastructure/repositories/relationship-invitation.drizzle.repository";
import { Effect, Layer } from "effect";
import { listInvitations } from "../list-invitations.use-case";

const TestLayer = Layer.mergeAll(
	RelationshipInvitationDrizzleRepositoryLive,
) as Layer.Layer<RelationshipInvitationRepository>;

const USER_ID = "user-1";

const seedInvitation = (token: string, expiresAt?: Date) =>
	Effect.gen(function* () {
		const repo = yield* RelationshipInvitationRepository;
		yield* repo.createWithCreditConsumption({
			inviterUserId: USER_ID,
			invitationToken: token,
			personalMessage: null,
			expiresAt: expiresAt ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
		});
	});

describe("listInvitations", () => {
	beforeEach(() => {
		_resetMockState();
	});

	it.effect("returns empty array when no invitations exist", () =>
		Effect.gen(function* () {
			const result = yield* listInvitations(USER_ID);
			expect(result).toEqual([]);
		}).pipe(Effect.provide(TestLayer)),
	);

	it.effect("returns invitations filtered by userId, sorted newest-first", () =>
		Effect.gen(function* () {
			yield* seedInvitation("token-1");
			yield* seedInvitation("token-2");

			// Seed invitation for a different user
			const repo = yield* RelationshipInvitationRepository;
			yield* repo.createWithCreditConsumption({
				inviterUserId: "other-user",
				invitationToken: "token-other",
				personalMessage: null,
				expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
			});

			const result = yield* listInvitations(USER_ID);
			expect(result).toHaveLength(2);
			// Newest first
			expect(result[0].createdAt.getTime()).toBeGreaterThanOrEqual(result[1].createdAt.getTime());
		}).pipe(Effect.provide(TestLayer)),
	);

	it.effect("derives expired status at read-time for past-due invitations", () =>
		Effect.gen(function* () {
			yield* seedInvitation("token-expired", new Date(Date.now() - 1000));

			const result = yield* listInvitations(USER_ID);
			expect(result).toHaveLength(1);
			expect(result[0].status).toBe("expired");
		}).pipe(Effect.provide(TestLayer)),
	);
});
