import type { FacetResult, TraitName, TraitResult } from "@workspace/domain";
import { getTraitColor } from "@workspace/domain";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { OceanCircle } from "../ocean-shapes/OceanCircle";
import { OceanDiamond } from "../ocean-shapes/OceanDiamond";
import { OceanHalfCircle } from "../ocean-shapes/OceanHalfCircle";
import { OceanRectangle } from "../ocean-shapes/OceanRectangle";
import { OceanTriangle } from "../ocean-shapes/OceanTriangle";
import { FacetScoreBar } from "./FacetScoreBar";

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

interface TraitBandProps {
	trait: TraitResult;
	facets: readonly FacetResult[];
}

export function TraitBand({ trait, facets }: TraitBandProps) {
	const traitColor = getTraitColor(trait.name);
	const scorePercent = Math.round((trait.score / MAX_TRAIT_SCORE) * 100);
	const ShapeComponent = TRAIT_SHAPE[trait.name];

	const ref = useRef<HTMLDivElement>(null);
	const [visible, setVisible] = useState(false);
	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) setVisible(true);
			},
			{ threshold: 0.1 },
		);
		observer.observe(el);
		return () => observer.disconnect();
	}, []);

	return (
		<div
			ref={ref}
			data-testid={`trait-band-${trait.name}`}
			className="p-6 motion-safe:transition-all motion-safe:duration-500"
			style={{
				borderLeft: `4px solid ${traitColor}`,
				backgroundColor: `color-mix(in oklch, ${traitColor} 5%, transparent)`,
				opacity: visible ? 1 : 0,
				transform: visible ? "translateY(0)" : "translateY(12px)",
			}}
		>
			{/* Header row */}
			<div className="flex items-center gap-3 mb-2">
				<ShapeComponent size={24} color={traitColor} />
				<h2 className="font-display text-xl font-semibold text-foreground flex-1">
					{TRAIT_LABELS[trait.name]}
				</h2>
				<span className="font-data text-2xl font-bold" style={{ color: traitColor }}>
					{trait.score}
					<span className="text-sm text-muted-foreground font-normal">/120</span>
				</span>
			</div>

			{/* Trait score bar */}
			<div className="w-full bg-muted rounded-full h-2 mb-5">
				<div
					className="h-2 rounded-full motion-safe:transition-all motion-safe:duration-700"
					style={{ width: `${scorePercent}%`, backgroundColor: traitColor }}
				/>
			</div>

			{/* Facet grid */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-3">
				{facets.map((facet) => (
					<FacetScoreBar key={facet.name} facet={facet} size="standard" />
				))}
			</div>
		</div>
	);
}
