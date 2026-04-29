import type { GetResultsResponse } from "@workspace/contracts";
import { describe, expect, it } from "vitest";
import {
	archetypeDisplayNameToLibrarySlug,
	selectRecommendedKeysFromResults,
} from "./library-recommended-path.pure";

describe("archetypeDisplayNameToLibrarySlug", () => {
	it("maps curated archetype titles to library slugs", () => {
		expect(archetypeDisplayNameToLibrarySlug("The Compass")).toBe("compass-personality-archetype");
		expect(archetypeDisplayNameToLibrarySlug("The Beacon")).toBe("beacon-personality-archetype");
	});

	it("returns undefined when the pattern does not match", () => {
		expect(archetypeDisplayNameToLibrarySlug("Explorer")).toBeUndefined();
	});
});

describe("selectRecommendedKeysFromResults", () => {
	const baseResults = {
		oceanCode5: "OCBPN",
		oceanCode4: "OCBP",
		archetypeDescription: "",
		archetypeColor: "#000000",
		isCurated: true,
		overallConfidence: 0.9,
		messageCount: 12,
		publicProfileId: "profile_test",
		shareableUrl: "https://example.com/public-profile/profile_test",
		isPublic: false,
		isLatestVersion: true,
	} satisfies Partial<GetResultsResponse>;

	it("uses archetype slug, most extreme trait, and a facet under that trait", () => {
		const results: GetResultsResponse = {
			...baseResults,
			archetypeName: "The Forge",
			traits: [
				{ name: "openness", score: 0.2, level: "OV", confidence: 0.8 },
				{ name: "neuroticism", score: -0.9, level: "NV", confidence: 0.85 },
				{ name: "extraversion", score: 0.1, level: "EV", confidence: 0.7 },
				{ name: "agreeableness", score: 0.0, level: "AV", confidence: 0.7 },
				{ name: "conscientiousness", score: 0.0, level: "CV", confidence: 0.7 },
			],
			facets: [
				{
					name: "anxiety",
					traitName: "neuroticism",
					score: -0.8,
					confidence: 0.9,
					level: "NV",
					levelLabel: "",
					levelDescription: "",
				},
				{
					name: "depression",
					traitName: "neuroticism",
					score: -0.5,
					confidence: 0.8,
					level: "NV",
					levelLabel: "",
					levelDescription: "",
				},
			],
		};

		expect(selectRecommendedKeysFromResults(results)).toEqual({
			archetypeSlug: "forge-personality-archetype",
			traitName: "neuroticism",
			facetName: "anxiety",
		});
	});
});
