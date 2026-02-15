import { toFacetDisplayName } from "@workspace/domain";
import { cn } from "@workspace/ui/lib/utils";

export interface FacetData {
	name: string;
	score: number;
	confidence: number;
}

export interface FacetBreakdownProps {
	traitName: string;
	facets: FacetData[];
	traitScore: number;
	id: string;
	className?: string;
}

const MAX_FACET_SCORE = 20;
const HIGH_SCORE_THRESHOLD = 15;
const LOW_CONFIDENCE_THRESHOLD = 30;

/**
 * Expandable breakdown showing the 6 facets that compose a Big Five trait.
 * Highlights high-scoring facets and marks low-confidence ones.
 */
export function FacetBreakdown({
	traitName,
	facets,
	traitScore,
	id,
	className,
}: FacetBreakdownProps) {
	return (
		<section
			id={id}
			aria-label={`${traitName} facet breakdown`}
			data-testid={`facet-breakdown-${traitName}`}
			data-slot="facet-breakdown"
			className={cn(
				"overflow-hidden rounded-b-xl border border-t-0 border-border bg-card transition-all duration-300",
				className,
			)}
		>
			{/* Sum visualization */}
			<div className="border-b border-border px-4 py-3">
				<p className="text-xs text-muted-foreground" data-testid="facet-sum-label">
					6 facets sum to{" "}
					<span className="font-medium text-foreground">
						{traitName.charAt(0).toUpperCase() + traitName.slice(1)}
					</span>{" "}
					trait score ({traitScore}/120)
				</p>
			</div>

			{/* Facet list */}
			<ul className="divide-y divide-border px-4" data-testid="facet-list">
				{facets.map((facet) => {
					const isHighScore = facet.score >= HIGH_SCORE_THRESHOLD;
					const isLowConfidence = facet.confidence < LOW_CONFIDENCE_THRESHOLD;
					const scorePercent = Math.round(
						(Math.min(Math.max(facet.score, 0), MAX_FACET_SCORE) / MAX_FACET_SCORE) * 100,
					);

					const displayName = toFacetDisplayName(facet.name);
					return (
						<li
							key={facet.name}
							aria-label={`${displayName}: ${facet.score} out of ${MAX_FACET_SCORE}, ${facet.confidence}% confidence`}
							data-testid={`facet-item-${facet.name}`}
							className={cn("py-3", isLowConfidence && "opacity-60")}
						>
							{/* Facet header: name, score, confidence */}
							<div className="flex items-center justify-between gap-2">
								<div className="flex items-center gap-2 min-w-0">
									<span
										className={cn(
											"text-sm truncate",
											isHighScore ? "font-semibold text-foreground" : "text-muted-foreground",
										)}
									>
										{displayName}
									</span>
									{isHighScore && (
										<span
											className="shrink-0 text-xs text-warning"
											aria-hidden="true"
											data-testid={`facet-highlight-${facet.name}`}
										>
											&#9733;
										</span>
									)}
								</div>

								<div className="flex items-center gap-3 shrink-0">
									<span className="text-xs font-medium text-foreground">
										{facet.score}/{MAX_FACET_SCORE}
									</span>
									<span
										className={cn("text-xs", isLowConfidence ? "text-destructive" : "text-muted-foreground")}
										data-testid={`facet-confidence-${facet.name}`}
									>
										{facet.confidence}%
									</span>
								</div>
							</div>

							{/* Score bar */}
							<div className="mt-1.5">
								<div
									className={cn(
										"h-1.5 w-full overflow-hidden rounded-full bg-muted",
										isLowConfidence && "border border-dashed border-muted-foreground/30",
									)}
								>
									<div
										className={cn(
											"h-full rounded-full transition-all duration-300",
											isHighScore ? "bg-primary/80" : "bg-muted-foreground/40",
										)}
										style={{ width: `${scorePercent}%` }}
										data-testid={`facet-fill-${facet.name}`}
									/>
								</div>
							</div>

							{/* View Evidence button (disabled placeholder for Story 5.3) */}
							<button
								type="button"
								disabled
								className="mt-1.5 text-xs text-muted-foreground cursor-not-allowed"
								data-testid={`facet-evidence-btn-${facet.name}`}
							>
								View Evidence
							</button>
						</li>
					);
				})}
			</ul>
		</section>
	);
}
