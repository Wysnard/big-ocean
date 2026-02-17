import type { OceanCode5, TraitName } from "@workspace/domain";
import { getTraitColor } from "@workspace/domain";
import { GeometricSignature } from "../ocean-shapes/GeometricSignature";

interface ArchetypeHeroSectionProps {
	archetypeName: string;
	oceanCode5: OceanCode5;
	overallConfidence?: number;
	isCurated?: boolean;
	/** The dominant trait (highest scoring) used for hero color theming */
	dominantTrait: TraitName;
	/** When set, shows "{name}'s Personality Archetype" instead of "Your Personality Archetype" */
	displayName?: string | null;
}

export function ArchetypeHeroSection({
	archetypeName,
	oceanCode5,
	overallConfidence,
	dominantTrait,
	displayName,
}: ArchetypeHeroSectionProps) {
	const traitColor = getTraitColor(dominantTrait);

	return (
		<section
			data-slot="archetype-hero-section"
			className="relative overflow-hidden px-6 py-16 md:py-24"
		>
			{/* Color block composition — decorative geometric shapes */}
			<div className="absolute inset-0 overflow-hidden" aria-hidden="true">
				{/* Dominant: large circle in trait color */}
				<div
					className="absolute -top-[20%] -right-[10%] z-0 aspect-square w-[60vmin] rounded-full"
					style={{ backgroundColor: traitColor, opacity: 0.85 }}
				/>
				{/* Secondary: triangle in complementary position */}
				<div
					className="absolute bottom-0 left-0 z-10 w-[35vmin] aspect-[3/4]"
					style={{
						backgroundColor: traitColor,
						opacity: 0.35,
						clipPath: "polygon(0 100%, 100% 100%, 50% 0)",
					}}
				/>
				{/* Tertiary: small rectangle */}
				<div
					className="absolute top-[15%] left-[8%] z-10 w-[18vmin] aspect-square rounded-xl"
					style={{ backgroundColor: traitColor, opacity: 0.2 }}
				/>
			</div>

			{/* Content — always above shapes */}
			<div className="relative z-30 mx-auto max-w-2xl text-center">
				{/* Subtitle */}
				<p className="text-sm tracking-wider uppercase font-heading text-foreground/70 mb-4">
					{displayName ? `${displayName}\u2019s Personality Archetype` : "Your Personality Archetype"}
				</p>

				{/* Geometric Signature */}
				<div className="mb-6">
					<GeometricSignature
						oceanCode={oceanCode5}
						baseSize={48}
						animate
						className="motion-safe:animate-shape-reveal motion-reduce:!animate-none [&_span]:motion-reduce:!animate-none [&_span]:motion-reduce:opacity-100"
					/>
				</div>

				{/* Archetype Name — display-hero scale */}
				<h1
					data-testid="archetype-name"
					className="font-display text-[2.5rem] md:text-[3.5rem] lg:text-[4rem] font-bold leading-[1.05] text-foreground mb-2"
				>
					{archetypeName}
				</h1>

				{/* OCEAN code — promoted secondary headline */}
				<p
					data-testid="ocean-code"
					title={`OCEAN personality code: ${oceanCode5}`}
					className="font-mono text-3xl md:text-4xl lg:text-5xl tracking-[0.3em] text-foreground/80"
				>
					{oceanCode5}
				</p>

				{/* Confidence — tertiary metadata pill */}
				{overallConfidence != null && (
					<p className="mt-4 text-xs font-medium text-foreground/60 bg-foreground/8 rounded-full px-3 py-1 inline-block">
						{overallConfidence}% confidence
					</p>
				)}
			</div>
		</section>
	);
}
