import type { OceanCode5 } from "@workspace/domain";
import { cn } from "@workspace/ui/lib/utils";
import type { ComponentType } from "react";
import { OceanCircle } from "./OceanCircle";
import { OceanCross } from "./OceanCross";
import { OceanCutSquare } from "./OceanCutSquare";
import { OceanDiamond } from "./OceanDiamond";
import { OceanDoubleQuarter } from "./OceanDoubleQuarter";
import { OceanHalfCircle } from "./OceanHalfCircle";
import { OceanInvertedTriangle } from "./OceanInvertedTriangle";
import { OceanLollipop } from "./OceanLollipop";
import { OceanOval } from "./OceanOval";
import { OceanQuarterCircle } from "./OceanQuarterCircle";
import { OceanRectangle } from "./OceanRectangle";
import { OceanReversedHalfCircle } from "./OceanReversedHalfCircle";
import { OceanTable } from "./OceanTable";
import { OceanThreeQuarterSquare } from "./OceanThreeQuarterSquare";
import { OceanTriangle } from "./OceanTriangle";

type ShapeProps = { size?: number; color?: string; className?: string };

/** Maps each OCEAN code letter to its unique shape component */
const LETTER_TO_SHAPE: Record<string, ComponentType<ShapeProps>> = {
	// Openness: T (Low), M (Mid), O (High)
	T: OceanCross,
	M: OceanCutSquare,
	O: OceanCircle,
	// Conscientiousness: F (Low), S (Mid), C (High)
	F: OceanThreeQuarterSquare,
	S: OceanDoubleQuarter,
	C: OceanHalfCircle,
	// Extraversion: I (Low), B (Mid), E (High)
	I: OceanOval,
	B: OceanQuarterCircle,
	E: OceanRectangle,
	// Agreeableness: D (Low), P (Mid), A (High)
	D: OceanReversedHalfCircle,
	P: OceanLollipop,
	A: OceanTriangle,
	// Neuroticism: R (Low), V (Mid), N (High)
	R: OceanTable,
	V: OceanInvertedTriangle,
	N: OceanDiamond,
};

const VALID_LETTERS = new Set(Object.keys(LETTER_TO_SHAPE));

/** Trait colors in OCEAN order */
const TRAIT_COLORS = [
	"var(--trait-openness)",
	"var(--trait-conscientiousness)",
	"var(--trait-extraversion)",
	"var(--trait-agreeableness)",
	"var(--trait-neuroticism)",
];

interface GeometricSignatureProps {
	/** 5-letter OCEAN code (e.g., "OCEAR") */
	oceanCode: OceanCode5;
	/** Base size in px for all shapes (uniform sizing) */
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
	if (process.env.NODE_ENV !== "production") {
		if (oceanCode.length !== 5) {
			console.warn(
				`[GeometricSignature] Expected 5-letter OCEAN code, got "${oceanCode}" (${oceanCode.length} chars)`,
			);
		}
		for (const letter of oceanCode) {
			if (!VALID_LETTERS.has(letter)) {
				console.warn(
					`[GeometricSignature] Unknown trait letter "${letter}" in code "${oceanCode}". Valid letters: ${[...VALID_LETTERS].join(", ")}`,
				);
			}
		}
	}

	// Always produce exactly 5 entries — pad with empty strings for short codes
	const raw = oceanCode.split("").slice(0, 5);
	const letters = Array.from({ length: 5 }, (_, i) => raw[i] ?? "");
	const TRAIT_KEYS = ["o", "c", "e", "a", "n"];

	return (
		<div
			data-slot="geometric-signature"
			className={cn("flex flex-col items-center gap-3", className)}
		>
			<div className="flex items-center gap-[0.2em]">
				{letters.map((letter, index) => {
					const ShapeComponent = LETTER_TO_SHAPE[letter] ?? OceanCircle;
					return (
						<span
							key={TRAIT_KEYS[index]}
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
							<ShapeComponent size={baseSize} color={TRAIT_COLORS[index]} />
						</span>
					);
				})}
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
