import { cn } from "@workspace/ui/lib/utils";

type TraitLetter = "O" | "C" | "E" | "A" | "N";

interface FacetIconProps {
	trait: TraitLetter;
	className?: string;
}

/** CSS variable for each trait color */
const TRAIT_COLORS: Record<TraitLetter, string> = {
	O: "var(--trait-openness)",
	C: "var(--trait-conscientiousness)",
	E: "var(--trait-extraversion)",
	A: "var(--trait-agreeableness)",
	N: "var(--trait-neuroticism)",
};

/** SVG shape path for each trait */
function TraitShape({ trait }: { trait: TraitLetter }) {
	switch (trait) {
		case "O": // Circle
			return <circle cx="9" cy="9" r="7" />;
		case "C": // Half-circle
			return <path d="M9 2a7 7 0 0 1 0 14V2z" />;
		case "E": // Slim rectangle
			return <rect x="4" y="2" width="10" height="14" rx="1" />;
		case "A": // Triangle
			return <polygon points="9,2 16,16 2,16" />;
		case "N": // Diamond
			return <polygon points="9,1 16,9 9,17 2,9" />;
	}
}

/**
 * Inline facet icon showing a colored OCEAN shape with trait letter.
 * Prepared for future use when Nerin's messages include trait/facet annotations.
 */
export function FacetIcon({ trait, className }: FacetIconProps) {
	return (
		<span
			data-slot="facet-icon"
			className={cn(
				"inline-flex items-center justify-center w-[18px] h-[18px] align-middle cursor-help mx-0.5",
				className,
			)}
			title={`Trait: ${trait}`}
		>
			<svg
				width={18}
				height={18}
				viewBox="0 0 18 18"
				fill={TRAIT_COLORS[trait]}
				aria-hidden="true"
			>
				<TraitShape trait={trait} />
				<text
					x="9"
					y="10"
					textAnchor="middle"
					dominantBaseline="central"
					fill="white"
					fontSize="7"
					fontWeight="bold"
					fontFamily="monospace"
				>
					{trait}
				</text>
			</svg>
		</span>
	);
}
