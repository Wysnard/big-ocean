import {
	OCEAN_HIEROGLYPHS,
	type OceanCode5,
	TRAIT_NAMES,
	type TraitLevel,
	type TraitName,
} from "@workspace/domain";
import { cn } from "@workspace/ui/lib/utils";
import { createElement } from "react";

export const SIZE_PX = {
	hero: 28,
	profile: 18,
	card: 12,
	mini: 10,
} as const;

export const GEOMETRIC_SIGNATURE_COLORS: Record<TraitName, string> = {
	openness: "#A855F7",
	conscientiousness: "#FF6B2B",
	extraversion: "#FF0080",
	agreeableness: "#00B4A6",
	neuroticism: "#1c1c9c",
};

type GeometricSignatureSize = keyof typeof SIZE_PX;

interface GeometricSignatureProps {
	oceanCode5: OceanCode5;
	size: GeometricSignatureSize;
	traitColors?: Partial<Record<TraitName, string>>;
	className?: string;
}

export function GeometricSignature({
	oceanCode5,
	size,
	traitColors,
	className,
}: GeometricSignatureProps) {
	const letters = Array.from(oceanCode5).slice(0, TRAIT_NAMES.length) as TraitLevel[];
	const pxSize = SIZE_PX[size];

	return (
		<span
			data-slot="geometric-signature"
			data-testid="geometric-signature"
			role="group"
			aria-label={`Personality signature: ${letters.join(" ")}`}
			className={cn(className)}
			style={{ display: "inline-flex", alignItems: "center", gap: "0.2em" }}
		>
			{letters.map((letter, index) => {
				const trait = TRAIT_NAMES[index];
				const def = OCEAN_HIEROGLYPHS[letter];

				if (!def || !trait) {
					return null;
				}

				const resolvedColor = traitColors?.[trait] ?? GEOMETRIC_SIGNATURE_COLORS[trait];

				return (
					<span key={trait} role="img" aria-label={trait} style={{ display: "inline-flex" }}>
						<svg
							width={pxSize}
							height={pxSize}
							viewBox={def.viewBox}
							aria-hidden="true"
							style={{ display: "block" }}
						>
							{def.elements.map((element, elementIndex) =>
								createElement(element.tag, {
									key: elementIndex,
									...element.attrs,
									fill: resolvedColor,
								}),
							)}
						</svg>
					</span>
				);
			})}
		</span>
	);
}
