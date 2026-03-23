import type { OceanCode5, TraitLevel, TraitName } from "@workspace/domain";
import { TRAIT_NAMES } from "@workspace/domain";
import { cn } from "@workspace/ui/lib/utils";
import type { CSSProperties } from "react";
import { OceanHieroglyph } from "./ocean-hieroglyph";

interface OceanHieroglyphCodeProps {
	/** 5-letter OCEAN code (e.g., "OCEAR") */
	code: OceanCode5;
	/** Base size in px for all glyphs (default 32) */
	size?: number;
	/** Staggered reveal animation */
	animate?: boolean;
	/** Archetype name displayed below the code */
	archetypeName?: string;
	/** Monochrome mode — skips data-trait, uses currentColor */
	mono?: boolean;
	className?: string;
}

const TRAIT_KEYS: readonly TraitName[] = TRAIT_NAMES;

export function OceanHieroglyphCode({
	code,
	size = 32,
	animate = false,
	archetypeName,
	mono = false,
	className,
}: OceanHieroglyphCodeProps) {
	const raw = code.split("").slice(0, 5);
	const letters = Array.from({ length: 5 }, (_, i) => raw[i] ?? "");

	return (
		<div
			data-slot="ocean-hieroglyph-code"
			className={cn("flex flex-col items-center gap-3", className)}
		>
			<div className="flex items-center gap-[0.2em]">
				{letters.map((letter, index) => {
					const trait = TRAIT_KEYS[index];
					const traitAttrs = mono ? {} : { "data-trait": trait };

					return (
						<span
							key={trait}
							{...traitAttrs}
							className={cn(
								"inline-flex items-center justify-center",
								animate && "motion-safe:animate-hieroglyph-reveal motion-reduce:animate-none",
							)}
							style={
								animate
									? ({
											"--hieroglyph-index": index,
											animationDelay: `${index * 200}ms`,
											animationFillMode: "both",
										} as CSSProperties)
									: undefined
							}
						>
							<OceanHieroglyph letter={letter as TraitLevel} style={{ width: size, height: size }} />
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
