import type { TraitLevel, TraitName } from "@workspace/domain";
import { cn } from "@workspace/ui/lib/utils";
import { OceanHieroglyph } from "./ocean-hieroglyph";

interface OceanHieroglyphSetProps {
	size?: number;
	/** Monochrome mode — skips data-trait, uses currentColor */
	mono?: boolean;
	className?: string;
}

/** The 5 "high" glyphs in OCEAN order — used for branding */
const HIGH_GLYPHS: ReadonlyArray<{ letter: TraitLevel; trait: TraitName }> = [
	{ letter: "O", trait: "openness" },
	{ letter: "C", trait: "conscientiousness" },
	{ letter: "E", trait: "extraversion" },
	{ letter: "A", trait: "agreeableness" },
	{ letter: "N", trait: "neuroticism" },
];

export function OceanHieroglyphSet({
	size = 24,
	mono = false,
	className,
}: OceanHieroglyphSetProps) {
	return (
		<span
			data-slot="ocean-hieroglyph-set"
			className={cn("inline-flex items-center gap-[0.15em]", className)}
		>
			{HIGH_GLYPHS.map(({ letter, trait }) => (
				<span key={trait} {...(mono ? {} : { "data-trait": trait })}>
					<OceanHieroglyph letter={letter} style={{ width: size, height: size }} />
				</span>
			))}
		</span>
	);
}
