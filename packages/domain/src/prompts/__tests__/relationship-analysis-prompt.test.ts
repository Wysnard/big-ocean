import { describe, expect, it } from "vitest";
import { ALL_FACETS } from "../../constants/big-five";
import type { FacetName, FacetScoresMap, SavedFacetEvidence } from "../../types/facet-evidence";
import { buildRelationshipAnalysisPrompt } from "../relationship-analysis.prompt";

function makeFacetScoresMap(score: number, confidence: number): FacetScoresMap {
	const map = {} as Record<FacetName, { score: number; confidence: number }>;
	for (const facet of ALL_FACETS) {
		map[facet] = { score, confidence };
	}
	return map;
}

function makeEvidence(facetName: FacetName): SavedFacetEvidence {
	return {
		id: "ev-1",
		assessmentMessageId: "msg-1",
		facetName,
		score: 15,
		confidence: 80,
		quote: "I love exploring new ideas",
		highlightRange: { start: 0, end: 10 },
		createdAt: new Date("2026-01-01"),
	};
}

const baseInput = {
	userAFacetScores: makeFacetScoresMap(12, 70),
	userAEvidence: [makeEvidence("imagination")],
	userAName: "Alice",
	userBFacetScores: makeFacetScoresMap(8, 60),
	userBEvidence: [makeEvidence("altruism")],
	userBName: "Bob",
};

describe("buildRelationshipAnalysisPrompt", () => {
	it("returns systemPrompt and userPrompt as non-empty strings", () => {
		const result = buildRelationshipAnalysisPrompt(baseInput);
		expect(result.systemPrompt).toBeTruthy();
		expect(result.userPrompt).toBeTruthy();
		expect(typeof result.systemPrompt).toBe("string");
		expect(typeof result.userPrompt).toBe("string");
	});

	it("system prompt contains role definition and section structure", () => {
		const { systemPrompt } = buildRelationshipAnalysisPrompt(baseInput);
		expect(systemPrompt).toContain("Nerin");
		expect(systemPrompt).toContain("# The Dynamic Between You");
		expect(systemPrompt).toContain("## Where You Meet");
		expect(systemPrompt).toContain("## Where You Complement");
		expect(systemPrompt).toContain("## Where You Might Clash");
	});

	it("user prompt contains both user names", () => {
		const { userPrompt } = buildRelationshipAnalysisPrompt(baseInput);
		expect(userPrompt).toContain("Alice");
		expect(userPrompt).toContain("Bob");
	});

	it("user prompt contains facet score data", () => {
		const { userPrompt } = buildRelationshipAnalysisPrompt(baseInput);
		expect(userPrompt).toContain("FACET SCORES");
		expect(userPrompt).toContain("imagination");
		expect(userPrompt).toContain("score=12");
		expect(userPrompt).toContain("confidence=70");
	});
});
