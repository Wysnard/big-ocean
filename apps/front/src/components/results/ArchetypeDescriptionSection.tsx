import type { OceanCode5, TraitName } from "@workspace/domain";
import { getTraitColor } from "@workspace/domain";
import { GeometricSignature } from "../ocean-shapes/GeometricSignature";

interface ArchetypeDescriptionSectionProps {
	archetypeName: string;
	description: string;
	oceanCode: OceanCode5;
	dominantTrait: TraitName;
	secondaryTrait: TraitName;
}

export function ArchetypeDescriptionSection({
	archetypeName,
	description,
	oceanCode,
	dominantTrait,
	secondaryTrait,
}: ArchetypeDescriptionSectionProps) {
	const dominantColor = getTraitColor(dominantTrait);
	const secondaryColor = getTraitColor(secondaryTrait);

	return (
		<section
			data-slot="archetype-description-section"
			className="relative py-20 md:py-32"
			style={{
				background: `linear-gradient(180deg, color-mix(in oklch, ${dominantColor} 8%, transparent) 0%, transparent 40%, transparent 60%, color-mix(in oklch, ${secondaryColor} 5%, transparent) 100%)`,
			}}
		>
			<div className="relative mx-auto max-w-[720px] px-6 text-center">
				{/* GeometricSignature as visual divider */}
				<div className="mb-8 opacity-40" aria-hidden="true">
					<GeometricSignature oceanCode={oceanCode} baseSize={24} />
				</div>

				{/* Section title */}
				<h2 className="font-display text-2xl text-muted-foreground mb-8">About The {archetypeName}</h2>

				{/* Description block with decorative quotes */}
				<div className="relative">
					<span
						className="absolute -top-8 -left-4 font-display text-8xl leading-none select-none hidden md:block"
						aria-hidden="true"
						style={{ color: dominantColor, opacity: 0.2 }}
					>
						&ldquo;
					</span>

					<p className="font-body text-lg md:text-xl leading-relaxed text-foreground">{description}</p>

					<span
						className="absolute -bottom-12 -right-4 font-display text-8xl leading-none select-none hidden md:block"
						aria-hidden="true"
						style={{ color: dominantColor, opacity: 0.2 }}
					>
						&rdquo;
					</span>
				</div>
			</div>
		</section>
	);
}
