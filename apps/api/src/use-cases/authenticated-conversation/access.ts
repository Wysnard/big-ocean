import {
	ConversationRepository,
	type DatabaseError,
	SessionCompletedError,
	SessionNotCompleted,
	SessionNotFinalizing,
	SessionNotFound,
} from "@workspace/domain";
import type { ConversationEntity } from "@workspace/domain/entities/conversation.entity";
import { Effect } from "effect";

type ConversationStatus = ConversationEntity["status"];

export type AuthenticatedConversationAccessPolicy =
	| "owned-session"
	| "active-message"
	| "completed-read"
	| "finalization"
	| "portrait-retry";

export type AuthenticatedConversationAccessFailureReason =
	| "owner-mismatch"
	| "not-active"
	| "not-completed"
	| "not-finalizing";

export interface AuthenticatedConversation<
	P extends AuthenticatedConversationAccessPolicy = AuthenticatedConversationAccessPolicy,
> {
	readonly session: ConversationEntity;
	readonly policy: P;
}

interface AccessPolicyDefinition {
	readonly allowedStatuses: readonly ConversationStatus[];
	readonly statusFailureReason: Exclude<
		AuthenticatedConversationAccessFailureReason,
		"owner-mismatch"
	>;
}

const ALL_STATUSES = ["active", "paused", "finalizing", "completed", "archived"] as const;

const ACCESS_POLICIES: Record<AuthenticatedConversationAccessPolicy, AccessPolicyDefinition> = {
	"owned-session": {
		allowedStatuses: ALL_STATUSES,
		statusFailureReason: "not-active",
	},
	"active-message": {
		allowedStatuses: ["active"],
		statusFailureReason: "not-active",
	},
	"completed-read": {
		allowedStatuses: ["completed"],
		statusFailureReason: "not-completed",
	},
	finalization: {
		allowedStatuses: ["finalizing", "completed"],
		statusFailureReason: "not-finalizing",
	},
	"portrait-retry": {
		allowedStatuses: ALL_STATUSES,
		statusFailureReason: "not-active",
	},
};

type AuthenticatedConversationAccessError<P extends AuthenticatedConversationAccessPolicy> =
	| DatabaseError
	| SessionNotFound
	| (P extends "active-message" ? SessionCompletedError : never)
	| (P extends "completed-read" ? SessionNotCompleted : never)
	| (P extends "finalization" ? SessionNotFinalizing : never);

export const getAuthenticatedConversationAccessFailureReason = (input: {
	readonly session: ConversationEntity;
	readonly authenticatedUserId: string;
	readonly policy: AuthenticatedConversationAccessPolicy;
}): AuthenticatedConversationAccessFailureReason | null => {
	if (input.session.userId !== input.authenticatedUserId) {
		return "owner-mismatch";
	}

	const definition = ACCESS_POLICIES[input.policy];
	return definition.allowedStatuses.includes(input.session.status)
		? null
		: definition.statusFailureReason;
};

const failForAccessReason = (input: {
	readonly reason: AuthenticatedConversationAccessFailureReason;
	readonly session: ConversationEntity;
	readonly sessionId: string;
}) => {
	switch (input.reason) {
		case "owner-mismatch":
			return Effect.fail(
				new SessionNotFound({
					sessionId: input.sessionId,
					message: `Session '${input.sessionId}' not found`,
				}),
			);
		case "not-active":
			return Effect.fail(
				new SessionCompletedError({
					sessionId: input.sessionId,
					status: input.session.status,
					message: `Session is ${input.session.status} — cannot send messages`,
				}),
			);
		case "not-completed":
			return Effect.fail(
				new SessionNotCompleted({
					sessionId: input.sessionId,
					currentStatus: input.session.status,
					message: `Session is '${input.session.status}', results are not ready yet`,
				}),
			);
		case "not-finalizing":
			return Effect.fail(
				new SessionNotFinalizing({
					sessionId: input.sessionId,
					currentStatus: input.session.status,
					message: `Session is '${input.session.status}', expected 'finalizing'`,
				}),
			);
	}
};

export const requireAuthenticatedConversation = <
	P extends AuthenticatedConversationAccessPolicy,
>(input: {
	readonly sessionId: string;
	readonly authenticatedUserId: string;
	readonly policy: P;
}): Effect.Effect<
	AuthenticatedConversation<P>,
	AuthenticatedConversationAccessError<P>,
	ConversationRepository
> =>
	Effect.gen(function* () {
		const sessionRepo = yield* ConversationRepository;
		const session = yield* sessionRepo.getSession(input.sessionId);

		const reason = getAuthenticatedConversationAccessFailureReason({
			session,
			authenticatedUserId: input.authenticatedUserId,
			policy: input.policy,
		});

		if (reason !== null) {
			return yield* failForAccessReason({
				reason,
				session,
				sessionId: input.sessionId,
			});
		}

		return {
			session,
			policy: input.policy,
		} satisfies AuthenticatedConversation<P>;
	}) as Effect.Effect<
		AuthenticatedConversation<P>,
		AuthenticatedConversationAccessError<P>,
		ConversationRepository
	>;
