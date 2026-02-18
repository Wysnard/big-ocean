import { Switch } from "@workspace/ui/components/switch";
import { Check, Copy, Loader2 } from "lucide-react";

interface ShareState {
	publicProfileId: string;
	shareableUrl: string;
	isPublic: boolean;
}

interface ShareProfileSectionProps {
	shareState: ShareState | null;
	copied: boolean;
	isTogglePending: boolean;
	onCopyLink: () => void;
	onToggleVisibility: () => void;
}

export function ShareProfileSection({
	shareState,
	copied,
	isTogglePending,
	onCopyLink,
	onToggleVisibility,
}: ShareProfileSectionProps) {
	if (!shareState) return null;

	return (
		<div
			data-slot="share-profile-section"
			className="col-span-full rounded-2xl border border-border p-6"
			style={{
				background: "linear-gradient(135deg, oklch(0.67 0.13 181 / 0.08), oklch(0.55 0.24 293 / 0.06))",
			}}
		>
			<div className="flex flex-col gap-4">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div className="min-w-0">
						<h3 className="font-display text-lg font-semibold text-foreground">Share your OCEAN code</h3>
						<p className="text-sm text-muted-foreground">Let others discover your personality depths</p>
					</div>
					<div className="flex items-center gap-2 text-sm text-muted-foreground">
						<Switch
							data-slot="share-privacy-toggle"
							data-testid="share-privacy-toggle"
							checked={shareState.isPublic}
							onCheckedChange={onToggleVisibility}
							disabled={isTogglePending}
							aria-label={shareState.isPublic ? "Make profile private" : "Make profile public"}
						/>
						<span data-slot="share-visibility-status" data-testid="share-visibility-status">
							{shareState.isPublic ? "Public" : "Private"}
						</span>
						{isTogglePending && <Loader2 className="w-3 h-3 motion-safe:animate-spin" />}
					</div>
				</div>

				<div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
					<span
						data-slot="share-url"
						data-testid="share-url"
						className="flex-1 min-w-0 font-mono text-xs text-muted-foreground truncate"
					>
						{shareState.shareableUrl}
					</span>
					<button
						data-slot="share-copy-btn"
						data-testid="share-copy-btn"
						type="button"
						onClick={onCopyLink}
						aria-label={copied ? "Link copied" : "Copy link"}
						className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-[oklch(0.67_0.13_181)] px-3.5 py-1.5 text-sm font-medium text-white hover:bg-[oklch(0.60_0.13_181)] transition-colors"
					>
						{copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
						<span>{copied ? "Copied!" : "Copy"}</span>
					</button>
				</div>
			</div>
		</div>
	);
}
