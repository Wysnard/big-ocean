import type { TraitName } from "@workspace/domain";
import type { LibraryReadingChapter } from "@/components/library/LibraryReadingRail";

export const TRAIT_READING_CHAPTERS: Record<TraitName, readonly LibraryReadingChapter[]> = {
	agreeableness: [
		{ id: "facet-map", label: "Facet map" },
		{ id: "across-the-spectrum", label: "Across the spectrum" },
		{ id: "scientific-definition", label: "Scientific definition" },
		{ id: "low-agreeableness-in-daily-life", label: "Low agreeableness in daily life" },
		{ id: "mid-range-agreeableness-in-daily-life", label: "Mid-range agreeableness in daily life" },
		{ id: "high-agreeableness-in-daily-life", label: "High agreeableness in daily life" },
		{ id: "facet-breakdown", label: "Facet breakdown" },
	],
	conscientiousness: [
		{ id: "facet-map", label: "Facet map" },
		{ id: "across-the-spectrum", label: "Across the spectrum" },
		{ id: "scientific-definition", label: "Scientific definition" },
		{ id: "low-conscientiousness-in-daily-life", label: "Low conscientiousness in daily life" },
		{
			id: "mid-range-conscientiousness-in-daily-life",
			label: "Mid-range conscientiousness in daily life",
		},
		{ id: "high-conscientiousness-in-daily-life", label: "High conscientiousness in daily life" },
		{ id: "facet-breakdown", label: "Facet breakdown" },
	],
	extraversion: [
		{ id: "facet-map", label: "Facet map" },
		{ id: "across-the-spectrum", label: "Across the spectrum" },
		{ id: "scientific-definition", label: "Scientific definition" },
		{ id: "low-extraversion-in-daily-life", label: "Low extraversion in daily life" },
		{ id: "mid-range-extraversion-in-daily-life", label: "Mid-range extraversion in daily life" },
		{ id: "high-extraversion-in-daily-life", label: "High extraversion in daily life" },
		{ id: "facet-breakdown", label: "Facet breakdown" },
	],
	neuroticism: [
		{ id: "facet-map", label: "Facet map" },
		{ id: "across-the-spectrum", label: "Across the spectrum" },
		{ id: "scientific-definition", label: "Scientific definition" },
		{ id: "low-neuroticism-in-daily-life", label: "Low neuroticism in daily life" },
		{ id: "mid-range-neuroticism-in-daily-life", label: "Mid-range neuroticism in daily life" },
		{ id: "high-neuroticism-in-daily-life", label: "High neuroticism in daily life" },
		{ id: "facet-breakdown", label: "Facet breakdown" },
	],
	openness: [
		{ id: "facet-map", label: "Facet map" },
		{ id: "across-the-spectrum", label: "Across the spectrum" },
		{ id: "scientific-definition", label: "Scientific definition" },
		{ id: "low-openness-in-daily-life", label: "Low openness in daily life" },
		{ id: "mid-range-openness-in-daily-life", label: "Mid-range openness in daily life" },
		{ id: "high-openness-in-daily-life", label: "High openness in daily life" },
		{ id: "facet-breakdown", label: "Facet breakdown" },
	],
};

export function getTraitReadingChapters(trait: TraitName): readonly LibraryReadingChapter[] {
	return TRAIT_READING_CHAPTERS[trait];
}
