/**
 * Get Assessment Results Use Case
 *
 * Business logic for getting final assessment results.
 * Calculates personality archetype based on trait scores.
 */

import { AssessmentSessionRepository, LoggerRepository } from "@workspace/domain";
import { Effect } from "effect";

export interface GetResultsInput {
	readonly sessionId: string;
}

export interface GetResultsOutput {
	readonly oceanCode: string;
	readonly archetypeName: string;
	readonly traits: {
		readonly openness: number;
		readonly conscientiousness: number;
		readonly extraversion: number;
		readonly agreeableness: number;
		readonly neuroticism: number;
	};
}

/**
 * Calculate OCEAN code from trait scores
 * Each trait is classified as High (H) or Low (L) based on 0.5 threshold
 */
const calculateOceanCode = (traits: {
	openness: number;
	conscientiousness: number;
	extraversion: number;
	agreeableness: number;
	neuroticism: number;
}): string => {
	const o = traits.openness >= 0.5 ? "H" : "L";
	const c = traits.conscientiousness >= 0.5 ? "H" : "L";
	const e = traits.extraversion >= 0.5 ? "H" : "L";
	const a = traits.agreeableness >= 0.5 ? "H" : "L";
	const n = traits.neuroticism >= 0.5 ? "H" : "L";

	return `${o}${c}${e}${a}${n}`;
};

/**
 * Get archetype name based on OCEAN code
 * TODO: Replace with actual archetype mapping from domain
 */
const getArchetypeName = (oceanCode: string): string => {
	// Placeholder - will be replaced with actual archetype mapping
	const archetypeMap: Record<string, string> = {
		HHHHH: "The Idealist",
		HHHHL: "The Innovator",
		HHHLL: "The Visionary",
		// Add more mappings...
	};

	return archetypeMap[oceanCode] || "Unknown Archetype";
};

/**
 * Get Assessment Results Use Case
 *
 * Dependencies: AssessmentSessionRepository, LoggerRepository
 * Returns: Ocean code, archetype name, and trait scores
 */
export const getResults = (input: GetResultsInput) =>
	Effect.gen(function* () {
		const sessionRepo = yield* AssessmentSessionRepository;
		const logger = yield* LoggerRepository;

		// Get session
		const session = yield* sessionRepo.getSession(input.sessionId);

		// Calculate OCEAN code
		const oceanCode = calculateOceanCode(session.precision);

		// Get archetype name
		const archetypeName = getArchetypeName(oceanCode);

		logger.info("Assessment results generated", {
			sessionId: input.sessionId,
			oceanCode,
			archetypeName,
		});

		return {
			oceanCode,
			archetypeName,
			traits: session.precision,
		};
	});
