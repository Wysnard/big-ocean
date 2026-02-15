/**
 * Facet Side Panel Component
 *
 * Side panel showing which facets were detected in a specific message.
 * Displays facets sorted by score (highest contribution first).
 *
 * Features:
 * - Facet list with score badges
 * - Click facet → navigate to profile page and scroll to that facet
 * - Color-coded scores (green/yellow/red)
 */

"use client";

import { useNavigate } from "@tanstack/react-router";
import type { SavedFacetEvidence } from "@workspace/contracts";
import { toFacetDisplayName } from "@workspace/domain";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@workspace/ui/components/dialog";
import { cn } from "@workspace/ui/lib/utils";

interface FacetSidePanelProps {
	sessionId: string;
	evidence: SavedFacetEvidence[] | undefined;
	isLoading: boolean;
	isOpen: boolean;
	onClose: () => void;
}

/**
 * Facet Side Panel Component
 *
 * Shows all facets detected in a message with score badges.
 * Clicking a facet navigates to the profile page.
 */
export function FacetSidePanel({
	sessionId,
	evidence,
	isLoading,
	isOpen,
	onClose,
}: FacetSidePanelProps) {
	const navigate = useNavigate();

	const handleFacetClick = (facetName: string) => {
		navigate({
			to: "/results",
			search: { sessionId, scrollToFacet: facetName },
		});
		onClose();
	};

	const getScoreColor = (score: number) => {
		if (score >= 15) return "text-score-high border-score-high/30";
		if (score >= 8) return "text-score-medium border-score-medium/30";
		return "text-score-low border-score-low/30";
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="w-[90vw] sm:max-w-md" data-slot="facet-side-panel">
				<DialogHeader>
					<DialogTitle>This message contributed to:</DialogTitle>
				</DialogHeader>
				<div className="space-y-2 mt-4">
					{isLoading && <p className="text-center text-muted-foreground">Loading facets...</p>}
					{!isLoading && evidence && evidence.length === 0 && (
						<p className="text-center text-muted-foreground">No facet detections in this message.</p>
					)}
					{!isLoading &&
						evidence &&
						evidence.map((item) => (
							<button
								key={item.id}
								onClick={() => handleFacetClick(item.facetName)}
								className="w-full text-left p-3 border border-border rounded-lg hover:bg-muted transition-colors min-h-[44px]"
								type="button"
								data-slot="facet-button"
							>
								<div className="flex justify-between items-center">
									<span>{toFacetDisplayName(item.facetName)}</span>
									<span className={cn("font-bold", getScoreColor(item.score))}>+{item.score}/20</span>
								</div>
								<span className="text-xs text-muted-foreground">{item.confidence}% confident</span>
							</button>
						))}
				</div>
			</DialogContent>
		</Dialog>
	);
}
