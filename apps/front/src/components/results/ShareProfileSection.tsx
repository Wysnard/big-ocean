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
	archetypeName?: string;
	onShare: () => void;
	onCopyLink: () => void;
	onToggleVisibility: () => void;
}

function TwitterIcon({ className }: { className?: string }) {
	return (
		<svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
			<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
		</svg>
	);
}

function FacebookIcon({ className }: { className?: string }) {
	return (
		<svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
			<path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
		</svg>
	);
}

function LinkedInIcon({ className }: { className?: string }) {
	return (
		<svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
			<path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
		</svg>
	);
}

export function ShareProfileSection({
	shareState,
	shareError,
	copied,
	isSharePending,
	isTogglePending,
	archetypeName,
	onShare,
	onCopyLink,
	onToggleVisibility,
}: ShareProfileSectionProps) {
	const handleSocialShare = (platform: "twitter" | "facebook" | "linkedin") => {
		if (!shareState) return;

		const shareText = encodeURIComponent(
			archetypeName
				? `I'm "${archetypeName}" — discover your personality archetype on big-ocean!`
				: "Discover your personality archetype on big-ocean!",
		);
		const shareUrl = encodeURIComponent(shareState.shareableUrl);

		const urls: Record<string, string> = {
			twitter: `https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`,
			facebook: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`,
			linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`,
		};

		const url = urls[platform];
		if (url) {
			window.open(url, "_blank", "noopener,noreferrer,width=600,height=400");
		}
	};

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
								data-slot="share-generate-btn"
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
								<code
									data-slot="share-url"
									data-testid="share-url"
									className="text-sm text-primary flex-1 truncate"
								>
									{shareState.shareableUrl}
								</code>
								<Button
									data-slot="share-copy-btn"
									data-testid="share-copy-btn"
									onClick={onCopyLink}
									size="sm"
									variant="outline"
									className="shrink-0"
								>
									{copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
								</Button>
							</div>

							{/* Social share buttons */}
							<div data-slot="share-social-buttons" className="flex flex-wrap gap-2">
								<Button
									data-slot="share-twitter-btn"
									onClick={() => handleSocialShare("twitter")}
									variant="outline"
									size="sm"
									className="min-h-[44px] gap-2"
								>
									<TwitterIcon className="w-4 h-4" />
									<span>X (Twitter)</span>
								</Button>
								<Button
									data-slot="share-facebook-btn"
									onClick={() => handleSocialShare("facebook")}
									variant="outline"
									size="sm"
									className="min-h-[44px] gap-2"
								>
									<FacebookIcon className="w-4 h-4" />
									<span>Facebook</span>
								</Button>
								<Button
									data-slot="share-linkedin-btn"
									onClick={() => handleSocialShare("linkedin")}
									variant="outline"
									size="sm"
									className="min-h-[44px] gap-2"
								>
									<LinkedInIcon className="w-4 h-4" />
									<span>LinkedIn</span>
								</Button>
							</div>

							{/* Visibility toggle */}
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									{shareState.isPublic ? (
										<Eye className="w-4 h-4 text-success" />
									) : (
										<EyeOff className="w-4 h-4 text-muted-foreground" />
									)}
									<span
										data-slot="share-visibility-status"
										data-testid="share-visibility-status"
										className="text-sm text-foreground"
									>
										{shareState.isPublic ? "Profile is public" : "Profile is private"}
									</span>
								</div>
								<Button
									data-slot="share-privacy-toggle"
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

							{/* Privacy notice */}
							<p
								data-slot="share-privacy-notice"
								className="text-xs text-muted-foreground border-t border-border pt-3"
							>
								Your archetype, trait scores, and facet breakdowns will be visible. Conversations and
								evidence are not shared.
							</p>
						</div>
					)}
				</div>
			</div>
		</section>
	);
}
