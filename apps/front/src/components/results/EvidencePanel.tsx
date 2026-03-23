"use client";

/**
 * EvidencePanel Component (Story 12.2)
 *
 * Panel showing all evidence quotes for a selected facet.
 * Each quote displays highlighted text and confidence badge.
 */

import type { SavedFacetEvidence } from "@workspace/contracts";
import type { FacetName, TraitName } from "@workspace/domain";
import { TRAIT_TO_FACETS, toFacetDisplayName } from "@workspace/domain";
import { X } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import { formatDeviation, getDomainLabel, getSignalBadge } from "./evidence-utils";

export interface HighlightRange {
	start: number;
	end: number;
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
	evidence: readonly SavedFacetEvidence[];
	onClose: () => void;
}

export function EvidencePanel({ facetName, evidence, onClose }: EvidencePanelProps) {
	const parentTrait = getParentTrait(facetName);
	const traitVar = parentTrait ? `var(--trait-${parentTrait})` : "var(--primary)";
	const headingId = useId();
	const panelRef = useRef<HTMLDivElement>(null);

	// Focus the panel on mount for keyboard accessibility
	useEffect(() => {
		panelRef.current?.focus();
	}, []);

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Escape") {
			onClose();
		}
	};

	return (
		<div
			ref={panelRef}
			data-testid="evidence-panel"
			role="dialog"
			aria-labelledby={headingId}
			tabIndex={-1}
			onKeyDown={handleKeyDown}
			className="rounded-xl border bg-card p-4 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 outline-none"
			style={{ borderColor: traitVar }}
		>
			{/* Header */}
			<div className="flex items-center justify-between mb-3">
				<h4 id={headingId} className="text-sm font-semibold text-foreground">
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
							<div className="flex items-center gap-1.5 flex-wrap">
								<span
									className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${badge.className}`}
								>
									{badge.label}
								</span>
								<span className="inline-block rounded-full px-2 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground">
									{getDomainLabel(ev.domain)}
								</span>
								<span className="text-[10px] font-medium text-muted-foreground">
									{formatDeviation(ev.deviation)}
								</span>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
