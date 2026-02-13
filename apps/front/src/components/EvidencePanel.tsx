/**
 * Evidence Panel Component
 *
 * Modal showing evidence list for a specific facet.
 * Displays all message quotes that contributed to a facet score.
 *
 * Features:
 * - Left border accent colored to match the facet's theme color
 * - "Jump to Message" navigation to chat with highlighting
 * - Scrollable list with virtualization for >20 items
 */

"use client";

import { useNavigate } from "@tanstack/react-router";
import type { SavedFacetEvidence } from "@workspace/contracts";
import type { FacetName } from "@workspace/domain";
import { getFacetColor } from "@workspace/domain";
import { Button } from "@workspace/ui/components/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@workspace/ui/components/dialog";


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
	facetColor: string;
	onJumpToMessage: (
		messageId: string,
		quote: string,
		highlightStart: number,
		highlightEnd: number,
		score: number,
	) => void;
}

function EvidenceItem({ evidence, facetColor, onJumpToMessage }: EvidenceItemProps) {
	return (
		<div className="p-3 border border-l-4 rounded-lg mb-3 bg-card" style={{ borderLeftColor: facetColor }}>
			<p className="text-sm mb-2 text-foreground">"{evidence.quote}"</p>
			<div className="flex justify-between items-center">
				<span className="text-xs text-muted-foreground">
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
							<EvidenceItem
								key={item.id}
								evidence={item}
								facetColor={facetName ? getFacetColor(facetName) : "var(--border)"}
								onJumpToMessage={handleJumpToMessage}
							/>
						))}
				</div>
			</DialogContent>
		</Dialog>
	);
}
