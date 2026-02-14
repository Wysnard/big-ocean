import { Button } from "@workspace/ui/components/button";
import { Check, Copy, Eye, EyeOff, Loader2, Share2 } from "lucide-react";

interface ShareState {
	publicProfileId: string;
	shareableUrl: string;
	isPublic: boolean;
}

interface ShareProfileSectionProps {
	shareState: ShareState | null;
	shareError: string | null;
	copied: boolean;
	isSharePending: boolean;
	isTogglePending: boolean;
	onShare: () => void;
	onCopyLink: () => void;
	onToggleVisibility: () => void;
}

export function ShareProfileSection({
	shareState,
	shareError,
	copied,
	isSharePending,
	isTogglePending,
	onShare,
	onCopyLink,
	onToggleVisibility,
}: ShareProfileSectionProps) {
	return (
		<section data-slot="share-profile-section" className="px-6 py-12">
			<div className="mx-auto max-w-2xl">
				<div className="border border-border rounded-xl bg-card p-6">
					<div className="flex items-center gap-2 mb-4">
						<Share2 className="w-5 h-5 text-muted-foreground" />
						<h2 className="text-lg font-semibold text-foreground">Share Your Profile</h2>
					</div>

					{!shareState ? (
						<div>
							<p className="text-muted-foreground text-sm mb-4">
								Generate a shareable link so others can see your personality archetype.
							</p>
							{shareError && <p className="text-destructive text-sm mb-4">{shareError}</p>}
							<Button
								data-testid="share-generate-btn"
								onClick={onShare}
								disabled={isSharePending}
								className="bg-primary text-primary-foreground hover:bg-primary/90"
							>
								{isSharePending ? (
									<>
										<Loader2 className="w-4 h-4 mr-2 motion-safe:animate-spin" />
										Generating...
									</>
								) : (
									<>
										<Share2 className="w-4 h-4 mr-2" />
										Generate Shareable Link
									</>
								)}
							</Button>
						</div>
					) : (
						<div className="space-y-4">
							{/* Link display */}
							<div className="flex items-center gap-2 bg-muted/50 rounded-lg p-3">
								<code data-testid="share-url" className="text-sm text-primary flex-1 truncate">
									{shareState.shareableUrl}
								</code>
								<Button
									data-testid="share-copy-btn"
									onClick={onCopyLink}
									size="sm"
									variant="outline"
									className="shrink-0"
								>
									{copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
								</Button>
							</div>

							{/* Visibility toggle */}
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									{shareState.isPublic ? (
										<Eye className="w-4 h-4 text-green-500" />
									) : (
										<EyeOff className="w-4 h-4 text-muted-foreground" />
									)}
									<span data-testid="share-visibility-status" className="text-sm text-foreground">
										{shareState.isPublic ? "Profile is public" : "Profile is private"}
									</span>
								</div>
								<Button
									data-testid="share-privacy-toggle"
									onClick={onToggleVisibility}
									size="sm"
									variant="outline"
									disabled={isTogglePending}
								>
									{isTogglePending ? (
										<Loader2 className="w-4 h-4 motion-safe:animate-spin" />
									) : shareState.isPublic ? (
										"Make Private"
									) : (
										"Make Public"
									)}
								</Button>
							</div>

							{!shareState.isPublic && (
								<p className="text-xs text-muted-foreground">
									Your profile link has been created but is private. Toggle to public so others can view it.
								</p>
							)}
						</div>
					)}
				</div>
			</div>
		</section>
	);
}
