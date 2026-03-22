/**
 * Get QR Token Details Use-Case (Story 34-3)
 *
 * Returns enriched QR token data for the accept screen:
 * - Initiator's archetype (derived at read time from facet scores)
 * - Initiator's confidence and name
 * - Acceptor's confidence and credit balance
 */

import {
	AssessmentResultRepository,
	AssessmentSessionRepository,
	calculateConfidenceFromFacetScores,
	extract4LetterCode,
	type FacetName,
	type FacetScoresMap,
	generateOceanCode,
	lookupArchetype,
	PurchaseEventRepository,
	QrTokenRepository,
} from "@workspace/domain";
import { Effect } from "effect";

export interface QrTokenDetailsOutput {
	readonly tokenStatus: "valid" | "accepted" | "expired";
	readonly initiator: {
		readonly name: string;
		readonly archetypeName: string;
		readonly oceanCode4: string;
		readonly oceanCode5: string;
		readonly description: string;
		readonly color: string;
		readonly isCurated: boolean;
		readonly overallConfidence: number;
	};
	readonly acceptor: {
		readonly overallConfidence: number;
		readonly availableCredits: number;
		readonly hasCompletedAssessment: boolean;
	};
}

export const getQrTokenDetails = (token: string, acceptorUserId: string) =>
	Effect.gen(function* () {
		const qrTokenRepo = yield* QrTokenRepository;
		const sessionRepo = yield* AssessmentSessionRepository;
		const resultRepo = yield* AssessmentResultRepository;
		const purchaseRepo = yield* PurchaseEventRepository;

		// 1. Get token with initiator name
		const qrToken = yield* qrTokenRepo.getByTokenWithInitiatorName(token);

		// Derive token status
		let tokenStatus: "valid" | "accepted" | "expired";
		if (qrToken.status === "accepted") {
			tokenStatus = "accepted";
		} else if (qrToken.status === "expired") {
			tokenStatus = "expired";
		} else {
			tokenStatus = "valid";
		}

		// 2. Load initiator's assessment results (derive-at-read)
		const initiatorSession = yield* sessionRepo.findSessionByUserId(qrToken.userId);
		let initiatorArchetype = {
			archetypeName: "Unknown",
			oceanCode4: "MSBD",
			oceanCode5: "MSBDV",
			description: "Assessment not yet completed",
			color: "#6B7280",
			isCurated: false,
			overallConfidence: 0,
		};

		if (initiatorSession) {
			const initiatorResult = yield* resultRepo
				.getBySessionId(initiatorSession.id)
				.pipe(Effect.catchTag("AssessmentResultError", () => Effect.succeed(null)));

			if (initiatorResult && Object.keys(initiatorResult.facets).length > 0) {
				const facetScoresMap: FacetScoresMap = {} as FacetScoresMap;
				for (const [facetName, data] of Object.entries(initiatorResult.facets)) {
					if (typeof data === "object" && data !== null && "score" in data && "confidence" in data) {
						facetScoresMap[facetName as FacetName] = {
							score: data.score,
							confidence: data.confidence,
						};
					}
				}

				const oceanCode5 = generateOceanCode(facetScoresMap);
				const oceanCode4 = extract4LetterCode(oceanCode5);
				const archetype = lookupArchetype(oceanCode4);
				const overallConfidence = calculateConfidenceFromFacetScores(facetScoresMap);

				initiatorArchetype = {
					archetypeName: archetype.name,
					oceanCode4: archetype.code4,
					oceanCode5,
					description: archetype.description,
					color: archetype.color,
					isCurated: archetype.isCurated,
					overallConfidence: Math.round(overallConfidence * 100),
				};
			}
		}

		// 3. Load acceptor's data
		const acceptorSession = yield* sessionRepo.findSessionByUserId(acceptorUserId);
		let acceptorConfidence = 0;
		let hasCompletedAssessment = false;

		if (acceptorSession) {
			const acceptorResult = yield* resultRepo
				.getBySessionId(acceptorSession.id)
				.pipe(Effect.catchTag("AssessmentResultError", () => Effect.succeed(null)));

			if (acceptorResult && Object.keys(acceptorResult.facets).length > 0) {
				hasCompletedAssessment = true;
				const facetScoresMap: FacetScoresMap = {} as FacetScoresMap;
				for (const [facetName, data] of Object.entries(acceptorResult.facets)) {
					if (typeof data === "object" && data !== null && "score" in data && "confidence" in data) {
						facetScoresMap[facetName as FacetName] = {
							score: data.score,
							confidence: data.confidence,
						};
					}
				}
				acceptorConfidence = Math.round(calculateConfidenceFromFacetScores(facetScoresMap) * 100);
			}
		}

		// 4. Get acceptor's credits
		const capabilities = yield* purchaseRepo.getCapabilities(acceptorUserId);

		return {
			tokenStatus,
			initiator: {
				name: qrToken.initiatorName,
				...initiatorArchetype,
			},
			acceptor: {
				overallConfidence: acceptorConfidence,
				availableCredits: capabilities.availableCredits,
				hasCompletedAssessment,
			},
		} satisfies QrTokenDetailsOutput;
	});
