import {
	ConversationEvidenceRepository,
	ExchangeRepository,
	MessageRepository,
} from "@workspace/domain";
import { Effect } from "effect";
import type { AuthenticatedConversation } from "./access";

export type AuthenticatedConversationScopeMode =
	| "default"
	| "living-personality-model"
	| "current-session";

export type ResolvedAuthenticatedConversationScopeKind =
	| "living-personality-model"
	| "current-session";

export interface ResolvedAuthenticatedConversationScope {
	readonly kind: ResolvedAuthenticatedConversationScopeKind;
	readonly sessionId: string;
	readonly userId: string;
	readonly parentConversationId: string | null;
}

interface ScopedLoadOptions {
	/**
	 * Some conversational paths are allowed to degrade to current-session context if
	 * the cross-session read fails. Scoring/finalization callers should leave this
	 * false so data-access errors stay visible.
	 */
	readonly fallbackToCurrentSession?: boolean;
}

export const resolveAuthenticatedConversationScope = (
	conversation: AuthenticatedConversation,
	mode: AuthenticatedConversationScopeMode = "default",
): ResolvedAuthenticatedConversationScope => {
	const { session } = conversation;
	const parentConversationId = session.parentConversationId ?? null;
	const useLivingPersonalityModel =
		mode === "living-personality-model" || (mode === "default" && parentConversationId !== null);

	return {
		kind: useLivingPersonalityModel ? "living-personality-model" : "current-session",
		sessionId: session.id,
		userId: session.userId,
		parentConversationId,
	};
};

export const loadScopedConversationEvidence = (
	scope: ResolvedAuthenticatedConversationScope,
	options: ScopedLoadOptions = {},
) =>
	Effect.gen(function* () {
		const evidenceRepo = yield* ConversationEvidenceRepository;

		if (scope.kind === "current-session") {
			return yield* evidenceRepo.findBySession(scope.sessionId);
		}

		const loadLivingModel = evidenceRepo.findByUserId(scope.userId);
		if (options.fallbackToCurrentSession) {
			return yield* loadLivingModel.pipe(
				Effect.catchAll(() => evidenceRepo.findBySession(scope.sessionId)),
			);
		}

		return yield* loadLivingModel;
	});

export const loadScopedMessages = (
	scope: ResolvedAuthenticatedConversationScope,
	options: ScopedLoadOptions = {},
) =>
	Effect.gen(function* () {
		const messageRepo = yield* MessageRepository;

		if (scope.kind === "current-session") {
			return yield* messageRepo.getMessages(scope.sessionId);
		}

		const loadLivingModel = messageRepo.getMessagesByUserId(scope.userId);
		if (options.fallbackToCurrentSession) {
			return yield* loadLivingModel.pipe(
				Effect.catchAll(() => messageRepo.getMessages(scope.sessionId)),
			);
		}

		return yield* loadLivingModel;
	});

export const loadScopedExchanges = (
	scope: ResolvedAuthenticatedConversationScope,
	options: ScopedLoadOptions = {},
) =>
	Effect.gen(function* () {
		const exchangeRepo = yield* ExchangeRepository;

		if (scope.kind === "current-session") {
			return yield* exchangeRepo.findBySession(scope.sessionId);
		}

		const loadLivingModel = exchangeRepo.findByUserId(scope.userId);
		if (options.fallbackToCurrentSession) {
			return yield* loadLivingModel.pipe(
				Effect.catchAll(() => exchangeRepo.findBySession(scope.sessionId)),
			);
		}

		return yield* loadLivingModel;
	});
