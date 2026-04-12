import type { AssessmentResultRecord } from "@workspace/domain";
import type { ExchangeRecord } from "@workspace/domain/repositories/exchange.repository";
import { describe, expect, it } from "vitest";
import { deriveCheckInTheme, deriveDropOffTopic } from "../lifecycle-email-copy";

const makeExchange = (overrides?: Partial<ExchangeRecord>): ExchangeRecord => ({
	id: "ex-1",
	conversationId: "conv-1",
	turnNumber: 1,
	extractionTier: null,
	directorOutput: null,
	coverageTargets: null,
	createdAt: new Date(),
	...overrides,
});

describe("deriveDropOffTopic", () => {
	it("derives topic from exchange with facet + domain", () => {
		const exchanges = [
			makeExchange({
				coverageTargets: { primaryFacet: "imagination", candidateDomains: ["relationships"] },
			}),
		];
		expect(deriveDropOffTopic(exchanges)).toBe(
			"how imagination shows up in your close relationships",
		);
	});

	it("derives topic from facet only", () => {
		const exchanges = [makeExchange({ coverageTargets: { primaryFacet: "orderliness" } })];
		expect(deriveDropOffTopic(exchanges)).toBe("the pull of orderliness in you");
	});

	it("derives topic from domain only", () => {
		const exchanges = [makeExchange({ coverageTargets: { candidateDomains: ["health"] } })];
		expect(deriveDropOffTopic(exchanges)).toBe("what keeps surfacing in your energy and self-care");
	});

	it("falls back to normalised director output when no coverage targets", () => {
		const exchanges = [makeExchange({ directorOutput: "Explore your relationship with creativity" })];
		expect(deriveDropOffTopic(exchanges)).toBe("your relationship with creativity");
	});

	it("strips verb prefix and lowercases director output", () => {
		const exchanges = [makeExchange({ directorOutput: "Dig into anxiety levels" })];
		// After fix: bare noun phrases are returned as-is (no 'how' prefix)
		expect(deriveDropOffTopic(exchanges)).toBe("anxiety levels");
	});

	it("returns generic fallback when exchanges are empty", () => {
		expect(deriveDropOffTopic([])).toBe("the thread you had just started to pull on");
	});

	it("returns generic fallback when exchange has no relevant data", () => {
		const exchanges = [makeExchange()];
		expect(deriveDropOffTopic(exchanges)).toBe("the thread you had just started to pull on");
	});

	it("uses latest relevant exchange, not earliest", () => {
		const exchanges = [
			makeExchange({
				turnNumber: 1,
				coverageTargets: { primaryFacet: "trust" },
			}),
			makeExchange({
				id: "ex-2",
				turnNumber: 2,
				coverageTargets: { primaryFacet: "assertiveness", candidateDomains: ["work"] },
			}),
		];
		expect(deriveDropOffTopic(exchanges)).toBe("how assertiveness shows up in work and ambition");
	});

	it("handles unknown domain with humanized fallback", () => {
		const exchanges = [
			makeExchange({
				coverageTargets: { primaryFacet: "intellect", candidateDomains: ["custom_domain"] },
			}),
		];
		expect(deriveDropOffTopic(exchanges)).toBe("how intellect shows up in your custom domain");
	});
});

describe("deriveCheckInTheme", () => {
	it("prefers exchange data over assessment result", () => {
		const exchanges = [
			makeExchange({
				coverageTargets: { primaryFacet: "imagination", candidateDomains: ["relationships"] },
			}),
		];
		const result: AssessmentResultRecord = {
			id: "ar-1",
			conversationId: "conv-1",
			facets: {} as any,
			traits: { openness: { score: 90, confidence: 90 } } as any,
			domainCoverage: { health: 0.8 } as any,
			portrait: "test portrait",
			stage: "completed",
			createdAt: new Date(),
		};
		expect(deriveCheckInTheme(exchanges, result)).toBe(
			"how imagination shows up in your close relationships",
		);
	});

	it("falls back to assessment result when no exchange data", () => {
		const result: AssessmentResultRecord = {
			id: "ar-1",
			conversationId: "conv-1",
			facets: {} as any,
			traits: { openness: { score: 88, confidence: 92 } } as any,
			domainCoverage: { health: 0.72 } as any,
			portrait: "test",
			stage: "completed",
			createdAt: new Date(),
		};
		expect(deriveCheckInTheme([], result)).toBe(
			"how your openness keeps shaping your energy and self-care",
		);
	});

	it("falls back to trait-only when no domain coverage", () => {
		const result: AssessmentResultRecord = {
			id: "ar-1",
			conversationId: "conv-1",
			facets: {} as any,
			traits: { neuroticism: { score: 95, confidence: 80 } } as any,
			domainCoverage: {} as any,
			portrait: "test",
			stage: "completed",
			createdAt: new Date(),
		};
		expect(deriveCheckInTheme([], result)).toBe("the way your neuroticism keeps steering you");
	});

	it("falls back to domain-only when no trait scores", () => {
		const result: AssessmentResultRecord = {
			id: "ar-1",
			conversationId: "conv-1",
			facets: {} as any,
			traits: {} as any,
			domainCoverage: { relationships: 0.9 } as any,
			portrait: "test",
			stage: "completed",
			createdAt: new Date(),
		};
		expect(deriveCheckInTheme([], result)).toBe("what keeps surfacing in your close relationships");
	});

	it("falls back to generic theme when assessment result is null", () => {
		expect(deriveCheckInTheme([], null)).toBe("the part of you that's still unfolding");
	});

	it("falls back to generic theme when assessment result has empty traits and domains", () => {
		const result: AssessmentResultRecord = {
			id: "ar-1",
			conversationId: "conv-1",
			facets: {} as any,
			traits: {} as any,
			domainCoverage: {} as any,
			portrait: "test",
			stage: "completed",
			createdAt: new Date(),
		};
		expect(deriveCheckInTheme([], result)).toBe("the part of you that's still unfolding");
	});
});
