import type { FacetResult } from "@workspace/domain";
import { getTraitColor, toFacetDisplayName } from "@workspace/domain";

interface FacetScoreBarProps {
	facet: FacetResult;
	/** Bar height variant: 'compact' (used in TraitCard) | 'standard' (used in TraitBand) */
	size?: "compact" | "standard";
	/** Whether to show the numeric score. Default true */
	showScore?: boolean;
}

export function FacetScoreBar({ facet, size = "compact", showScore = true }: FacetScoreBarProps) {
	const traitColor = getTraitColor(facet.traitName);
	const facetPct = Math.round((facet.score / 20) * 100);
	const isCompact = size === "compact";

	return (
		<div data-slot="facet-score-bar" className="flex items-center gap-1.5">
			<div className="flex-1 min-w-0">
				<div className="flex items-center justify-between">
					<span className={`${isCompact ? "text-[10px]" : "text-sm"} text-muted-foreground truncate`}>
						{toFacetDisplayName(facet.name)}
					</span>
					{showScore && (
						<span
							className={`${isCompact ? "text-[10px] font-medium text-muted-foreground" : "text-sm font-data"} ml-1 shrink-0`}
							style={isCompact ? undefined : { color: traitColor }}
						>
							{facet.score}
						</span>
					)}
				</div>
				<div className={`w-full bg-muted rounded-full mt-0.5 ${isCompact ? "h-1" : "h-1.5"}`}>
					<div
						className={`${isCompact ? "h-1" : "h-1.5"} rounded-full`}
						style={{
							width: `${facetPct}%`,
							backgroundColor: traitColor,
							opacity: isCompact ? 0.6 : 0.7,
						}}
					/>
				</div>
			</div>
		</div>
	);
}
