/**
 * Relationship Invitation Repository Interface (Story 14.2)
 *
 * Port for invitation CRUD operations.
 * createWithCreditConsumption encapsulates the atomic transaction:
 * credit_consumed event + invitation insert in a single db.transaction().
 */

import { Context, Effect } from "effect";
import {
	DatabaseError,
	InvitationAlreadyRespondedError,
	InvitationNotFoundError,
	SelfInvitationError,
} from "../errors/http.errors";
import type { InvitationStatus, RelationshipInvitation } from "../types/relationship.types";

export class RelationshipInvitationRepository extends Context.Tag(
	"RelationshipInvitationRepository",
)<
	RelationshipInvitationRepository,
	{
		readonly createWithCreditConsumption: (input: {
			inviterUserId: string;
			invitationToken: string;
			personalMessage: string | null;
			expiresAt: Date;
		}) => Effect.Effect<RelationshipInvitation, DatabaseError>;

		readonly getByToken: (
			token: string,
		) => Effect.Effect<RelationshipInvitation, DatabaseError | InvitationNotFoundError>;

		readonly listByInviter: (
			userId: string,
		) => Effect.Effect<ReadonlyArray<RelationshipInvitation>, DatabaseError>;

		readonly updateStatus: (
			id: string,
			status: InvitationStatus,
		) => Effect.Effect<RelationshipInvitation, DatabaseError | InvitationNotFoundError>;

		readonly acceptInvitation: (input: {
			token: string;
			inviteeUserId: string;
		}) => Effect.Effect<
			RelationshipInvitation,
			DatabaseError | InvitationNotFoundError | InvitationAlreadyRespondedError | SelfInvitationError
		>;

		readonly refuseInvitation: (input: {
			token: string;
		}) => Effect.Effect<
			RelationshipInvitation,
			DatabaseError | InvitationNotFoundError | InvitationAlreadyRespondedError
		>;

		readonly listByInvitee: (
			userId: string,
		) => Effect.Effect<ReadonlyArray<RelationshipInvitation>, DatabaseError>;

		readonly getByTokenWithInviterName: (
			token: string,
		) => Effect.Effect<
			{ invitation: RelationshipInvitation; inviterDisplayName: string | undefined },
			DatabaseError | InvitationNotFoundError
		>;
	}
>() {}
