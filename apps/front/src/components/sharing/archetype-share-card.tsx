/**
 * ArchetypeShareCard — Story 15.2
 *
 * Renders preview images for both archetype card formats with download/share options.
 */

import { Download, Share2 } from "lucide-react";
import { useCallback, useState } from "react";

interface ArchetypeShareCardProps {
	publicProfileId: string;
	archetypeName: string;
}

export function ArchetypeShareCard({ publicProfileId, archetypeName }: ArchetypeShareCardProps) {
	const [activeFormat, setActiveFormat] = useState<"9:16" | "1:1">("1:1");

	const getCardUrl = useCallback(
		(format: "9:16" | "1:1") =>
			`/api/archetype-card/${publicProfileId}?format=${encodeURIComponent(format)}`,
		[publicProfileId],
	);

	const handleDownload = useCallback(
		(format: "9:16" | "1:1") => {
			const link = document.createElement("a");
			link.href = getCardUrl(format);
			link.download = `${archetypeName.toLowerCase().replace(/\s+/g, "-")}-${format === "9:16" ? "story" : "post"}.png`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		},
		[getCardUrl, archetypeName],
	);

	const handleShare = useCallback(async () => {
		const url = getCardUrl(activeFormat);

		if (navigator.share) {
			try {
				await navigator.share({
					title: `My personality archetype: ${archetypeName}`,
					text: `Check out my Big Ocean personality archetype: ${archetypeName}`,
					url,
				});
			} catch {
				// User cancelled or share failed — fall back to clipboard
				await navigator.clipboard.writeText(url);
			}
		} else {
			await navigator.clipboard.writeText(url);
		}
	}, [getCardUrl, activeFormat, archetypeName]);

	return (
		<div
			data-slot="archetype-share-card"
			className="flex flex-col gap-4 rounded-2xl border border-border p-6"
			style={{
				background: "linear-gradient(135deg, oklch(0.67 0.13 181 / 0.06), oklch(0.55 0.24 293 / 0.04))",
			}}
		>
			<div className="flex items-center justify-between">
				<div>
					<h3 className="font-heading text-lg font-semibold text-foreground">
						Share your archetype card
					</h3>
					<p className="text-sm text-muted-foreground">Download or share your personality card image</p>
				</div>
			</div>

			{/* Format selector */}
			<div className="flex gap-2">
				<button
					type="button"
					onClick={() => setActiveFormat("1:1")}
					className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
						activeFormat === "1:1"
							? "bg-foreground text-background"
							: "bg-muted text-muted-foreground hover:bg-muted/80"
					}`}
				>
					1:1 Post
				</button>
				<button
					type="button"
					onClick={() => setActiveFormat("9:16")}
					className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
						activeFormat === "9:16"
							? "bg-foreground text-background"
							: "bg-muted text-muted-foreground hover:bg-muted/80"
					}`}
				>
					9:16 Story
				</button>
			</div>

			{/* Card preview */}
			<div className="flex justify-center rounded-xl bg-card/50 p-4">
				<img
					src={getCardUrl(activeFormat)}
					alt={`${archetypeName} archetype card (${activeFormat})`}
					className="rounded-lg shadow-lg"
					style={{
						maxHeight: activeFormat === "9:16" ? "400px" : "280px",
						maxWidth: "100%",
						objectFit: "contain",
					}}
				/>
			</div>

			{/* Action buttons */}
			<div className="flex gap-2">
				<button
					type="button"
					onClick={() => handleDownload(activeFormat)}
					className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[oklch(0.67_0.13_181)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[oklch(0.60_0.13_181)]"
				>
					<Download className="h-4 w-4" />
					Download
				</button>
				<button
					type="button"
					onClick={handleShare}
					className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
				>
					<Share2 className="h-4 w-4" />
					Share
				</button>
			</div>
		</div>
	);
}
