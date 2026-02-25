"use client";

/**
 * EvidencePanel Component (Story 12.2)
 *
 * Panel showing all evidence quotes for a selected facet.
 * Each quote displays highlighted text, confidence badge, and "Jump to Message" button.
 */

import type { SavedFacetEvidence } from "@workspace/contracts";
import type { FacetName, TraitName } from "@workspace/domain";
import { getTraitColor, TRAIT_TO_FACETS, toFacetDisplayName } from "@workspace/domain";
import { MessageCircle, X } from "lucide-react";

export interface HighlightRange {
	start: number;
	end: number;
}

function getSignalBadge(confidence: number): { label: string; className: string } {
	if (confidence >= 70) {
		return {
			label: "Strong",
			className: "bg-[oklch(0.67_0.13_181/0.15)] text-[oklch(0.45_0.13_181)]",
		};
	}
	if (confidence >= 40) {
		return {
			label: "Moderate",
			className: "bg-[oklch(0.67_0.20_42/0.15)] text-[oklch(0.50_0.20_42)]",
		};
	}
	return {
		label: "Weak",
		className: "bg-[oklch(0.29_0.19_272/0.10)] text-[oklch(0.40_0.10_272)]",
	};
}

/** Find the parent trait for a facet */
function getParentTrait(facetName: FacetName): TraitName | undefined {
	for (const [trait, facets] of Object.entries(TRAIT_TO_FACETS)) {
		if (facets.includes(facetName)) {
			return trait as TraitName;
		}
	}
	return undefined;
}

interface EvidencePanelProps {
	facetName: FacetName;
	evidence: SavedFacetEvidence[];
	onJumpToMessage: (
		messageId: string,
		range: HighlightRange,
		color: string,
		confidence: number,
	) => void;
	onClose: () => void;
}

export function EvidencePanel({
	facetName,
	evidence,
	onJumpToMessage,
	onClose,
}: EvidencePanelProps) {
	const parentTrait = getParentTrait(facetName);
	const traitColor = parentTrait ? getTraitColor(parentTrait) : "var(--primary)";

	return (
		<div
			data-testid="evidence-panel"
			className="rounded-xl border bg-card p-4 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2"
			style={{ borderColor: traitColor }}
		>
			{/* Header */}
			<div className="flex items-center justify-between mb-3">
				<h4 className="text-sm font-semibold text-foreground">
					{toFacetDisplayName(facetName)} — Evidence
				</h4>
				<button
					type="button"
					onClick={onClose}
					className="rounded-full p-1 hover:bg-muted motion-safe:transition-colors"
					aria-label="Close evidence panel"
				>
					<X className="w-3.5 h-3.5 text-muted-foreground" />
				</button>
			</div>

			{evidence.length === 0 && (
				<p className="text-xs text-muted-foreground italic">No evidence recorded for this facet.</p>
			)}

			{/* Evidence quotes */}
			<div className="flex flex-col gap-2">
				{evidence.map((ev) => {
					const badge = getSignalBadge(ev.confidence);
					return (
						<div key={ev.id} className="rounded-lg bg-muted/50 p-3">
							<p className="text-xs italic text-foreground/80 mb-2">&ldquo;{ev.quote}&rdquo;</p>
							<div className="flex items-center justify-between">
								<span
									className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${badge.className}`}
								>
									{badge.label}
								</span>
								<button
									type="button"
									data-testid="jump-to-message"
									onClick={() =>
										onJumpToMessage(ev.assessmentMessageId, ev.highlightRange, traitColor, ev.confidence)
									}
									className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground motion-safe:transition-colors min-h-[44px] min-w-[44px] justify-center"
								>
									<MessageCircle className="w-3.5 h-3.5" />
									<span>Jump to Message</span>
								</button>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
