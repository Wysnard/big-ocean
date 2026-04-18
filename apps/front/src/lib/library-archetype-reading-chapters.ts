import type { LibraryReadingChapter } from "@/components/library/LibraryReadingRail";
import type { ArchetypeSlug } from "./library-archetype-article-meta";

export const ARCHETYPE_READING_CHAPTERS: Record<ArchetypeSlug, readonly LibraryReadingChapter[]> = {
	"anchor-personality-archetype": [
		{ id: "overview", label: "Overview" },
		{ id: "strengths", label: "Strengths" },
		{ id: "growth-areas", label: "Growth areas" },
		{ id: "compatible-archetypes", label: "Compatible archetypes" },
	],
	"beacon-personality-archetype": [
		{ id: "overview", label: "Overview" },
		{ id: "strengths", label: "Strengths" },
		{ id: "growth-areas", label: "Growth areas" },
		{ id: "compatible-archetypes", label: "Compatible archetypes" },
	],
	"compass-personality-archetype": [
		{ id: "overview", label: "Overview" },
		{ id: "strengths", label: "Strengths" },
		{ id: "growth-areas", label: "Growth areas" },
		{ id: "compatible-archetypes", label: "Compatible archetypes" },
	],
	"ember-personality-archetype": [
		{ id: "overview", label: "Overview" },
		{ id: "strengths", label: "Strengths" },
		{ id: "growth-areas", label: "Growth areas" },
		{ id: "compatible-archetypes", label: "Compatible archetypes" },
	],
	"forge-personality-archetype": [
		{ id: "overview", label: "Overview" },
		{ id: "strengths", label: "Strengths" },
		{ id: "growth-areas", label: "Growth areas" },
		{ id: "compatible-archetypes", label: "Compatible archetypes" },
	],
};

export function getArchetypeReadingChapters(slug: ArchetypeSlug): readonly LibraryReadingChapter[] {
	return ARCHETYPE_READING_CHAPTERS[slug];
}
