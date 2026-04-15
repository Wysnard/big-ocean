/**
 * Generate UserSummary after assessment scoring (Story 7.1).
 *
 * Idempotent: if a row already exists for the assessment result, skips LLM call.
 */

import {
	AssessmentResultError,
	AssessmentResultRepository,
	ConversationEvidenceRepository,
	LoggerRepository,
	UserSummaryGeneratorRepository,
	UserSummaryRepository,
} from "@workspace/domain";
import { Effect } from "effect";

export interface GenerateUserSummaryInput {
	readonly sessionId: string;
	readonly userId: string;
	readonly parentConversationId: string | null;
}

export const generateUserSummary = (input: GenerateUserSummaryInput) =>
	Effect.gen(function* () {
		const assessmentResultRepo = yield* AssessmentResultRepository;
		const conversationEvidenceRepo = yield* ConversationEvidenceRepository;
		const userSummaryRepo = yield* UserSummaryRepository;
		const generator = yield* UserSummaryGeneratorRepository;
		const logger = yield* LoggerRepository;

		const result = yield* assessmentResultRepo.getBySessionId(input.sessionId);
		if (!result) {
			return yield* Effect.fail(
				new AssessmentResultError({
					message: `No assessment result for session ${input.sessionId}`,
				}),
			);
		}

		const existing = yield* userSummaryRepo.getByAssessmentResultId(result.id);
		if (existing) {
			logger.info("User summary: already exists, skipping generation", {
				sessionId: input.sessionId,
				assessmentResultId: result.id,
			});
			return;
		}

		const isExtension = input.parentConversationId != null;
		const evidence = isExtension
			? yield* conversationEvidenceRepo.findByUserId(input.userId)
			: yield* conversationEvidenceRepo.findBySession(input.sessionId);

		const genOut = yield* generator.generate({
			sessionId: input.sessionId,
			facets: result.facets,
			evidence,
		});

		yield* userSummaryRepo.upsertForAssessmentResult({
			userId: input.userId,
			assessmentResultId: result.id,
			themes: genOut.themes,
			quoteBank: genOut.quoteBank,
			summaryText: genOut.summaryText,
			version: 1,
		});

		logger.info("User summary: persisted", {
			sessionId: input.sessionId,
			assessmentResultId: result.id,
		});
	});
