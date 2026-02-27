/**
 * Mock: relationship-invitation.drizzle.repository.ts
 * Vitest auto-resolves when tests call:
 *   vi.mock('@workspace/infrastructure/repositories/relationship-invitation.drizzle.repository')
 */

import type { RelationshipInvitation } from "@workspace/domain";
import {
	InvitationAlreadyRespondedError,
	InvitationNotFoundError,
	RelationshipInvitationRepository,
	SelfInvitationError,
} from "@workspace/domain";
import { Effect, Layer } from "effect";

const store = new Map<string, RelationshipInvitation>();
const tokenIndex = new Map<string, string>(); // token → id
const creditConsumedTokens: string[] = [];

/** Clear in-memory state between tests. */
export const _resetMockState = () => {
	store.clear();
	tokenIndex.clear();
	creditConsumedTokens.length = 0;
};

/** Get consumed credit tokens for test assertions. */
export const _getCreditConsumedTokens = () => [...creditConsumedTokens];

export const RelationshipInvitationDrizzleRepositoryLive = Layer.succeed(
	RelationshipInvitationRepository,
	RelationshipInvitationRepository.of({
		createWithCreditConsumption: (input) =>
			Effect.sync(() => {
				const invitation: RelationshipInvitation = {
					id: crypto.randomUUID(),
					inviterUserId: input.inviterUserId,
					inviteeUserId: null,
					invitationToken: input.invitationToken,
					personalMessage: input.personalMessage,
					status: "pending",
					expiresAt: input.expiresAt,
					updatedAt: new Date(),
					createdAt: new Date(),
				};
				store.set(invitation.id, invitation);
				tokenIndex.set(input.invitationToken, invitation.id);
				creditConsumedTokens.push(input.invitationToken);
				return invitation;
			}),

		getByToken: (token) =>
			Effect.gen(function* () {
				const id = tokenIndex.get(token);
				if (!id) {
					return yield* Effect.fail(
						new InvitationNotFoundError({ message: `Invitation not found: ${token}` }),
					);
				}
				const invitation = store.get(id);
				if (!invitation) {
					return yield* Effect.fail(
						new InvitationNotFoundError({ message: `Invitation not found: ${token}` }),
					);
				}
				// Derive expired status at application level (same as listByInviter)
				if (invitation.status === "pending" && invitation.expiresAt < new Date()) {
					return { ...invitation, status: "expired" as const };
				}
				return invitation;
			}),

		listByInviter: (userId) =>
			Effect.sync(() =>
				[...store.values()]
					.filter((inv) => inv.inviterUserId === userId)
					.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
					.map((inv) => {
						if (inv.status === "pending" && inv.expiresAt < new Date()) {
							return { ...inv, status: "expired" as const };
						}
						return inv;
					}),
			),

		listByInvitee: (userId) =>
			Effect.sync(() =>
				[...store.values()]
					.filter((inv) => inv.inviteeUserId === userId)
					.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
					.map((inv) => {
						if (inv.status === "pending" && inv.expiresAt < new Date()) {
							return { ...inv, status: "expired" as const };
						}
						return inv;
					}),
			),

		updateStatus: (id, status) =>
			Effect.gen(function* () {
				const invitation = store.get(id);
				if (!invitation) {
					return yield* Effect.fail(
						new InvitationNotFoundError({ message: `Invitation not found: ${id}` }),
					);
				}
				const updated = { ...invitation, status, updatedAt: new Date() };
				store.set(id, updated);
				return updated;
			}),

		acceptInvitation: (input) =>
			Effect.gen(function* () {
				const id = tokenIndex.get(input.token);
				if (!id) {
					return yield* Effect.fail(
						new InvitationNotFoundError({ message: "Invitation not found or expired" }),
					);
				}
				const invitation = store.get(id);
				if (!invitation || invitation.expiresAt < new Date()) {
					return yield* Effect.fail(
						new InvitationNotFoundError({ message: "Invitation not found or expired" }),
					);
				}
				if (invitation.inviterUserId === input.inviteeUserId) {
					return yield* Effect.fail(
						new SelfInvitationError({ message: "You cannot accept your own invitation" }),
					);
				}
				if (invitation.status !== "pending") {
					return yield* Effect.fail(
						new InvitationAlreadyRespondedError({
							message: `Invitation has already been ${invitation.status}`,
						}),
					);
				}
				const updated: RelationshipInvitation = {
					...invitation,
					inviteeUserId: input.inviteeUserId,
					status: "accepted",
					updatedAt: new Date(),
				};
				store.set(id, updated);
				return updated;
			}),

		refuseInvitation: (input) =>
			Effect.gen(function* () {
				const id = tokenIndex.get(input.token);
				if (!id) {
					return yield* Effect.fail(
						new InvitationNotFoundError({ message: "Invitation not found or expired" }),
					);
				}
				const invitation = store.get(id);
				if (!invitation || invitation.expiresAt < new Date()) {
					return yield* Effect.fail(
						new InvitationNotFoundError({ message: "Invitation not found or expired" }),
					);
				}
				if (invitation.status !== "pending") {
					return yield* Effect.fail(
						new InvitationAlreadyRespondedError({
							message: `Invitation has already been ${invitation.status}`,
						}),
					);
				}
				const updated: RelationshipInvitation = {
					...invitation,
					status: "refused",
					updatedAt: new Date(),
				};
				store.set(id, updated);
				return updated;
			}),

		getByTokenWithInviterName: (token) =>
			Effect.gen(function* () {
				const id = tokenIndex.get(token);
				if (!id) {
					return yield* Effect.fail(
						new InvitationNotFoundError({ message: `Invitation not found: ${token}` }),
					);
				}
				const invitation = store.get(id);
				if (!invitation) {
					return yield* Effect.fail(
						new InvitationNotFoundError({ message: `Invitation not found: ${token}` }),
					);
				}
				const mapped =
					invitation.status === "pending" && invitation.expiresAt < new Date()
						? { ...invitation, status: "expired" as const }
						: invitation;
				return {
					invitation: mapped,
					inviterDisplayName: "Test User" as string | undefined,
				};
			}),
	}),
);
