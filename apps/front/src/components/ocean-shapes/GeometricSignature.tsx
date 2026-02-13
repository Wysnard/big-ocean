import { TRAIT_LETTER_MAP } from "@workspace/domain";
import { cn } from "@workspace/ui/lib/utils";
import { OceanCircle } from "./OceanCircle";
import { OceanDiamond } from "./OceanDiamond";
import { OceanHalfCircle } from "./OceanHalfCircle";
import { OceanRectangle } from "./OceanRectangle";
import { OceanTriangle } from "./OceanTriangle";

type SizeTier = "small" | "medium" | "large";

/** Maps trait-specific letters to size tiers using TRAIT_LETTER_MAP from domain */
const LETTER_TO_SIZE_TIER: Record<string, SizeTier> = {};

for (const [, letters] of Object.entries(TRAIT_LETTER_MAP)) {
	LETTER_TO_SIZE_TIER[letters[0]] = "small"; // Low
	LETTER_TO_SIZE_TIER[letters[1]] = "medium"; // Mid
	LETTER_TO_SIZE_TIER[letters[2]] = "large"; // High
}

const SIZE_MULTIPLIERS: Record<SizeTier, number> = {
	small: 0.5,
	medium: 0.75,
	large: 1.0,
};

function getShapeSize(letter: string, baseSize: number): number {
	const tier = LETTER_TO_SIZE_TIER[letter] ?? "medium";
	return baseSize * SIZE_MULTIPLIERS[tier];
}

interface GeometricSignatureProps {
	/** 5-letter OCEAN code (e.g., "ODEWR") */
	oceanCode: string;
	/** Base size in px — Large shapes use this, Medium = 0.75x, Small = 0.5x */
	baseSize?: number;
	/** Whether to animate the reveal */
	animate?: boolean;
	/** Optional archetype name to show below the signature */
	archetypeName?: string;
	className?: string;
}

export function GeometricSignature({
	oceanCode,
	baseSize = 32,
	animate = false,
	archetypeName,
	className,
}: GeometricSignatureProps) {
	const letters = oceanCode.split("").slice(0, 5);
	const [o, c, e, a, n] = letters;

	const shapes = [
		{
			key: "o",
			Component: OceanCircle,
			letter: o,
			color: "var(--trait-openness)",
		},
		{
			key: "c",
			Component: OceanHalfCircle,
			letter: c,
			color: "var(--trait-conscientiousness)",
		},
		{
			key: "e",
			Component: OceanRectangle,
			letter: e,
			color: "var(--trait-extraversion)",
		},
		{
			key: "a",
			Component: OceanTriangle,
			letter: a,
			color: "var(--trait-agreeableness)",
		},
		{
			key: "n",
			Component: OceanDiamond,
			letter: n,
			color: "var(--trait-neuroticism)",
		},
	];

	return (
		<div
			data-slot="geometric-signature"
			className={cn("flex flex-col items-center gap-3", className)}
		>
			<div className="flex items-center gap-[0.2em]">
				{shapes.map((shape, index) => (
					<span
						key={shape.key}
						className={cn(
							"inline-flex items-center justify-center",
							animate && "motion-safe:animate-shape-reveal motion-reduce:animate-none",
						)}
						style={
							animate
								? ({
										"--shape-index": index,
										animationDelay: `${index * 200}ms`,
										animationFillMode: "both",
									} as React.CSSProperties)
								: undefined
						}
					>
						<shape.Component size={getShapeSize(shape.letter ?? "", baseSize)} color={shape.color} />
					</span>
				))}
			</div>
			{archetypeName && (
				<span
					className={cn(
						"text-sm font-heading font-semibold text-foreground",
						animate && "motion-safe:animate-fade-in motion-reduce:animate-none",
					)}
					style={animate ? { animationDelay: "1200ms", animationFillMode: "both" } : undefined}
				>
					{archetypeName}
				</span>
			)}
		</div>
	);
}
