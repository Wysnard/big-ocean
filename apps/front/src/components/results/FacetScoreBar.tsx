import type { FacetResult } from "@workspace/domain";
import { toFacetDisplayName } from "@workspace/domain";

interface FacetScoreBarProps {
	facet: FacetResult;
	/** Bar height variant: 'compact' (used in TraitCard) | 'standard' (used in TraitBand) */
	size?: "compact" | "standard";
	/** Whether to show the numeric score. Default true */
	showScore?: boolean;
	/** Index for staggered animation delay (50ms per index). Default undefined (no stagger). */
	staggerIndex?: number;
}

export function FacetScoreBar({
	facet,
	size = "compact",
	showScore = true,
	staggerIndex,
}: FacetScoreBarProps) {
	const traitVar = `var(--trait-${facet.traitName})`;
	const facetPct = Math.round((facet.score / 20) * 100);
	const isCompact = size === "compact";
	const displayName = toFacetDisplayName(facet.name);
	const staggerStyle =
		staggerIndex != null ? { animationDelay: `${staggerIndex * 50}ms` } : undefined;

	return (
		<div data-slot="facet-score-bar" className="flex items-center gap-1.5" style={staggerStyle}>
			<div className="flex-1 min-w-0">
				<div className="flex items-center justify-between">
					<span className={`${isCompact ? "text-[10px]" : "text-sm"} text-muted-foreground truncate`}>
						{displayName}
						{facet.levelLabel && <span className="text-muted-foreground/70"> · {facet.levelLabel}</span>}
					</span>
					{showScore && (
						<span
							className={`${isCompact ? "text-[10px] font-medium text-muted-foreground" : "text-sm font-data"} ml-1 shrink-0`}
							style={isCompact ? undefined : { color: traitVar }}
						>
							{Math.round(facet.score)}
						</span>
					)}
				</div>
				<div
					className={`w-full bg-muted rounded-full mt-0.5 ${isCompact ? "h-1" : "h-1.5"}`}
					role="progressbar"
					aria-valuenow={Math.round(facet.score)}
					aria-valuemin={0}
					aria-valuemax={20}
					aria-label={`${displayName}: ${Math.round(facet.score)} out of 20`}
				>
					<div
						className={`${isCompact ? "h-1" : "h-1.5"} rounded-full motion-safe:transition-[width] motion-safe:duration-500 motion-safe:ease-out`}
						style={{
							width: `${facetPct}%`,
							backgroundColor: traitVar,
							opacity: isCompact ? 0.6 : 0.7,
						}}
					/>
				</div>
			</div>
		</div>
	);
}
