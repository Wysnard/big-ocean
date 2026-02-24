/**
 * OG Image Handler
 *
 * Generates dynamic Open Graph images for public profiles.
 * Generates SVG internally, converts to PNG via @resvg/resvg-js.
 * Route: GET /api/og/public-profile/:publicProfileId
 */

import type { IncomingMessage, ServerResponse } from "node:http";
import { Resvg } from "@resvg/resvg-js";

const API_URL_INTERNAL = process.env.INTERNAL_API_URL ?? "http://localhost:4000";

/**
 * Trait colors as hex — resvg only supports SVG 1.1 / CSS 2.1 colors (no oklch).
 * Values derived from the oklch tokens in packages/ui/src/styles/globals.css.
 */
const TRAIT_COLORS: Record<string, string> = {
	openness: "#A855F7",
	conscientiousness: "#FF6B2B",
	extraversion: "#FF0080",
	agreeableness: "#00B4A6",
	neuroticism: "#1c1c9c",
};

type ProfileData = {
	archetypeName: string;
	oceanCode: string;
	displayName: string | null;
	traitSummary: Record<string, string>;
	facets: Record<string, { score: number; confidence: number }>;
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

function generateOgSvg(profile: ProfileData): string {
	const traitScores = deriveTraitScores(profile.facets);
	const dominantTrait =
		Object.entries(traitScores).sort(([, a], [, b]) => b - a)[0]?.[0] ?? "openness";
	const dominantColor = TRAIT_COLORS[dominantTrait] ?? TRAIT_COLORS.openness;

	const traitOrder = [
		"openness",
		"conscientiousness",
		"extraversion",
		"agreeableness",
		"neuroticism",
	];
	const oceanLetters = profile.oceanCode.split("").map((letter, i) => {
		const trait = traitOrder[i] ?? "openness";
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
  <!-- Background -->
  <rect width="1200" height="630" fill="#0a0a0f"/>

  <!-- Dominant trait decorative shapes -->
  <circle cx="1050" cy="120" r="280" fill="${dominantColor}" opacity="0.18"/>
  <circle cx="150" cy="520" r="180" fill="${dominantColor}" opacity="0.1"/>

  <!-- Profile label -->
  <text x="100" y="140" font-family="system-ui, -apple-system, sans-serif" font-size="18"
    font-weight="700" fill="rgba(255,255,255,0.5)" letter-spacing="4">
    ${displayLabel}
  </text>

  <!-- Archetype name -->
  <text x="100" y="240" font-family="system-ui, -apple-system, sans-serif" font-size="72"
    font-weight="700" fill="white" dominant-baseline="auto">
    ${escapeXml(profile.archetypeName)}
  </text>

  <!-- OCEAN code — each letter in trait color -->
  ${oceanLetters
			.map(
				({ letter, color, x }) =>
					`<text x="${x}" y="340" font-family="ui-monospace, 'Courier New', monospace" font-size="48"
      font-weight="700" fill="${color}" letter-spacing="8">${escapeXml(letter)}</text>`,
			)
			.join("\n  ")}

  <!-- big-ocean wordmark -->
  <text x="100" y="580" font-family="system-ui, -apple-system, sans-serif" font-size="16"
    fill="rgba(255,255,255,0.4)" letter-spacing="2">big-ocean</text>
</svg>`;
}

export async function handleOgImage(
	_req: IncomingMessage,
	res: ServerResponse,
	publicProfileId: string,
): Promise<void> {
	try {
		const profileRes = await fetch(`${API_URL_INTERNAL}/api/public-profile/${publicProfileId}`, {
			headers: { "Content-Type": "application/json" },
		});

		if (!profileRes.ok) {
			res.writeHead(404, { "Content-Type": "text/plain" });
			res.end("Profile not found");
			return;
		}

		const profile = (await profileRes.json()) as ProfileData;
		const svg = generateOgSvg(profile);

		const resvg = new Resvg(svg, {
			fitTo: { mode: "width", value: 1200 },
		});
		const pngData = resvg.render();
		const pngBuffer = pngData.asPng();

		res.writeHead(200, {
			"Content-Type": "image/png",
			"Cache-Control": "public, max-age=86400, stale-while-revalidate=3600",
			"Content-Length": pngBuffer.length.toString(),
		});
		res.end(pngBuffer);
	} catch {
		res.writeHead(500, { "Content-Type": "text/plain" });
		res.end("Failed to generate OG image");
	}
}
