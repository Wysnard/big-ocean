import { describe, expect, it } from "vitest";
import { ALL_FACETS } from "../../constants/big-five";
import type { UserSummaryRecord } from "../../repositories/user-summary.repository";
import type { FacetName, FacetScoresMap } from "../../types/facet-evidence";
import { buildRelationshipAnalysisPrompt } from "../relationship-analysis.prompt";

function makeFacetScoresMap(score: number, confidence: number): FacetScoresMap {
	const map = {} as Record<FacetName, { score: number; confidence: number }>;
	for (const facet of ALL_FACETS) {
		map[facet] = { score, confidence };
	}
	return map;
}

function makeUserSummary(overrides: Partial<UserSummaryRecord> = {}): UserSummaryRecord {
	const base: UserSummaryRecord = {
		id: "summary-1",
		userId: "user-1",
		assessmentResultId: "result-1",
		themes: [
			{
				theme: "Reflection",
				description: "Tends to process internally before acting.",
			},
		],
		quoteBank: [
			{
				quote: "I need to understand the whole picture first.",
				themeTag: "openness",
			},
		],
		summaryText: "A thoughtful, pattern-seeking orientation.",
		version: 1,
		createdAt: new Date("2026-01-01"),
		updatedAt: new Date("2026-01-01"),
	};
	return { ...base, ...overrides };
}

const baseInput = {
	userAFacetScores: makeFacetScoresMap(12, 70),
	userAUserSummary: makeUserSummary({ id: "us-a", userId: "alice", assessmentResultId: "res-a" }),
	userAName: "Alice",
	userBFacetScores: makeFacetScoresMap(8, 60),
	userBUserSummary: makeUserSummary({ id: "us-b", userId: "bob", assessmentResultId: "res-b" }),
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
		expect(systemPrompt).toContain("transcript");
		expect(systemPrompt).toContain("Never invent or paraphrase");
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

	it("user prompt contains UserSummary narrative and themes", () => {
		const { userPrompt } = buildRelationshipAnalysisPrompt(baseInput);
		expect(userPrompt).toContain("NARRATIVE:");
		expect(userPrompt).toContain("A thoughtful, pattern-seeking orientation.");
		expect(userPrompt).toContain("**Reflection**");
		expect(userPrompt).toContain("CURATED QUOTE EXCERPTS");
		expect(userPrompt).toContain("understand the whole picture");
	});

	it("system prompt instructs no raw scores in output", () => {
		const { systemPrompt } = buildRelationshipAnalysisPrompt(baseInput);
		expect(systemPrompt).toContain("Never expose raw scores");
	});
});
