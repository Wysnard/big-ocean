import type { FacetResult, TraitLevel, TraitName, TraitResult } from "@workspace/domain";
import { OceanHieroglyph } from "@workspace/ui/components/ocean-hieroglyph";
import { useEffect, useRef, useState } from "react";
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

interface TraitBandProps {
	trait: TraitResult;
	facets: readonly FacetResult[];
}

export function TraitBand({ trait, facets }: TraitBandProps) {
	const traitVar = `var(--trait-${trait.name})`;
	const scorePercent = Math.round((trait.score / MAX_TRAIT_SCORE) * 100);

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
			data-trait={trait.name}
			className="p-6 motion-safe:transition-all motion-safe:duration-500"
			style={{
				borderLeft: `4px solid ${traitVar}`,
				backgroundColor: `color-mix(in oklch, ${traitVar} 5%, transparent)`,
				opacity: visible ? 1 : 0,
				transform: visible ? "translateY(0)" : "translateY(12px)",
			}}
		>
			{/* Header row */}
			<div className="flex items-center gap-3 mb-2">
				<OceanHieroglyph
					letter={TRAIT_HIEROGLYPH_LETTER[trait.name]}
					style={{ width: 24, height: 24 }}
				/>
				<h2 className="font-display text-xl font-semibold text-foreground flex-1">
					{TRAIT_LABELS[trait.name]}
				</h2>
				<span className="font-data text-2xl font-bold">
					{trait.score}
					<span className="text-sm text-muted-foreground font-normal">/120</span>
				</span>
			</div>

			{/* Trait score bar */}
			<div className="w-full bg-muted rounded-full h-2 mb-5">
				<div
					className="h-2 rounded-full motion-safe:transition-all motion-safe:duration-700"
					style={{ width: `${scorePercent}%`, backgroundColor: traitVar }}
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
