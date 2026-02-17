import type { FacetResult, TraitName, TraitResult } from "@workspace/domain";
import {
	getTraitColor,
	TRAIT_LETTER_MAP,
	TRAIT_LEVEL_LABELS,
	toFacetDisplayName,
} from "@workspace/domain";
import { CardAccent } from "@workspace/ui/components/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@workspace/ui/components/tooltip";
import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { memo } from "react";
import { OceanCircle } from "../ocean-shapes/OceanCircle";
import { OceanDiamond } from "../ocean-shapes/OceanDiamond";
import { OceanHalfCircle } from "../ocean-shapes/OceanHalfCircle";
import { OceanRectangle } from "../ocean-shapes/OceanRectangle";
import { OceanTriangle } from "../ocean-shapes/OceanTriangle";

const TRAIT_SHAPE: Record<TraitName, (props: { size?: number; color?: string }) => ReactNode> = {
	openness: OceanCircle,
	conscientiousness: OceanHalfCircle,
	extraversion: OceanRectangle,
	agreeableness: OceanTriangle,
	neuroticism: OceanDiamond,
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
	const traitColor = getTraitColor(trait.name);
	const scorePercent = Math.round((trait.score / MAX_TRAIT_SCORE) * 100);
	const ShapeComponent = TRAIT_SHAPE[trait.name];
	const confidence = Math.min(Math.max(Math.round(trait.confidence), 0), 100);
	const isLowConfidence = confidence < 40;

	// Determine trait-specific level letter and human-readable name
	const levelIndex = trait.score < 40 ? 0 : trait.score < 80 ? 1 : 2;
	const levelLetter = TRAIT_LETTER_MAP[trait.name][levelIndex];
	const levelLabel = TRAIT_LEVEL_LABELS[levelLetter] ?? levelLetter;

	// Mini ring stroke offset: full circumference = 0%, 0 offset = 100%
	const ringOffset = RING_CIRCUMFERENCE * (1 - confidence / 100);

	return (
		<button
			type="button"
			data-slot="trait-card"
			data-trait={trait.name}
			data-selected={isSelected || undefined}
			onClick={() => onToggle(trait.name)}
			className="relative flex flex-col h-full text-left rounded-xl border bg-card p-0 overflow-hidden cursor-pointer motion-safe:transition-all motion-safe:duration-200 hover:shadow-[0_8px_32px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 data-selected:shadow-none data-selected:translate-y-0"
			style={
				{
					"--trait-color": traitColor,
					borderColor: isSelected ? traitColor : undefined,
				} as React.CSSProperties
			}
		>
			{/* Color accent bar — top edge */}
			<CardAccent style={{ backgroundColor: traitColor }} />

			<div className="flex-1 flex flex-col p-4">
				{/* Header: shape + name + level badge + confidence ring */}
				<div className="flex items-center gap-2 mb-3">
					<ShapeComponent size={20} color={traitColor} />
					<span className="text-sm font-semibold text-foreground">{TRAIT_LABELS[trait.name]}</span>
					<span
						className="rounded-md px-2 py-0.5 text-[10px] font-bold uppercase"
						style={{
							backgroundColor: `color-mix(in oklch, ${traitColor} 15%, transparent)`,
							color: traitColor,
						}}
					>
						{levelLabel}
					</span>
					<Tooltip>
						<TooltipTrigger asChild>
							<div className="ml-auto flex items-center gap-1" data-slot="confidence-ring">
								<svg className="-rotate-90" width={18} height={18} viewBox="0 0 20 20" aria-hidden="true">
									<circle
										cx={10}
										cy={10}
										r={RING_RADIUS}
										fill="none"
										strokeWidth={2.5}
										style={{ stroke: `color-mix(in oklch, ${traitColor} 15%, transparent)` }}
									/>
									<circle
										cx={10}
										cy={10}
										r={RING_RADIUS}
										fill="none"
										strokeWidth={2.5}
										strokeLinecap="round"
										style={{
											stroke: traitColor,
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
					<span className="text-3xl font-bold text-foreground">{trait.score}</span>
					<span className="text-sm text-muted-foreground">/120</span>
				</div>

				{/* Score progress bar */}
				<div className="w-full bg-muted rounded-full h-2 mb-4">
					<div
						className="h-2 rounded-full motion-safe:transition-all motion-safe:duration-500"
						style={{
							width: `${scorePercent}%`,
							backgroundColor: traitColor,
							opacity: isLowConfidence ? 0.5 : 1,
						}}
					/>
				</div>

				{/* Compact 2x3 facet grid */}
				<div className="grid grid-cols-2 gap-x-3 gap-y-2 mb-3">
					{facets.map((facet) => {
						const facetPct = Math.round((facet.score / 20) * 100);
						return (
							<div key={facet.name} className="flex items-center gap-1.5">
								<div className="flex-1 min-w-0">
									<div className="flex items-center justify-between">
										<span className="text-[10px] text-muted-foreground truncate">
											{toFacetDisplayName(facet.name)}
										</span>
										<span className="text-[10px] font-medium text-muted-foreground ml-1">{facet.score}</span>
									</div>
									<div className="w-full bg-muted rounded-full h-1 mt-0.5">
										<div
											className="h-1 rounded-full"
											style={{ width: `${facetPct}%`, backgroundColor: traitColor, opacity: 0.6 }}
										/>
									</div>
								</div>
							</div>
						);
					})}
				</div>

				{/* Hint — anchored at bottom */}
				<div className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground mt-auto">
					<span>Tap to see evidence</span>
					<ChevronDown className="w-3 h-3" />
				</div>
			</div>

			{/* Selected arrow indicator */}
			{isSelected && (
				<div
					className="absolute left-1/2 -bottom-[8px] -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent"
					style={{ borderTopColor: traitColor }}
				/>
			)}
		</button>
	);
});
