/**
 * Get Transcript Use Case (Story 12.2)
 *
 * Returns all messages for a completed assessment session with IDs
 * for evidence linking in the transcript panel.
 * Requires authenticated session owner — conversation transcripts are private data.
 */

import { MessageRepository } from "@workspace/domain";
import { Effect } from "effect";
import { requireAuthenticatedConversation } from "./authenticated-conversation/access";

export interface GetTranscriptInput {
	readonly sessionId: string;
	readonly authenticatedUserId: string;
}

export interface TranscriptMessage {
	readonly id: string;
	readonly role: "user" | "assistant";
	readonly content: string;
	readonly createdAt: Date;
}

export interface GetTranscriptOutput {
	readonly messages: readonly TranscriptMessage[];
}

export const getTranscript = (input: GetTranscriptInput) =>
	Effect.gen(function* () {
		const messageRepo = yield* MessageRepository;

		yield* requireAuthenticatedConversation({
			sessionId: input.sessionId,
			authenticatedUserId: input.authenticatedUserId,
			policy: "completed-read",
		});

		const messages = yield* messageRepo.getMessages(input.sessionId);

		return {
			messages: messages.map((msg) => ({
				id: msg.id,
				role: msg.role as "user" | "assistant",
				content: msg.content,
				createdAt: msg.createdAt,
			})),
		};
	});
