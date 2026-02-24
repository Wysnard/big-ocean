/**
 * Card Generation Utilities
 *
 * Shared helpers for archetype card and OG image generation routes.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export type ProfileData = {
	archetypeName: string;
	oceanCode: string;
	displayName: string | null;
	traitSummary: Record<string, string>;
	facets: Record<string, { score: number; confidence: number }>;
	color: string;
};

export const TRAIT_COLORS: Record<string, string> = {
	openness: "#A855F7",
	conscientiousness: "#FF6B2B",
	extraversion: "#FF0080",
	agreeableness: "#00B4A6",
	neuroticism: "#1c1c9c",
};

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

export function deriveTraitScores(facets: ProfileData["facets"]): Record<string, number> {
	const scores: Record<string, number> = {};
	for (const [trait, facetNames] of Object.entries(TRAIT_FACETS)) {
		scores[trait] = facetNames.reduce((sum, f) => sum + (facets[f]?.score ?? 0), 0);
	}
	return scores;
}

export function getDominantColor(traitScores: Record<string, number>): string {
	const dominantTrait =
		Object.entries(traitScores).sort(([, a], [, b]) => b - a)[0]?.[0] ?? "openness";
	return TRAIT_COLORS[dominantTrait] ?? "#A855F7";
}

let cachedFontData: ArrayBuffer | null = null;
export function getFontData(): ArrayBuffer {
	if (cachedFontData) return cachedFontData;
	// Try multiple paths: relative to cwd (dev), and relative to this file (build)
	const candidates = [
		resolve(process.cwd(), "assets/fonts/Inter-Bold.ttf"),
		resolve(process.cwd(), "apps/front/assets/fonts/Inter-Bold.ttf"),
	];
	let buffer: Buffer | null = null;
	for (const p of candidates) {
		try {
			buffer = readFileSync(p);
			break;
		} catch {
			// try next
		}
	}
	if (!buffer) {
		throw new Error(`Inter-Bold.ttf not found in: ${candidates.join(", ")}`);
	}
	// Create a clean ArrayBuffer copy (Node Buffer may share underlying memory)
	const ab = new ArrayBuffer(buffer.length);
	new Uint8Array(ab).set(buffer);
	cachedFontData = ab;
	return cachedFontData;
}

const API_URL = process.env.VITE_API_URL ?? "http://localhost:4000";

export async function fetchProfileData(
	publicProfileId: string,
): Promise<{ profile: ProfileData | null; status: number }> {
	const res = await fetch(`${API_URL}/api/public-profile/${publicProfileId}`, {
		headers: { "Content-Type": "application/json" },
	});

	if (!res.ok) {
		return { profile: null, status: res.status };
	}

	const profile = (await res.json()) as ProfileData;
	return { profile, status: 200 };
}
