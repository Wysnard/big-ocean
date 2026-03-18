/**
 * OG Image API Route (Nitro)
 *
 * Generates Open Graph images for public profiles (1200x630 PNG).
 * Endpoint: GET /api/og/public-profile/:publicProfileId
 *
 * Uses the shared ArchetypeCardTemplate (Satori JSX) and card-generation utilities
 * for consistent rendering across all card generation endpoints.
 *
 * Must be a real HTTP endpoint (not a server function) because social media
 * crawlers fetch og:image URLs directly.
 */

import { defineHandler, getRouterParam } from "h3";
import { Resvg } from "@resvg/resvg-js";

const API_URL = process.env.VITE_API_URL ?? "http://localhost:4000";

type ProfileData = {
	archetypeName: string;
	oceanCode: string;
	displayName: string | null;
	facets: Record<string, { score: number; confidence: number }>;
};

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

	// Dynamic imports to keep native modules out of client bundle
	const [{ default: satori }, { ArchetypeCardTemplate }, { deriveTraitScores, getDominantColor }] =
		await Promise.all([
			import("satori"),
			import("../../../../../src/components/sharing/archetype-card-template"),
			import("../../../../../src/lib/card-generation"),
		]);

	const traitScores = deriveTraitScores(profile.facets);
	const dominantColor = getDominantColor(traitScores);

	const width = 1200;
	const height = 630;

	const jsx = ArchetypeCardTemplate({
		archetypeName: profile.archetypeName,
		oceanCode: profile.oceanCode,
		displayName: profile.displayName,
		traitScores,
		dominantColor,
		width,
		height,
	});

	// Read font data
	const { readFileSync } = await import("node:fs");
	const { resolve } = await import("node:path");
	const fontPath = resolve(process.cwd(), "assets/fonts/Inter-Bold.ttf");
	const fontBuffer = readFileSync(fontPath);
	const fontData = fontBuffer.buffer.slice(
		fontBuffer.byteOffset,
		fontBuffer.byteOffset + fontBuffer.byteLength,
	);

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
			"Cache-Control": "public, max-age=86400, stale-while-revalidate=3600",
			"Content-Length": String(pngBuffer.length),
		},
	});
});
