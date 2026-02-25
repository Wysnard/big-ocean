/**
 * Get Transcript Use Case (Story 12.2)
 *
 * Returns all messages for a completed assessment session with IDs
 * for evidence linking in the transcript panel.
 * Requires authenticated session owner — conversation transcripts are private data.
 */

import {
	AssessmentMessageRepository,
	AssessmentSessionRepository,
	SessionNotFound,
} from "@workspace/domain";
import { Effect } from "effect";

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
		const sessionRepo = yield* AssessmentSessionRepository;
		const messageRepo = yield* AssessmentMessageRepository;

		const session = yield* sessionRepo.getSession(input.sessionId);

		// Verify ownership — transcripts are private
		if (session.userId !== input.authenticatedUserId) {
			return yield* Effect.fail(
				new SessionNotFound({
					sessionId: input.sessionId,
					message: `Session '${input.sessionId}' not found`,
				}),
			);
		}

		// Verify session is completed
		if (session.status !== "completed") {
			return yield* Effect.fail(
				new SessionNotFound({
					sessionId: input.sessionId,
					message: `Session '${input.sessionId}' not found`,
				}),
			);
		}

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
