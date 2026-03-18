/**
 * Archetype Card Image API Route (Nitro)
 *
 * Generates static archetype card PNG images keyed by 4-letter OCEAN code.
 * Each archetype (81 total) gets one generic card — not personalized per user.
 *
 * Endpoint: GET /api/archetype-card/:code4?format=og|story
 * - og: 1200x630px (1.91:1 for OG link previews) — default
 * - story: 1080x1920px (9:16 for social stories)
 *
 * Cache: immutable, max-age=31536000 (cards are static per archetype)
 */

import { defineHandler, getQuery, getRouterParam } from "h3";
import { CURATED_ARCHETYPES, lookupArchetype } from "@workspace/domain";
import { Resvg } from "@resvg/resvg-js";

/** Truncate description to ~2 sentences (max ~160 chars) for card display */
function getShortDescription(description: string): string {
	// Find the second sentence boundary
	const sentences = description.match(/[^.!?]+[.!?]+/g) ?? [];
	if (sentences.length <= 2) return description;
	const twoSentences = sentences.slice(0, 2).join("").trim();
	if (twoSentences.length <= 200) return twoSentences;
	// If 2 sentences are still too long, take 1
	return (sentences[0] ?? description.slice(0, 160)).trim();
}

export default defineHandler(async (event) => {
	const code4 = getRouterParam(event, "code4");
	const query = getQuery(event);
	const format = (query.format as string) ?? "og";

	if (!code4) {
		return new Response("Missing code4 parameter", {
			status: 400,
			headers: { "Content-Type": "text/plain" },
		});
	}

	// Validate code4
	const curated = CURATED_ARCHETYPES[code4];
	if (!curated) {
		return new Response(`Unknown archetype code: ${code4}`, {
			status: 404,
			headers: { "Content-Type": "text/plain" },
		});
	}

	// Look up the full archetype via domain utility
	let archetype: ReturnType<typeof lookupArchetype>;
	try {
		archetype = lookupArchetype(code4);
	} catch {
		return new Response(`Invalid archetype code: ${code4}`, {
			status: 404,
			headers: { "Content-Type": "text/plain" },
		});
	}

	const width = format === "story" ? 1080 : 1200;
	const height = format === "story" ? 1920 : 630;

	// Dynamic imports to keep native modules out of client bundle
	const [{ default: satori }, { ArchetypeCardTemplate }] = await Promise.all([
		import("satori"),
		import("../../../../src/components/sharing/archetype-card-template"),
	]);

	// Read font data
	const { readFileSync } = await import("node:fs");
	const { resolve } = await import("node:path");
	const fontPath = resolve(process.cwd(), "assets/fonts/Inter-Bold.ttf");
	const fontBuffer = readFileSync(fontPath);
	const fontData = fontBuffer.buffer.slice(
		fontBuffer.byteOffset,
		fontBuffer.byteOffset + fontBuffer.byteLength,
	);

	const shortDescription = getShortDescription(archetype.description);

	const jsx = ArchetypeCardTemplate({
		archetypeName: archetype.name,
		oceanCode: code4,
		description: shortDescription,
		archetypeColor: archetype.color,
		width,
		height,
	});

	const svg = await satori(jsx as any, {
		width,
		height,
		fonts: [
			{
				name: "Inter",
				data: fontData,
				weight: 700,
				style: "normal" as const,
			},
		],
	});

	const resvg = new Resvg(svg, {
		fitTo: { mode: "width" as const, value: width },
	});
	const pngData = resvg.render();
	const pngBuffer = pngData.asPng();

	return new Response(new Uint8Array(pngBuffer), {
		status: 200,
		headers: {
			"Content-Type": "image/png",
			"Cache-Control": "public, immutable, max-age=31536000",
			"Content-Length": String(pngBuffer.length),
		},
	});
});
