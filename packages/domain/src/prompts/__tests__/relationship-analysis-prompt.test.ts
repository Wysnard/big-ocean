import { describe, expect, it } from "vitest";
import { ALL_FACETS } from "../../constants/big-five";
import type { FacetName, FacetScoresMap } from "../../types/facet-evidence";
import { buildRelationshipAnalysisPrompt } from "../relationship-analysis.prompt";

function makeFacetScoresMap(score: number, confidence: number): FacetScoresMap {
	const map = {} as Record<FacetName, { score: number; confidence: number }>;
	for (const facet of ALL_FACETS) {
		map[facet] = { score, confidence };
	}
	return map;
}

const baseInput = {
	userAFacetScores: makeFacetScoresMap(12, 70),
	userAEvidence: [
		{
			id: "ev-1",
			sessionId: "session-1",
			messageId: "msg-1",
			bigfiveFacet: "imagination" as const,
			deviation: 2,
			strength: "strong" as const,
			confidence: "high" as const,
			domain: "work",
			note: "Shows vivid creative thinking",
			createdAt: new Date("2026-01-01"),
		},
	],
	userAName: "Alice",
	userBFacetScores: makeFacetScoresMap(8, 60),
	userBEvidence: [
		{
			id: "ev-2",
			sessionId: "session-2",
			messageId: "msg-2",
			bigfiveFacet: "altruism" as const,
			deviation: 1,
			strength: "moderate" as const,
			confidence: "medium" as const,
			domain: "relationships",
			note: "Consistently puts others first",
			createdAt: new Date("2026-01-01"),
		},
	],
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

	it("system prompt contains spine format JSON output instructions", () => {
		const { systemPrompt } = buildRelationshipAnalysisPrompt(baseInput);
		expect(systemPrompt).toContain("JSON");
		expect(systemPrompt).toContain("emoji");
		expect(systemPrompt).toContain("title");
		expect(systemPrompt).toContain("paragraphs");
	});

	it("system prompt contains safety guardrails for complementary framing", () => {
		const { systemPrompt } = buildRelationshipAnalysisPrompt(baseInput);
		expect(systemPrompt).toContain("blame");
		expect(systemPrompt).toContain("vulnerability");
		expect(systemPrompt).toContain("transcript");
	});

	it("system prompt references Nerin persona", () => {
		const { systemPrompt } = buildRelationshipAnalysisPrompt(baseInput);
		expect(systemPrompt).toContain("Nerin");
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

	it("system prompt instructs no raw scores in output", () => {
		const { systemPrompt } = buildRelationshipAnalysisPrompt(baseInput);
		expect(systemPrompt).toContain("Never expose raw scores");
	});
});
