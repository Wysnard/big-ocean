import type { OceanCode5, TraitName } from "@workspace/domain";
import { BIG_FIVE_TRAITS, getTraitColor, getTraitLevelLabel } from "@workspace/domain";
import { Tooltip, TooltipContent, TooltipTrigger } from "@workspace/ui/components/tooltip";
import { ChevronDown } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { GeometricSignature } from "../ocean-shapes/GeometricSignature";

/** Capitalized trait labels for tooltip display */
const TRAIT_DISPLAY_NAMES: Record<TraitName, string> = {
	openness: "Openness",
	conscientiousness: "Conscientiousness",
	extraversion: "Extraversion",
	agreeableness: "Agreeableness",
	neuroticism: "Neuroticism",
};

interface ArchetypeHeroSectionProps {
	archetypeName: string;
	oceanCode5: OceanCode5;
	overallConfidence?: number;
	isCurated?: boolean;
	/** The dominant trait (highest scoring) used for hero color theming */
	dominantTrait: TraitName;
	/** 2-3 sentence archetype description displayed prominently below the name */
	description?: string | null;
	/** When set, shows "{name}'s Personality Archetype" instead of "Your Personality Archetype" */
	displayName?: string | null;
	/** Override the subtitle text entirely */
	subtitle?: string;
	/** Show animated scroll indicator chevron at bottom. Fades on first scroll. */
	showScrollIndicator?: boolean;
	/** Framing line displayed above the subtitle (e.g. "[Name] dove deep with Nerin — here's what surfaced") */
	framingLine?: string;
}

function ScrollIndicator() {
	const [visible, setVisible] = useState(true);
	useEffect(() => {
		const onScroll = () => {
			if (window.scrollY > 50) setVisible(false);
		};
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, []);

	return (
		<div
			aria-hidden="true"
			className="absolute bottom-8 left-1/2 -translate-x-1/2 motion-safe:transition-opacity motion-safe:duration-300 motion-reduce:hidden"
			style={{ opacity: visible ? 1 : 0 }}
		>
			<ChevronDown className="w-6 h-6 text-muted-foreground motion-safe:animate-bounce" />
		</div>
	);
}

export function ArchetypeHeroSection({
	archetypeName,
	oceanCode5,
	overallConfidence,
	dominantTrait,
	description,
	displayName,
	subtitle,
	showScrollIndicator,
	framingLine,
}: ArchetypeHeroSectionProps) {
	const traitColor = getTraitColor(dominantTrait);
	const tooltipBaseId = useId();

	const resolvedSubtitle =
		subtitle ??
		(displayName ? `${displayName}\u2019s Personality Archetype` : "Your Personality Archetype");

	return (
		<section
			data-testid="archetype-hero-section"
			className={`relative overflow-hidden px-6 py-16 md:py-24 ${showScrollIndicator ? "min-h-[70vh] flex items-center justify-center" : ""}`}
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
				{/* Framing line — public profile only */}
				{framingLine && (
					<p data-testid="framing-line" className="text-base md:text-lg text-foreground/60 italic mb-2">
						{framingLine}
					</p>
				)}

				{/* Subtitle */}
				<p className="text-sm tracking-wider uppercase font-heading text-foreground/70 mb-4">
					{resolvedSubtitle}
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

				{/* OCEAN code — each letter as a navigable button with tooltip (AC #2) */}
				<div
					data-testid="ocean-code"
					title={`OCEAN personality code: ${oceanCode5}`}
					className="font-mono text-3xl md:text-4xl lg:text-5xl tracking-[0.3em] flex items-center justify-center gap-1"
				>
					{oceanCode5.split("").map((letter, i) => {
						const traitName = BIG_FIVE_TRAITS[i];
						const levelLabel = getTraitLevelLabel(traitName, letter);
						const tooltipId = `${tooltipBaseId}-trait-${traitName}`;
						return (
							<Tooltip key={traitName}>
								<TooltipTrigger asChild>
									<button
										type="button"
										aria-describedby={tooltipId}
										className="min-w-11 min-h-11 inline-flex items-center justify-center rounded-md hover:bg-foreground/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
										style={{ color: getTraitColor(traitName) }}
									>
										{letter}
									</button>
								</TooltipTrigger>
								<TooltipContent id={tooltipId} side="bottom">
									{TRAIT_DISPLAY_NAMES[traitName]}: {levelLabel}
								</TooltipContent>
							</Tooltip>
						);
					})}
				</div>

				{/* Confidence — tertiary metadata pill */}
				{overallConfidence != null && (
					<p className="mt-4 text-xs font-medium text-foreground/60 bg-foreground/8 rounded-full px-3 py-1 inline-block">
						{Math.round(overallConfidence * 100)}% confidence
					</p>
				)}

				{/* Archetype description — 2-3 sentences (AC #2) */}
				{description && (
					<p className="mt-6 text-base md:text-lg text-foreground/80 leading-relaxed max-w-xl mx-auto">
						{description}
					</p>
				)}
			</div>

			{showScrollIndicator && <ScrollIndicator />}
		</section>
	);
}
