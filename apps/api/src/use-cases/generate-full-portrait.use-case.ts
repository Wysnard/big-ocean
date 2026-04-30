/**
 * Generate Full Portrait Use Case (Story 13.3, ADR-51 three-stage pipeline)
 *
 * Background generation after Assessment Finalization enqueues a job.
 * Stage A: UserSummary + facet/trait scores only (no raw messages or evidence).
 * Stage B: Verifies SpineBrief; one re-extract with gap feedback if needed.
 * Stage C: Prose from SpineBrief + Nerin craft context only (brief-only).
 */

import {
	AppConfig,
	AssessmentResultRepository,
	computeTraitResults,
	type FacetName,
	type FacetScoresMap,
	LoggerRepository,
	type PortraitPipelineModels,
	PortraitProseRendererRepository,
	PortraitRepository,
	type PortraitUserSummaryInput,
	SpineExtractorRepository,
	SpineVerifierRepository,
	UserSummaryRepository,
} from "@workspace/domain";
import { Effect, Schedule } from "effect";
import { requireAuthenticatedConversation } from "./authenticated-conversation/access";
import {
	loadScopedConversationEvidence,
	resolveAuthenticatedConversationScope,
} from "./authenticated-conversation/scope";

export interface GenerateFullPortraitInput {
	readonly sessionId: string;
	readonly userId: string;
}

const toPortraitUserSummaryInput = (record: {
	readonly summaryText: string;
	readonly themes: readonly { readonly theme: string; readonly description: string }[];
	readonly quoteBank: readonly { readonly quote: string }[];
}): PortraitUserSummaryInput => ({
	summaryText: record.summaryText,
	themes: record.themes,
	quoteBank: record.quoteBank.map((q) => ({ quote: q.quote })),
});

/**
 * Run extract → verify → optional re-extract → prose render; persist artifacts.
 */
export const generateFullPortrait = (input: GenerateFullPortraitInput) =>
	Effect.gen(function* () {
		const portraitRepo = yield* PortraitRepository;
		const spineExtractor = yield* SpineExtractorRepository;
		const spineVerifier = yield* SpineVerifierRepository;
		const proseRenderer = yield* PortraitProseRendererRepository;
		const resultsRepo = yield* AssessmentResultRepository;
		const userSummaryRepo = yield* UserSummaryRepository;
		const logger = yield* LoggerRepository;
		const config = yield* AppConfig;

		logger.info("Starting full portrait generation (ADR-51 pipeline)", {
			sessionId: input.sessionId,
			userId: input.userId,
		});

		const result = yield* resultsRepo.getBySessionId(input.sessionId);
		if (!result) {
			logger.error("Assessment result not found for portrait generation", {
				sessionId: input.sessionId,
			});
			yield* portraitRepo.insertFailed({
				assessmentResultId: "unknown",
				tier: "full",
				failedAt: new Date(),
			});
			return;
		}

		const userSummaryRow = yield* userSummaryRepo.getForAssessmentResult(result.id);
		if (!userSummaryRow) {
			logger.error("UserSummary missing for portrait generation — cannot proceed", {
				sessionId: input.sessionId,
				assessmentResultId: result.id,
			});
			yield* portraitRepo.insertFailed({
				assessmentResultId: result.id,
				tier: "full",
				failedAt: new Date(),
			});
			return;
		}

		const scopedConversation = yield* requireAuthenticatedConversation({
			sessionId: input.sessionId,
			authenticatedUserId: input.userId,
			policy: "owned-session",
		});
		const scope = resolveAuthenticatedConversationScope(scopedConversation);
		yield* loadScopedConversationEvidence(scope);

		const facetScoresMap: FacetScoresMap = {} as FacetScoresMap;
		for (const [facetName, data] of Object.entries(result.facets)) {
			if (typeof data === "object" && data !== null && "score" in data && "confidence" in data) {
				facetScoresMap[facetName as FacetName] = {
					score: data.score,
					confidence: data.confidence,
				};
			}
		}

		const traitScoresMap = computeTraitResults(facetScoresMap);
		const portraitUserSummary = toPortraitUserSummaryInput(userSummaryRow);

		const pipelineModels: PortraitPipelineModels = {
			spineExtractorModelId: config.portraitSpineExtractorModelId,
			spineVerifierModelId: config.portraitSpineVerifierModelId,
			portraitProseRendererModelId: config.portraitProseRendererModelId,
		};

		const pipelineEffect = Effect.gen(function* () {
			let brief = yield* spineExtractor.extractSpineBrief({
				sessionId: input.sessionId,
				userSummary: portraitUserSummary,
				facetScoresMap,
				traitScoresMap,
			});

			let verification = yield* spineVerifier.verifySpineBrief({
				sessionId: input.sessionId,
				brief,
			});

			if (!verification.passed) {
				brief = yield* spineExtractor.extractSpineBrief({
					sessionId: input.sessionId,
					userSummary: portraitUserSummary,
					facetScoresMap,
					traitScoresMap,
					gapFeedback: verification.gapFeedback,
				});
				verification = yield* spineVerifier.verifySpineBrief({
					sessionId: input.sessionId,
					brief,
				});
			}

			const content = yield* proseRenderer.renderPortraitProse({
				sessionId: input.sessionId,
				brief,
			});

			return { content, brief, verification };
		});

		const contentResult = yield* pipelineEffect.pipe(
			Effect.retry({
				times: 2,
				schedule: Schedule.exponential("5 seconds"),
			}),
			Effect.map((x) => ({ _tag: "success" as const, ...x })),
			Effect.catchAll((error: unknown) =>
				Effect.sync(() => {
					const msg = error instanceof Error ? error.message : String(error);
					logger.error("Portrait pipeline failed after retries", {
						sessionId: input.sessionId,
						error: msg,
					});
					return { _tag: "failure" as const, error };
				}),
			),
		);

		if (contentResult._tag === "success") {
			yield* portraitRepo.insertWithContent({
				assessmentResultId: result.id,
				tier: "full",
				content: contentResult.content,
				modelUsed: config.portraitProseRendererModelId,
				spineBrief: contentResult.brief,
				spineVerification: contentResult.verification,
				portraitPipelineModels: pipelineModels,
			});

			logger.info("Full portrait generation completed", {
				sessionId: input.sessionId,
				contentLength: contentResult.content.length,
			});
		} else {
			yield* portraitRepo.insertFailed({
				assessmentResultId: result.id,
				tier: "full",
				failedAt: new Date(),
			});

			logger.error("Portrait generation failed, inserted failure record", {
				sessionId: input.sessionId,
			});
		}
	});
