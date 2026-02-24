/**
 * Archetype Card Handler
 *
 * Generates shareable archetype card images (PNG).
 * Handled at node:http layer (like OG images) since Effect/Platform
 * HttpApi doesn't natively support binary image responses.
 *
 * Route: GET /api/archetype-card/:publicProfileId?format=9:16|1:1
 */

import { readFileSync } from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import { resolve } from "node:path";
import { Resvg } from "@resvg/resvg-js";
import satori from "satori";

const API_URL_INTERNAL = process.env.INTERNAL_API_URL ?? "http://localhost:4000";

/**
 * Trait colors — consistent with OG handler
 */
const TRAIT_COLORS: Record<string, string> = {
	openness: "#A855F7",
	conscientiousness: "#FF6B2B",
	extraversion: "#FF0080",
	agreeableness: "#00B4A6",
	neuroticism: "#1c1c9c",
};

const TRAIT_ORDER = [
	"openness",
	"conscientiousness",
	"extraversion",
	"agreeableness",
	"neuroticism",
];

type ProfileData = {
	archetypeName: string;
	oceanCode: string;
	displayName: string | null;
	traitSummary: Record<string, string>;
	facets: Record<string, { score: number; confidence: number }>;
	color: string;
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

/**
 * Load Inter Bold font for Satori
 */
let cachedFontData: ArrayBuffer | null = null;
function getFontData(): ArrayBuffer {
	if (cachedFontData) return cachedFontData;
	const fontPath = resolve(process.cwd(), "assets/fonts/Inter-Bold.ttf");
	const buffer = readFileSync(fontPath);
	cachedFontData = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
	return cachedFontData;
}

function buildCard(input: {
	archetypeName: string;
	oceanCode: string;
	displayName: string | null;
	traitScores: Record<string, number>;
	dominantColor: string;
	width: number;
	height: number;
}) {
	const { archetypeName, oceanCode, displayName, traitScores, dominantColor, width, height } = input;
	const isStory = height > width;
	const oceanLetters = oceanCode.split("").slice(0, 5);
	const displayLabel = displayName
		? `${displayName.toUpperCase()}'S PERSONALITY`
		: "PERSONALITY ARCHETYPE";

	const nameSize = isStory ? 96 : 72;
	const codeSize = isStory ? 72 : 56;
	const labelSize = isStory ? 28 : 22;
	const gap = isStory ? 48 : 32;
	const shapeBaseSize = isStory ? 24 : 20;
	const shapeMaxExtra = isStory ? 40 : 32;

	return {
		type: "div",
		props: {
			style: {
				width: `${width}px`,
				height: `${height}px`,
				background: "#0a0a0f",
				display: "flex",
				flexDirection: "column",
				justifyContent: "center",
				alignItems: "center",
				position: "relative",
				overflow: "hidden",
			},
			children: [
				// Decorative circles
				{
					type: "div",
					props: {
						style: {
							position: "absolute",
							top: "-100px",
							right: "-100px",
							width: isStory ? "500px" : "400px",
							height: isStory ? "500px" : "400px",
							borderRadius: "50%",
							background: dominantColor,
							opacity: 0.15,
						},
					},
				},
				...(isStory
					? [
							{
								type: "div",
								props: {
									style: {
										position: "absolute",
										bottom: "-80px",
										left: "-80px",
										width: "350px",
										height: "350px",
										borderRadius: "50%",
										background: dominantColor,
										opacity: 0.08,
									},
								},
							},
						]
					: []),
				// Content
				{
					type: "div",
					props: {
						style: {
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
							gap: `${gap}px`,
							zIndex: 1,
						},
						children: [
							{
								type: "div",
								props: {
									style: {
										color: "rgba(255,255,255,0.5)",
										fontSize: `${labelSize}px`,
										fontWeight: 700,
										letterSpacing: "6px",
									},
									children: displayLabel,
								},
							},
							{
								type: "div",
								props: {
									style: {
										color: "white",
										fontSize: `${nameSize}px`,
										fontWeight: 700,
										textAlign: "center",
										maxWidth: "900px",
										lineHeight: 1.1,
									},
									children: archetypeName,
								},
							},
							{
								type: "div",
								props: {
									style: { display: "flex", gap: isStory ? "32px" : "24px" },
									children: oceanLetters.map((letter, i) => ({
										type: "div",
										props: {
											style: {
												color: TRAIT_COLORS[TRAIT_ORDER[i] ?? "openness"] ?? "#ffffff",
												fontSize: `${codeSize}px`,
												fontWeight: 700,
												fontFamily: "monospace",
												letterSpacing: "8px",
											},
											children: letter,
										},
									})),
								},
							},
							// Geometric shapes row
							{
								type: "div",
								props: {
									style: {
										display: "flex",
										gap: isStory ? "24px" : "20px",
										marginTop: "16px",
										alignItems: "center",
									},
									children: TRAIT_ORDER.map((trait, i) => {
										const score = traitScores[trait] ?? 60;
										const size = shapeBaseSize + (score / 120) * shapeMaxExtra;
										const color = TRAIT_COLORS[trait] ?? "#ffffff";
										if (i === 0)
											return {
												type: "div",
												props: {
													style: {
														width: `${size}px`,
														height: `${size}px`,
														borderRadius: "50%",
														background: color,
													},
												},
											};
										if (i === 4)
											return {
												type: "div",
												props: {
													style: {
														width: `${size}px`,
														height: `${size}px`,
														background: color,
														transform: "rotate(45deg)",
													},
												},
											};
										return {
											type: "div",
											props: {
												style: {
													width: `${size}px`,
													height: `${size * (i === 2 ? 0.7 : i === 3 ? 0.85 : 1)}px`,
													background: color,
													borderRadius: i === 1 ? `${size / 2}px ${size / 2}px 0 0` : "3px",
												},
											},
										};
									}),
								},
							},
							{
								type: "div",
								props: {
									style: {
										color: "rgba(255,255,255,0.3)",
										fontSize: isStory ? "24px" : "20px",
										letterSpacing: "4px",
										marginTop: isStory ? "64px" : "40px",
									},
									children: "big-ocean",
								},
							},
						],
					},
				},
			],
		},
	};
}

export async function handleArchetypeCard(
	_req: IncomingMessage,
	res: ServerResponse,
	publicProfileId: string,
	format: "9:16" | "1:1",
): Promise<void> {
	try {
		// Fetch profile data via internal API
		const profileRes = await fetch(`${API_URL_INTERNAL}/api/public-profile/${publicProfileId}`, {
			headers: { "Content-Type": "application/json" },
		});

		if (profileRes.status === 404) {
			res.writeHead(404, { "Content-Type": "text/plain" });
			res.end("Profile not found");
			return;
		}

		if (profileRes.status === 403) {
			res.writeHead(403, { "Content-Type": "text/plain" });
			res.end("Profile is private");
			return;
		}

		if (!profileRes.ok) {
			res.writeHead(500, { "Content-Type": "text/plain" });
			res.end("Failed to fetch profile");
			return;
		}

		const profile = (await profileRes.json()) as ProfileData;
		const traitScores = deriveTraitScores(profile.facets);
		const dominantTrait =
			Object.entries(traitScores).sort(([, a], [, b]) => b - a)[0]?.[0] ?? "openness";
		const dominantColor = TRAIT_COLORS[dominantTrait] ?? "#A855F7";

		const width = 1080;
		const height = format === "9:16" ? 1920 : 1080;

		const fontData = getFontData();

		const jsx = buildCard({
			archetypeName: profile.archetypeName,
			oceanCode: profile.oceanCode,
			displayName: profile.displayName,
			traitScores,
			dominantColor,
			width,
			height,
		});

		const svg = await satori(jsx as any, {
			width,
			height,
			fonts: [{ name: "Inter", data: fontData, weight: 700, style: "normal" as const }],
		});

		const resvg = new Resvg(svg, { fitTo: { mode: "width" as const, value: width } });
		const pngData = resvg.render();
		const pngBuffer = pngData.asPng();

		res.writeHead(200, {
			"Content-Type": "image/png",
			"Cache-Control": "public, immutable, max-age=31536000",
			"Content-Length": pngBuffer.length.toString(),
		});
		res.end(Buffer.from(pngBuffer));
	} catch {
		res.writeHead(500, { "Content-Type": "text/plain" });
		res.end("Failed to generate archetype card");
	}
}
