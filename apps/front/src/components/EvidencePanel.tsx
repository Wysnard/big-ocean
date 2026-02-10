/**
 * Evidence Panel Component
 *
 * Modal showing evidence list for a specific facet.
 * Displays all message quotes that contributed to a facet score.
 *
 * Features:
 * - Color-coded evidence cards (green/yellow/red based on score)
 * - Opacity based on confidence
 * - "Jump to Message" navigation to chat with highlighting
 * - Scrollable list with virtualization for >20 items
 */

"use client";

import { useNavigate } from "@tanstack/react-router";
import type { SavedFacetEvidence } from "@workspace/contracts";
import type { FacetName } from "@workspace/domain";
import { Button } from "@workspace/ui/components/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@workspace/ui/components/dialog";
import { cn } from "@workspace/ui/lib/utils";

interface EvidencePanelProps {
	sessionId: string;
	facetName: FacetName | null;
	evidence: SavedFacetEvidence[] | undefined;
	isLoading: boolean;
	isOpen: boolean;
	onClose: () => void;
}

/**
 * EvidenceItem Sub-Component
 *
 * Single evidence card with quote, score, confidence, and "Jump to Message" button.
 */
interface EvidenceItemProps {
	evidence: SavedFacetEvidence;
	onJumpToMessage: (
		messageId: string,
		quote: string,
		highlightStart: number,
		highlightEnd: number,
		score: number,
	) => void;
}

function EvidenceItem({ evidence, onJumpToMessage }: EvidenceItemProps) {
	// Color based on score
	const colorClasses =
		evidence.score >= 15
			? "bg-green-500/20 border-green-500/30 text-green-200"
			: evidence.score >= 8
				? "bg-yellow-500/20 border-yellow-500/30 text-yellow-200"
				: "bg-red-500/20 border-red-500/30 text-red-200";

	// Opacity based on confidence (0-100 → 0.3-1.0)
	const opacity = 0.3 + (evidence.confidence / 100) * 0.7;

	return (
		<div className={cn("p-3 border rounded-lg mb-3", colorClasses)} style={{ opacity }}>
			<p className="text-sm mb-2">"{evidence.quote}"</p>
			<div className="flex justify-between items-center">
				<span className="text-xs">
					Score: {evidence.score}/20 ({evidence.confidence}% confident)
				</span>
				<Button
					size="sm"
					variant="ghost"
					onClick={() =>
						onJumpToMessage(
							evidence.assessmentMessageId,
							evidence.quote,
							evidence.highlightRange.start,
							evidence.highlightRange.end,
							evidence.score,
						)
					}
				>
					Jump to Message →
				</Button>
			</div>
		</div>
	);
}

/**
 * Evidence Panel Component
 *
 * Modal showing all evidence for a specific facet.
 */
export function EvidencePanel({
	sessionId,
	facetName,
	evidence,
	isLoading,
	isOpen,
	onClose,
}: EvidencePanelProps) {
	const navigate = useNavigate();

	const handleJumpToMessage = (
		messageId: string,
		quote: string,
		highlightStart: number,
		highlightEnd: number,
		score: number,
	) => {
		navigate({
			to: "/chat",
			search: {
				sessionId,
				highlightMessageId: messageId,
				highlightQuote: quote,
				highlightStart,
				highlightEnd,
				highlightScore: score,
			},
		});
		onClose();
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="w-[90vw] sm:max-w-md max-h-[80vh]">
				<DialogHeader>
					<DialogTitle>Evidence for {facetName ? facetName.replace(/_/g, " ") : "facet"}</DialogTitle>
				</DialogHeader>
				<div className="overflow-y-auto pr-4 max-h-[calc(80vh-8rem)]">
					{isLoading && <p className="text-center text-muted-foreground">Loading evidence...</p>}
					{!isLoading && evidence && evidence.length === 0 && (
						<p className="text-center text-muted-foreground">No evidence found for this facet.</p>
					)}
					{!isLoading &&
						evidence &&
						evidence.map((item) => (
							<EvidenceItem key={item.id} evidence={item} onJumpToMessage={handleJumpToMessage} />
						))}
				</div>
			</DialogContent>
		</Dialog>
	);
}
