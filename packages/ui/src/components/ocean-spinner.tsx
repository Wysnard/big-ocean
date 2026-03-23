import { useGSAP } from "@gsap/react";
import type { TraitLevel, TraitName } from "@workspace/domain";
import { OCEAN_HIEROGLYPH_PATHS, TRAIT_NAMES } from "@workspace/domain";
import { cn } from "@workspace/ui/lib/utils";
import gsap from "gsap";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";
import { useRef } from "react";

gsap.registerPlugin(MorphSVGPlugin, useGSAP);

interface OceanSpinnerProps {
	/** Hieroglyph letters to cycle through. Default: "OCEAN" */
	code?: string;
	/** Glyph size in px. Default: 32 */
	size?: number;
	/** Duration per morph cycle in seconds. Default: 1.2 */
	duration?: number;
	/** Monochrome mode — uses currentColor, no trait colors. Default: false */
	mono?: boolean;
	/** Accessible label. Default: "Loading" */
	"aria-label"?: string;
	/** Additional CSS classes */
	className?: string;
}

const TRAIT_ORDER: readonly TraitName[] = TRAIT_NAMES;

function getPath(letters: TraitLevel[], index: number): string {
	const letter = letters[index % letters.length] as TraitLevel;
	return OCEAN_HIEROGLYPH_PATHS[letter];
}

function getTraitColor(index: number): string {
	const trait = TRAIT_ORDER[index % TRAIT_ORDER.length] as TraitName;
	return `var(--trait-${trait})`;
}

export function OceanSpinner({
	code = "OCEAN",
	size = 32,
	duration = 1.2,
	mono = false,
	"aria-label": ariaLabel = "Loading",
	className,
}: OceanSpinnerProps) {
	const letters = code.split("") as TraitLevel[];
	const containerRef = useRef<HTMLOutputElement>(null);
	const pathRef = useRef<SVGPathElement>(null);

	useGSAP(
		() => {
			const path = pathRef.current;
			if (!path || letters.length < 2) return;

			const morphDuration = duration * 0.6;
			const holdDuration = duration * 0.4;

			const tl = gsap.timeline({ repeat: -1 });

			for (let i = 0; i < letters.length; i++) {
				const nextIndex = (i + 1) % letters.length;
				const nextPath = getPath(letters, nextIndex);

				// Hold on current shape
				tl.to(path, { duration: holdDuration });

				// Morph to next shape (swap color at midpoint via onUpdate)
				if (!mono) {
					let colorSwapped = false;
					tl.to(path, {
						morphSVG: nextPath,
						duration: morphDuration,
						ease: "power2.inOut",
						onUpdate() {
							if (!colorSwapped && this.progress() >= 0.5) {
								colorSwapped = true;
								gsap.set(path.closest("svg"), { color: getTraitColor(nextIndex) });
							}
						},
						onStart() {
							colorSwapped = false;
						},
					});
				} else {
					tl.to(path, {
						morphSVG: nextPath,
						duration: morphDuration,
						ease: "power2.inOut",
					});
				}
			}
		},
		{ scope: containerRef, dependencies: [letters.join(""), duration, mono] },
	);

	return (
		<output
			ref={containerRef}
			aria-label={ariaLabel}
			className={cn("inline-flex items-center justify-center", className)}
		>
			<svg
				viewBox="0 0 24 24"
				fill="currentColor"
				aria-hidden="true"
				data-slot="ocean-spinner"
				style={{
					width: size,
					height: size,
					color: mono ? undefined : getTraitColor(0),
				}}
			>
				<path ref={pathRef} d={getPath(letters, 0)} />
			</svg>
		</output>
	);
}
