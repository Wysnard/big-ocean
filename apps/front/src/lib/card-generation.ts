/**
 * Card Generation Utilities
 *
 * Shared utilities for archetype card and OG image generation.
 * Used by both the archetype card server function and the OG image route.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Trait hex colors for Satori rendering (no CSS variables in server-side SVG).
 * Mirrors the design system trait colors.
 */
export const TRAIT_COLORS: Record<string, string> = {
	openness: "#A855F7",
	conscientiousness: "#FF6B2B",
	extraversion: "#FF0080",
	agreeableness: "#00B4A6",
	neuroticism: "#1c1c9c",
};

export const TRAIT_ORDER = [
	"openness",
	"conscientiousness",
	"extraversion",
	"agreeableness",
	"neuroticism",
] as const;

const TRAIT_FACETS: Record<string, string[]> = {
	openness: [
		"imagination",
		"artisticInterests",
		"emotionality",
		"adventurousness",
		"intellect",
		"liberalism",
	],
	conscientiousness: [
		"selfEfficacy",
		"orderliness",
		"dutifulness",
		"achievementStriving",
		"selfDiscipline",
		"cautiousness",
	],
	extraversion: [
		"friendliness",
		"gregariousness",
		"assertiveness",
		"activityLevel",
		"excitementSeeking",
		"positivity",
	],
	agreeableness: ["trust", "morality", "altruism", "cooperation", "modesty", "sympathy"],
	neuroticism: [
		"anxiety",
		"anger",
		"depression",
		"selfConsciousness",
		"immoderation",
		"vulnerability",
	],
};

export type ProfileFacets = Record<string, { score: number; confidence: number }>;

/**
 * Derives trait scores (0-120) from facet score map by summing each trait's 6 facets.
 */
export function deriveTraitScores(facets: ProfileFacets): Record<string, number> {
	const scores: Record<string, number> = {};
	for (const [trait, facetNames] of Object.entries(TRAIT_FACETS)) {
		scores[trait] = facetNames.reduce((sum, f) => sum + (facets[f]?.score ?? 0), 0);
	}
	return scores;
}

/**
 * Returns the hex color of the highest-scoring trait.
 */
export function getDominantColor(traitScores: Record<string, number>): string {
	const dominantTrait =
		Object.entries(traitScores).sort(([, a], [, b]) => b - a)[0]?.[0] ?? "openness";
	return TRAIT_COLORS[dominantTrait] ?? "#A855F7";
}

let _fontData: ArrayBuffer | null = null;

/**
 * Reads the Inter Bold font from disk and caches it.
 * Font is required by Satori for text rendering.
 */
export function getFontData(): ArrayBuffer {
	if (_fontData) return _fontData;
	const fontPath = resolve(process.cwd(), "assets/fonts/Inter-Bold.ttf");
	const buffer = readFileSync(fontPath);
	_fontData = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
	return _fontData;
}

export type ProfileData = {
	archetypeName: string;
	oceanCode: string;
	displayName: string | null;
	facets: ProfileFacets;
};

/**
 * Fetches public profile data from the API backend.
 */
export async function fetchProfileData(
	publicProfileId: string,
): Promise<{ profile: ProfileData | null; status: number }> {
	const API_URL = process.env.VITE_API_URL ?? "http://localhost:4000";

	const res = await fetch(`${API_URL}/api/public-profile/${publicProfileId}`, {
		headers: { "Content-Type": "application/json" },
	});

	if (!res.ok) {
		return { profile: null, status: res.status };
	}

	const profile = (await res.json()) as ProfileData;
	return { profile, status: 200 };
}
