/**
 * OG Image API Route (Nitro)
 *
 * Generates Open Graph images for public profiles (1200x630 PNG).
 * Endpoint: GET /api/og/public-profile/:publicProfileId
 *
 * Must be a real HTTP endpoint (not a server function) because social media
 * crawlers fetch og:image URLs directly.
 */

import { defineHandler, getRouterParam } from "h3";
import { Resvg } from "@resvg/resvg-js";

const API_URL = process.env.VITE_API_URL ?? "http://localhost:4000";

const TRAIT_COLORS: Record<string, string> = {
	openness: "#A855F7",
	conscientiousness: "#FF6B2B",
	extraversion: "#FF0080",
	agreeableness: "#00B4A6",
	neuroticism: "#1c1c9c",
};

const TRAIT_ORDER = ["openness", "conscientiousness", "extraversion", "agreeableness", "neuroticism"];

const TRAIT_FACETS: Record<string, string[]> = {
	openness: ["imagination", "artisticInterests", "emotionality", "adventurousness", "intellect", "liberalism"],
	conscientiousness: ["selfEfficacy", "orderliness", "dutifulness", "achievementStriving", "selfDiscipline", "cautiousness"],
	extraversion: ["friendliness", "gregariousness", "assertiveness", "activityLevel", "excitementSeeking", "positivity"],
	agreeableness: ["trust", "morality", "altruism", "cooperation", "modesty", "sympathy"],
	neuroticism: ["anxiety", "anger", "depression", "selfConsciousness", "immoderation", "vulnerability"],
};

type ProfileData = {
	archetypeName: string;
	oceanCode: string;
	displayName: string | null;
	facets: Record<string, { score: number; confidence: number }>;
};

function deriveTraitScores(facets: ProfileData["facets"]): Record<string, number> {
	const scores: Record<string, number> = {};
	for (const [trait, facetNames] of Object.entries(TRAIT_FACETS)) {
		scores[trait] = facetNames.reduce((sum, f) => sum + (facets[f]?.score ?? 0), 0);
	}
	return scores;
}

function escapeXml(str: string): string {
	return str
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&apos;");
}

function generateOgSvg(profile: {
	archetypeName: string;
	oceanCode: string;
	displayName: string | null;
	traitScores: Record<string, number>;
}): string {
	const dominantTrait =
		Object.entries(profile.traitScores).sort(([, a], [, b]) => b - a)[0]?.[0] ?? "openness";
	const dominantColor = TRAIT_COLORS[dominantTrait] ?? TRAIT_COLORS.openness;

	const oceanLetters = profile.oceanCode.split("").map((letter, i) => {
		const trait = TRAIT_ORDER[i] ?? "openness";
		return {
			letter,
			color: TRAIT_COLORS[trait] ?? "#ffffff",
			x: 100 + i * 80,
		};
	});

	const displayLabel = profile.displayName
		? `${escapeXml(profile.displayName.toUpperCase())}'S PERSONALITY`
		: "PERSONALITY ARCHETYPE";

	return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#0a0a0f"/>
  <circle cx="1050" cy="120" r="280" fill="${dominantColor}" opacity="0.18"/>
  <circle cx="150" cy="520" r="180" fill="${dominantColor}" opacity="0.1"/>
  <text x="100" y="140" font-family="system-ui, -apple-system, sans-serif" font-size="18"
    font-weight="700" fill="rgba(255,255,255,0.5)" letter-spacing="4">
    ${displayLabel}
  </text>
  <text x="100" y="240" font-family="system-ui, -apple-system, sans-serif" font-size="72"
    font-weight="700" fill="white" dominant-baseline="auto">
    ${escapeXml(profile.archetypeName)}
  </text>
  ${oceanLetters
		.map(
			({ letter, color, x }) =>
				`<text x="${x}" y="340" font-family="ui-monospace, 'Courier New', monospace" font-size="48"
      font-weight="700" fill="${color}" letter-spacing="8">${escapeXml(letter)}</text>`,
		)
		.join("\n  ")}
  <text x="100" y="580" font-family="system-ui, -apple-system, sans-serif" font-size="16"
    fill="rgba(255,255,255,0.4)" letter-spacing="2">big-ocean</text>
</svg>`;
}

export default defineHandler(async (event) => {
	const publicProfileId = getRouterParam(event, "publicProfileId");

	if (!publicProfileId) {
		return new Response("Missing publicProfileId", {
			status: 400,
			headers: { "Content-Type": "text/plain" },
		});
	}

	const res = await fetch(`${API_URL}/api/public-profile/${publicProfileId}`, {
		headers: { "Content-Type": "application/json" },
	});

	if (!res.ok) {
		const status = res.status === 403 ? 403 : 404;
		return new Response(status === 404 ? "Profile not found" : "Profile is private", {
			status,
			headers: { "Content-Type": "text/plain" },
		});
	}

	const profile = (await res.json()) as ProfileData;
	const traitScores = deriveTraitScores(profile.facets);
	const svg = generateOgSvg({ ...profile, traitScores });

	const resvg = new Resvg(svg, {
		fitTo: { mode: "width", value: 1200 },
	});
	const pngData = resvg.render();
	const pngBuffer = pngData.asPng();

	return new Response(pngBuffer, {
		status: 200,
		headers: {
			"Content-Type": "image/png",
			"Cache-Control": "public, max-age=86400, stale-while-revalidate=3600",
			"Content-Length": String(pngBuffer.length),
		},
	});
});
