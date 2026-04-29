/**
 * Generate UserSummary after assessment scoring (Story 7.1).
 *
 * Idempotent: if a row already exists for the assessment result, skips LLM call.
 */

import {
	AssessmentResultError,
	AssessmentResultRepository,
	LoggerRepository,
	UserSummaryGeneratorRepository,
	UserSummaryRepository,
} from "@workspace/domain";
import { Effect } from "effect";
import type { AuthenticatedConversation } from "./authenticated-conversation/access";
import {
	loadScopedConversationEvidence,
	resolveAuthenticatedConversationScope,
} from "./authenticated-conversation/scope";

export interface GenerateUserSummaryInput {
	readonly conversation: AuthenticatedConversation;
}

export const generateUserSummary = (input: GenerateUserSummaryInput) =>
	Effect.gen(function* () {
		const assessmentResultRepo = yield* AssessmentResultRepository;
		const userSummaryRepo = yield* UserSummaryRepository;
		const generator = yield* UserSummaryGeneratorRepository;
		const logger = yield* LoggerRepository;
		const session = input.conversation.session;

		const result = yield* assessmentResultRepo.getBySessionId(session.id);
		if (!result) {
			return yield* Effect.fail(
				new AssessmentResultError({
					message: `No assessment result for session ${session.id}`,
				}),
			);
		}

		const existing = yield* userSummaryRepo.getByAssessmentResultId(result.id);
		if (existing) {
			logger.info("User summary: already exists, skipping generation", {
				sessionId: session.id,
				assessmentResultId: result.id,
			});
			return;
		}

		const evidence = yield* loadScopedConversationEvidence(
			resolveAuthenticatedConversationScope(input.conversation),
		);

		const genOut = yield* generator.generate({
			sessionId: session.id,
			facets: result.facets,
			evidence,
		});

		yield* userSummaryRepo.upsertForAssessmentResult({
			userId: session.userId,
			assessmentResultId: result.id,
			themes: genOut.themes,
			quoteBank: genOut.quoteBank,
			summaryText: genOut.summaryText,
			version: 1,
		});

		logger.info("User summary: persisted", {
			sessionId: session.id,
			assessmentResultId: result.id,
		});
	});
