/**
 * Archetype Card API Route
 *
 * Generates shareable archetype card images (PNG).
 * Route: GET /api/archetype-card/:publicProfileId?format=9:16|1:1
 */

import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/archetype-card/$publicProfileId")({
	server: {
		handlers: {
			GET: async ({ request, params }) => {
				const { publicProfileId } = params;
				const url = new URL(request.url);
				const format = url.searchParams.get("format") === "1:1" ? "1:1" : "9:16";

				// Dynamic imports to keep Node-only modules out of the client bundle
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
					return new Response(message, {
						status,
						headers: { "Content-Type": "text/plain" },
					});
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

				return new Response(Buffer.from(pngBuffer), {
					status: 200,
					headers: {
						"Content-Type": "image/png",
						"Cache-Control": "public, immutable, max-age=31536000",
						"Content-Length": pngBuffer.length.toString(),
					},
				});
			},
		},
	},
});
