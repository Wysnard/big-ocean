import type { FacetResult, TraitLevel, TraitName, TraitResult } from "@workspace/domain";
import { getTraitLevelLabel, TRAIT_LETTER_MAP } from "@workspace/domain";
import { CardAccent } from "@workspace/ui/components/card";
import { OceanHieroglyph } from "@workspace/ui/components/ocean-hieroglyph";
import { Tooltip, TooltipContent, TooltipTrigger } from "@workspace/ui/components/tooltip";
import { ChevronDown } from "lucide-react";
import { memo } from "react";
import { FacetScoreBar } from "./FacetScoreBar";

/** Maps each trait to its "High" letter for use as representative hieroglyph */
const TRAIT_HIEROGLYPH_LETTER: Record<TraitName, TraitLevel> = {
	openness: "O",
	conscientiousness: "C",
	extraversion: "E",
	agreeableness: "A",
	neuroticism: "N",
};

const TRAIT_LABELS: Record<TraitName, string> = {
	openness: "Openness",
	conscientiousness: "Conscientiousness",
	extraversion: "Extraversion",
	agreeableness: "Agreeableness",
	neuroticism: "Neuroticism",
};

const MAX_TRAIT_SCORE = 120;
const RING_RADIUS = 7;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

interface TraitCardProps {
	trait: TraitResult;
	facets: readonly FacetResult[];
	isSelected: boolean;
	onToggle: (traitName: string) => void;
}

export const TraitCard = memo(function TraitCard({
	trait,
	facets,
	isSelected,
	onToggle,
}: TraitCardProps) {
	const traitVar = `var(--trait-${trait.name})`;
	const scorePercent = Math.round((trait.score / MAX_TRAIT_SCORE) * 100);
	const confidence = Math.min(Math.max(Math.round(trait.confidence * 100), 0), 100);
	const isLowConfidence = confidence < 40;

	// Determine trait-specific level letter and human-readable name
	const levelIndex = trait.score < 40 ? 0 : trait.score < 80 ? 1 : 2;
	const levelLetter = TRAIT_LETTER_MAP[trait.name][levelIndex];
	const levelLabel = getTraitLevelLabel(trait.name, levelLetter);

	// Mini ring stroke offset: full circumference = 0%, 0 offset = 100%
	const ringOffset = RING_CIRCUMFERENCE * (1 - confidence / 100);

	return (
		<button
			type="button"
			data-slot="trait-card"
			data-trait={trait.name}
			data-selected={isSelected || undefined}
			aria-label={`${TRAIT_LABELS[trait.name]}: ${trait.score} out of 120, ${levelLabel}, ${confidence}% confidence`}
			aria-expanded={isSelected}
			aria-controls={`trait-detail-zone-${trait.name}`}
			onClick={() => onToggle(trait.name)}
			className="relative flex min-h-11 min-w-0 flex-col h-full text-left rounded-xl border bg-card p-0 overflow-hidden cursor-pointer motion-safe:transition-all motion-safe:duration-200 hover:shadow-[0_8px_32px_rgba(0,0,0,0.06)] motion-safe:hover:-translate-y-0.5 data-selected:shadow-none motion-safe:data-selected:translate-y-0"
			style={
				{
					"--trait-color": traitVar,
					borderColor: isSelected ? traitVar : undefined,
				} as React.CSSProperties
			}
		>
			{/* Color accent bar — top edge */}
			<CardAccent style={{ backgroundColor: traitVar }} />

			<div className="flex-1 flex flex-col p-4">
				{/* Header: shape + name + level badge + confidence ring */}
				<div className="flex items-center gap-2 mb-3">
					<OceanHieroglyph
						letter={TRAIT_HIEROGLYPH_LETTER[trait.name]}
						style={{ width: 20, height: 20 }}
					/>
					<span className="text-sm font-display font-semibold text-foreground">
						{TRAIT_LABELS[trait.name]}
					</span>
					<span
						className="rounded-md px-2 py-0.5 text-[10px] font-bold uppercase"
						style={{
							backgroundColor: `color-mix(in oklch, ${traitVar} 15%, transparent)`,
							color: traitVar,
						}}
					>
						{levelLabel}
					</span>
					<Tooltip>
						<TooltipTrigger asChild>
							<div
								className="ml-auto inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-1 rounded-md"
								data-slot="confidence-ring"
							>
								<svg className="-rotate-90" width={18} height={18} viewBox="0 0 20 20" aria-hidden="true">
									<circle
										cx={10}
										cy={10}
										r={RING_RADIUS}
										fill="none"
										strokeWidth={2.5}
										style={{ stroke: `color-mix(in oklch, ${traitVar} 15%, transparent)` }}
									/>
									<circle
										cx={10}
										cy={10}
										r={RING_RADIUS}
										fill="none"
										strokeWidth={2.5}
										strokeLinecap="round"
										style={{
											stroke: traitVar,
											strokeDasharray: RING_CIRCUMFERENCE,
											strokeDashoffset: ringOffset,
											opacity: isLowConfidence ? 0.5 : 1,
										}}
									/>
								</svg>
								<span
									className="text-[10px] font-semibold text-muted-foreground"
									style={{ opacity: isLowConfidence ? 0.6 : 1 }}
								>
									{confidence}%
								</span>
							</div>
						</TooltipTrigger>
						<TooltipContent>Trait confidence</TooltipContent>
					</Tooltip>
				</div>

				{/* Score display */}
				<div className="flex items-baseline gap-1.5 mb-2">
					<span className="text-3xl font-bold text-foreground">{Math.round(trait.score)}</span>
					<span className="text-sm text-muted-foreground">/120</span>
				</div>

				{/* Score progress bar */}
				<div
					className="w-full bg-muted rounded-full h-2 mb-4"
					role="progressbar"
					aria-valuenow={Math.round(trait.score)}
					aria-valuemin={0}
					aria-valuemax={MAX_TRAIT_SCORE}
					aria-label={`${TRAIT_LABELS[trait.name]}: ${Math.round(trait.score)} out of ${MAX_TRAIT_SCORE}`}
				>
					<div
						className="h-2 rounded-full motion-safe:transition-all motion-safe:duration-500"
						style={{
							width: `${scorePercent}%`,
							backgroundColor: traitVar,
							opacity: isLowConfidence ? 0.5 : 1,
						}}
					/>
				</div>

				{/* Compact 2x3 facet grid */}
				<div className="grid grid-cols-2 gap-x-3 gap-y-2 mb-3">
					{facets.map((facet, i) => (
						<FacetScoreBar key={facet.name} facet={facet} size="compact" staggerIndex={i} />
					))}
				</div>

				{/* Hint — anchored at bottom */}
				<div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mt-auto">
					<span>Tap to see evidence</span>
					<ChevronDown className="w-3 h-3" />
				</div>
			</div>

			{/* Selected arrow indicator */}
			{isSelected && (
				<div
					className="absolute left-1/2 -bottom-[8px] -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent"
					style={{ borderTopColor: traitVar }}
				/>
			)}
		</button>
	);
});
