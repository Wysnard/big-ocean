import type { TraitLevel } from "@workspace/domain";
import { OCEAN_HIEROGLYPHS } from "@workspace/domain";
import { cn } from "@workspace/ui/lib/utils";
import type { CSSProperties } from "react";
import { createElement } from "react";

interface OceanHieroglyphProps {
	/** Trait-level letter (const union: T|M|O|F|S|C|I|B|E|D|P|A|R|V|N) */
	letter: TraitLevel;
	className?: string;
	style?: CSSProperties;
}

export function OceanHieroglyph({ letter, className, style }: OceanHieroglyphProps) {
	const def = OCEAN_HIEROGLYPHS[letter];

	if (!def) return null;

	return (
		<svg
			viewBox={def.viewBox}
			fill="currentColor"
			aria-hidden="true"
			data-slot={`ocean-hieroglyph-${letter.toLowerCase()}`}
			className={cn("shrink-0", className)}
			style={style}
		>
			{def.elements.map((el, i) => createElement(el.tag, { key: i, ...el.attrs }))}
		</svg>
	);
}
