import { Switch } from "@workspace/ui/components/switch";
import { Check, Copy, Share2 } from "lucide-react";
import { PublicVisibilityPrompt } from "./PublicVisibilityPrompt";

interface ShareState {
	publicProfileId: string;
	shareableUrl: string;
	isPublic: boolean;
}

interface ShareProfileSectionProps {
	shareState: ShareState | null;
	copied: boolean;
	isTogglePending: boolean;
	onToggleVisibility: () => void;
	onCopyAction: () => void;
	onShareAction: () => void;
	promptNeeded: boolean;
	onAcceptPrompt: () => void;
	onDeclinePrompt: () => void;
	isShareToggling: boolean;
}

/** Detect Web Share API availability at render time */
function canUseWebShare(): boolean {
	return typeof navigator !== "undefined" && typeof navigator.share === "function";
}

export function ShareProfileSection({
	shareState,
	copied,
	isTogglePending,
	onToggleVisibility,
	onCopyAction,
	onShareAction,
	promptNeeded,
	onAcceptPrompt,
	onDeclinePrompt,
	isShareToggling,
}: ShareProfileSectionProps) {
	if (!shareState) return null;

	const handleCopyClick = () => {
		if (copied) return;
		onCopyAction();
	};

	const handleShareClick = () => {
		onShareAction();
	};

	return (
		<>
			<section
				data-slot="share-profile-section"
				aria-label="Share your profile"
				className="col-span-full min-w-0 rounded-2xl border border-border p-6"
				style={{
					background:
						"linear-gradient(135deg, oklch(0.67 0.13 181 / 0.08), oklch(0.55 0.24 293 / 0.06))",
				}}
			>
				<div className="flex min-w-0 flex-col gap-4">
					<div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
						<div className="min-w-0">
							<h3 className="font-display text-lg font-semibold text-foreground">Share your OCEAN code</h3>
							<p className="text-sm text-muted-foreground">Let others discover your personality depths</p>
						</div>
						<div className="flex shrink-0 items-center gap-2 text-sm text-muted-foreground">
							<Switch
								data-slot="share-privacy-toggle"
								data-testid="share-privacy-toggle"
								checked={shareState.isPublic}
								onCheckedChange={onToggleVisibility}
								disabled={isTogglePending}
								aria-label={shareState.isPublic ? "Make profile private" : "Make profile public"}
							/>
							<span
								data-slot="share-visibility-status"
								data-testid="share-visibility-status"
								className="inline-block min-w-[7ch] text-left"
							>
								{shareState.isPublic ? "Public" : "Private"}
							</span>
						</div>
					</div>

					<div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
						<div className="flex min-w-0 items-center gap-2 overflow-hidden rounded-xl border border-border bg-card px-3 py-2 sm:flex-1">
							<span
								data-slot="share-url"
								data-testid="share-url"
								className="flex-1 min-w-0 font-mono text-xs text-muted-foreground truncate"
							>
								{shareState.shareableUrl}
							</span>
							<button
								data-slot="share-action-btn"
								data-testid="share-copy-btn"
								type="button"
								onClick={handleCopyClick}
								aria-label={copied ? "Link copied" : "Copy link"}
								className="shrink-0 inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground hover:bg-accent !cursor-pointer transition-colors"
							>
								{copied ? (
									<Check className="pointer-events-none size-4 shrink-0" aria-hidden />
								) : (
									<Copy className="pointer-events-none size-4 shrink-0" aria-hidden />
								)}
								<span className="pointer-events-none">{copied ? "Copied!" : "Copy link"}</span>
							</button>
						</div>
						<button
							data-testid="share-share-btn"
							type="button"
							onClick={handleShareClick}
							aria-label={canUseWebShare() ? "Share link" : "Share link (falls back to copy)"}
							className="inline-flex w-full min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 !cursor-pointer transition-colors sm:w-auto sm:min-w-28"
						>
							<Share2 className="pointer-events-none size-4 shrink-0" aria-hidden />
							<span className="pointer-events-none">Share</span>
						</button>
					</div>
				</div>
			</section>

			<PublicVisibilityPrompt
				open={promptNeeded}
				onAccept={onAcceptPrompt}
				onDecline={onDeclinePrompt}
				isLoading={isShareToggling}
			/>
		</>
	);
}
