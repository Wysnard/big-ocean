/**
 * ArchetypeShareCard — Story 15.2
 *
 * Renders preview images for both archetype card formats with download/share options.
 * Uses a server function to generate PNG cards and displays them via blob URLs.
 */

import { Download, Loader2, Share2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { generateArchetypeCardPng } from "@/lib/archetype-card.server";

interface ArchetypeShareCardProps {
	publicProfileId: string;
	archetypeName: string;
}

export function ArchetypeShareCard({ publicProfileId, archetypeName }: ArchetypeShareCardProps) {
	const [activeFormat, setActiveFormat] = useState<"9:16" | "1:1">("1:1");
	const [blobUrl, setBlobUrl] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const prevBlobUrl = useRef<string | null>(null);

	useEffect(() => {
		let cancelled = false;

		async function generate() {
			setLoading(true);
			setError(null);

			try {
				const result = await generateArchetypeCardPng({
					data: { publicProfileId, format: activeFormat },
				});

				if (cancelled) return;

				if (result.error || !result.data) {
					setError(result.error ?? "Failed to generate card");
					setBlobUrl(null);
					return;
				}

				// Convert base64 to blob URL
				const binary = atob(result.data);
				const bytes = new Uint8Array(binary.length);
				for (let i = 0; i < binary.length; i++) {
					bytes[i] = binary.charCodeAt(i);
				}
				const blob = new Blob([bytes], { type: "image/png" });

				// Revoke previous blob URL
				if (prevBlobUrl.current) {
					URL.revokeObjectURL(prevBlobUrl.current);
				}

				const url = URL.createObjectURL(blob);
				prevBlobUrl.current = url;
				setBlobUrl(url);
			} catch {
				if (!cancelled) {
					setError("Failed to generate card");
					setBlobUrl(null);
				}
			} finally {
				if (!cancelled) setLoading(false);
			}
		}

		generate();

		return () => {
			cancelled = true;
		};
	}, [publicProfileId, activeFormat]);

	// Cleanup blob URL on unmount
	useEffect(() => {
		return () => {
			if (prevBlobUrl.current) {
				URL.revokeObjectURL(prevBlobUrl.current);
			}
		};
	}, []);

	const handleDownload = useCallback(() => {
		if (!blobUrl) return;
		const link = document.createElement("a");
		link.href = blobUrl;
		link.download = `${archetypeName.toLowerCase().replace(/\s+/g, "-")}-${activeFormat === "9:16" ? "story" : "post"}.png`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}, [blobUrl, archetypeName, activeFormat]);

	const handleShare = useCallback(async () => {
		const profileUrl = `${window.location.origin}/profile/${publicProfileId}`;

		if (navigator.share) {
			try {
				await navigator.share({
					title: `My personality archetype: ${archetypeName}`,
					text: `Check out my Big Ocean personality archetype: ${archetypeName}`,
					url: profileUrl,
				});
			} catch {
				await navigator.clipboard.writeText(profileUrl);
			}
		} else {
			await navigator.clipboard.writeText(profileUrl);
		}
	}, [publicProfileId, archetypeName]);

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
			<div
				className="flex justify-center rounded-xl bg-card/50 p-4"
				style={{ minHeight: activeFormat === "9:16" ? "400px" : "280px" }}
			>
				{loading && (
					<div className="flex items-center justify-center">
						<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
					</div>
				)}
				{error && !loading && (
					<div className="flex items-center justify-center text-sm text-destructive">{error}</div>
				)}
				{blobUrl && !loading && !error && (
					<img
						src={blobUrl}
						alt={`${archetypeName} archetype card (${activeFormat})`}
						className="rounded-lg shadow-lg"
						style={{
							maxHeight: activeFormat === "9:16" ? "400px" : "280px",
							maxWidth: "100%",
							objectFit: "contain",
						}}
					/>
				)}
			</div>

			{/* Action buttons */}
			<div className="flex gap-2">
				<button
					type="button"
					onClick={handleDownload}
					disabled={!blobUrl || loading}
					className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[oklch(0.67_0.13_181)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[oklch(0.60_0.13_181)] disabled:opacity-50"
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
