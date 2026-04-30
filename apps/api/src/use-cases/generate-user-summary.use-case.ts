/**
 * Generate UserSummary after assessment scoring (Story 7.1, ADR-55 versioning).
 *
 * Idempotent per assessment result: if a frozen version already exists for `result.id`, skips LLM call.
 * Rolling regeneration: passes the user's **current** summary (if any) into the generator when creating a new version.
 */

import {
	AssessmentResultError,
	AssessmentResultRepository,
	LoggerRepository,
	UserSummaryGeneratorRepository,
	type UserSummaryRefreshSource,
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

const resolveRefreshSource = (
	session: AuthenticatedConversation["session"],
): UserSummaryRefreshSource =>
	session.parentConversationId != null ? "conversation_extension" : "assessment_completion";

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

		const existingFrozen = yield* userSummaryRepo.getForAssessmentResult(result.id);
		if (existingFrozen) {
			logger.info("User summary: already exists for assessment result, skipping generation", {
				sessionId: session.id,
				assessmentResultId: result.id,
			});
			return;
		}

		const previousCurrent = yield* userSummaryRepo.getCurrentForUser(session.userId);
		const previousSummary =
			previousCurrent != null
				? {
						themes: previousCurrent.themes,
						quoteBank: previousCurrent.quoteBank,
						summaryText: previousCurrent.summaryText,
					}
				: undefined;

		const evidence = yield* loadScopedConversationEvidence(
			resolveAuthenticatedConversationScope(input.conversation),
		);

		const genOut = yield* generator.generate({
			sessionId: session.id,
			facets: result.facets,
			evidence,
			previousSummary,
		});

		yield* userSummaryRepo.saveVersion({
			userId: session.userId,
			assessmentResultId: result.id,
			themes: genOut.themes,
			quoteBank: genOut.quoteBank,
			summaryText: genOut.summaryText,
			refreshSource: resolveRefreshSource(session),
		});

		logger.info("User summary: persisted", {
			sessionId: session.id,
			assessmentResultId: result.id,
		});
	});
