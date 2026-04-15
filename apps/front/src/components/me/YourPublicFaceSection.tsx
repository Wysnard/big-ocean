import type { GetResultsResponse } from "@workspace/contracts";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ShareProfileSection } from "@/components/results/ShareProfileSection";
import { ArchetypeShareCard } from "@/components/sharing/archetype-share-card";
import { useToggleVisibility } from "@/hooks/use-profile";
import { useShareFlow } from "@/hooks/use-share-flow";

type ShareState = {
	publicProfileId: string;
	shareableUrl: string;
	isPublic: boolean;
};

interface YourPublicFaceSectionProps {
	results: GetResultsResponse;
}

export function YourPublicFaceSection({ results }: YourPublicFaceSectionProps) {
	const [shareState, setShareState] = useState<ShareState | null>(null);
	const toggleVisibility = useToggleVisibility();

	useEffect(() => {
		if (results.publicProfileId && results.shareableUrl && results.isPublic !== null) {
			setShareState({
				publicProfileId: results.publicProfileId,
				shareableUrl: results.shareableUrl,
				isPublic: results.isPublic,
			});
			return;
		}

		setShareState(null);
	}, [results.publicProfileId, results.shareableUrl, results.isPublic]);

	const shareFlow = useShareFlow({
		shareState,
		archetypeName: results.archetypeName ?? "Big Ocean",
		toggleVisibility: (input) => toggleVisibility.mutateAsync(input),
		onShareStateChange: (update) => setShareState((prev) => (prev ? { ...prev, ...update } : null)),
		onCopied: () => toast.success("Link copied to clipboard"),
	});

	const handleToggleVisibility = async () => {
		if (!shareState) return;

		try {
			const result = await toggleVisibility.mutateAsync({
				publicProfileId: shareState.publicProfileId,
				isPublic: !shareState.isPublic,
			});

			setShareState((prev) => (prev ? { ...prev, isPublic: result.isPublic } : null));
		} catch {
			// Keep the section usable so the user can retry.
		}
	};

	return (
		<div className="space-y-6">
			<div
				data-slot="public-face-preview"
				className="rounded-[1.75rem] border border-border/70 bg-background/70 p-5 sm:p-6"
			>
				<div className="space-y-2">
					<p className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
						Public preview
					</p>
					<h3 className="font-heading text-2xl font-bold text-foreground">{results.archetypeName}</h3>
					<p className="max-w-xl text-sm leading-6 text-muted-foreground">
						This is the first impression strangers will see when you share your profile link.
					</p>
				</div>
			</div>

			{shareState ? (
				<>
					<ShareProfileSection
						shareState={shareState}
						copied={shareFlow.copied}
						isTogglePending={toggleVisibility.isPending}
						onToggleVisibility={handleToggleVisibility}
						// 1A: copy URL even when private; Share still prompts when private.
						onCopyAction={() => void shareFlow.copyLink()}
						onShareAction={() => void shareFlow.initiateShare()}
						promptNeeded={shareFlow.promptNeeded}
						onAcceptPrompt={() => void shareFlow.acceptAndShare()}
						onDeclinePrompt={shareFlow.declineShare}
						isShareToggling={shareFlow.isToggling}
					/>

					<ArchetypeShareCard
						publicProfileId={shareState.publicProfileId}
						archetypeName={results.archetypeName}
					/>
				</>
			) : (
				<div className="rounded-[1.5rem] border border-dashed border-border p-5 text-sm leading-6 text-muted-foreground">
					Your public link is still getting ready. Come back in a moment and you&apos;ll be able to copy
					or share it from here.
				</div>
			)}
		</div>
	);
}
