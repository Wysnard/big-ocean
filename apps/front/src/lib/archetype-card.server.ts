/**
 * Server function for archetype card PNG generation.
 *
 * Replaces the broken `server.handlers.GET` route pattern with a proper
 * `createServerFn` that returns base64-encoded PNG data.
 */

import { createServerFn } from "@tanstack/react-start";

export const generateArchetypeCardPng = createServerFn({ method: "GET" })
	.inputValidator((data: { publicProfileId: string; format: "9:16" | "1:1" }) => data)
	.handler(async ({ data }) => {
		const { publicProfileId, format } = data;

		const [
			{ Resvg },
			{ default: satori },
			{ ArchetypeCardTemplate },
			{ deriveTraitScores, fetchProfileData, getDominantColor, getFontData },
		] = await Promise.all([
			import("@resvg/resvg-js"),
			import("satori"),
			import("@/components/sharing/archetype-card-template"),
			import("@/lib/card-generation"),
		]);

		const { profile, status } = await fetchProfileData(publicProfileId);

		if (!profile) {
			const message =
				status === 404
					? "Profile not found"
					: status === 403
						? "Profile is private"
						: "Failed to fetch profile";
			return { data: null as null, error: message };
		}

		const traitScores = deriveTraitScores(profile.facets);
		const dominantColor = getDominantColor(traitScores);
		const width = 1080;
		const height = format === "9:16" ? 1920 : 1080;
		const fontData = getFontData();

		const jsx = ArchetypeCardTemplate({
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

		const base64 = Buffer.from(pngBuffer).toString("base64");
		return { data: base64, error: undefined as string | undefined };
	});
