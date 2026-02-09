import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArchetypeCard } from "@/components/results/ArchetypeCard";
import { FacetBreakdown } from "@/components/results/FacetBreakdown";
import { TraitBar } from "@/components/results/TraitBar";
import { useGetResults } from "@/hooks/use-assessment";

/** Trait color mapping per UX spec */
const TRAIT_COLORS: Record<string, string> = {
	openness: "#6B5CE7",
	conscientiousness: "#E87B35",
	extraversion: "#E74C8B",
	agreeableness: "#4CAF6E",
	neuroticism: "#2C3E7B",
};

const LOW_CONFIDENCE_THRESHOLD = 50;

export const Route = createFileRoute("/results/$sessionId")({
	component: ResultsPage,
});

function ResultsPage() {
	const { sessionId } = Route.useParams();
	const { data, isLoading, error } = useGetResults(sessionId);
	const [expandedTrait, setExpandedTrait] = useState<string | null>(null);

	if (isLoading) {
		return <ResultsSkeleton />;
	}

	if (error) {
		return (
			<div className="flex min-h-[60vh] items-center justify-center px-4">
				<div className="text-center">
					<h2 className="text-xl font-semibold text-white">Session not found</h2>
					<p className="mt-2 text-sm text-slate-400">
						This assessment session could not be found or has expired.
					</p>
					<Link
						to="/"
						className="mt-6 inline-block rounded-lg bg-slate-700 px-6 py-2.5 text-sm font-medium text-white hover:bg-slate-600 transition-colors"
					>
						Back to Home
					</Link>
				</div>
			</div>
		);
	}

	if (!data) return null;

	const isLowConfidence = data.overallConfidence < LOW_CONFIDENCE_THRESHOLD;

	return (
		<div className="mx-auto max-w-2xl px-4 py-8" data-testid="results-page">
			{/* Low confidence banner (AC-4) */}
			{isLowConfidence && (
				<div
					className="mb-6 rounded-xl border border-amber-700/30 bg-amber-900/20 p-4"
					data-testid="low-confidence-banner"
				>
					<p className="text-sm font-medium text-amber-200">Keep talking to see more accurate results</p>
					<p className="mt-1 text-xs text-amber-300/70">
						Some facets have low confidence. Continue your assessment for better accuracy.
					</p>
					<Link
						to="/chat"
						search={{ sessionId }}
						className="mt-3 inline-block rounded-lg bg-amber-700/30 px-4 py-2 text-sm font-medium text-amber-200 hover:bg-amber-700/50 transition-colors"
						data-testid="continue-assessment-btn"
					>
						Continue Assessment
					</Link>
				</div>
			)}

			{/* Archetype Card (AC-1) */}
			<ArchetypeCard
				archetypeName={data.archetypeName}
				oceanCode4={data.oceanCode4}
				oceanCode5={data.oceanCode5}
				description={data.archetypeDescription}
				color={data.archetypeColor}
				isCurated={data.isCurated}
				overallConfidence={data.overallConfidence}
			/>

			{/* Trait Summary (AC-2) */}
			<div className="mt-8 space-y-2" data-testid="trait-summary">
				<h3 className="mb-4 text-lg font-semibold text-white">Your Traits</h3>
				{data.traits.map((trait) => {
					const traitFacets = data.facets
						.filter((f) => f.traitName === trait.name)
						.map((f) => ({
							name: f.name,
							score: f.score,
							confidence: f.confidence,
						}));

					const isExpanded = expandedTrait === trait.name;
					const controlsId = `facets-${trait.name}`;

					return (
						<div key={trait.name}>
							<TraitBar
								traitName={trait.name}
								score={trait.score}
								level={trait.level}
								confidence={trait.confidence}
								color={TRAIT_COLORS[trait.name] ?? "#6B7280"}
								isExpanded={isExpanded}
								onToggle={() => setExpandedTrait(isExpanded ? null : trait.name)}
								controlsId={controlsId}
							/>
							{/* Facet Breakdown (AC-3) */}
							{isExpanded && (
								<FacetBreakdown
									traitName={trait.name}
									facets={traitFacets}
									traitScore={trait.score}
									id={controlsId}
								/>
							)}
						</div>
					);
				})}
			</div>

			{/* Action buttons */}
			<div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
				{isLowConfidence && (
					<Link
						to="/chat"
						search={{ sessionId }}
						className="rounded-lg bg-slate-700 px-6 py-2.5 text-center text-sm font-medium text-white hover:bg-slate-600 transition-colors"
					>
						Continue Assessment
					</Link>
				)}
				<button
					type="button"
					disabled
					className="rounded-lg bg-slate-800 px-6 py-2.5 text-sm font-medium text-slate-500 cursor-not-allowed"
					data-testid="share-archetype-btn"
				>
					Share My Archetype
				</button>
			</div>
		</div>
	);
}

/** Skeleton loading state */
function ResultsSkeleton() {
	return (
		<div className="mx-auto max-w-2xl px-4 py-8" data-testid="results-skeleton">
			{/* Archetype skeleton */}
			<div className="animate-pulse rounded-2xl border border-slate-700/50 bg-slate-800/80 p-6 md:p-8">
				<div className="h-1.5 w-full rounded bg-slate-700" />
				<div className="mt-6 h-8 w-3/4 rounded bg-slate-700" />
				<div className="mt-3 flex gap-3">
					<div className="h-7 w-16 rounded bg-slate-700" />
					<div className="h-7 w-20 rounded bg-slate-700" />
				</div>
				<div className="mt-4 space-y-2">
					<div className="h-4 w-full rounded bg-slate-700" />
					<div className="h-4 w-5/6 rounded bg-slate-700" />
				</div>
			</div>

			{/* Trait skeletons */}
			<div className="mt-8 space-y-2">
				<div className="h-6 w-32 rounded bg-slate-700" />
				{["skel-o", "skel-c", "skel-e", "skel-a", "skel-n"].map((id) => (
					<div
						key={id}
						className="animate-pulse rounded-xl border border-slate-700/50 bg-slate-800/60 p-4"
					>
						<div className="flex items-center gap-3">
							<div className="h-3 w-3 rounded-full bg-slate-700" />
							<div className="h-4 w-28 rounded bg-slate-700" />
							<div className="h-5 w-12 rounded bg-slate-700" />
						</div>
						<div className="mt-3 h-2 w-full rounded-full bg-slate-700" />
					</div>
				))}
			</div>
		</div>
	);
}
