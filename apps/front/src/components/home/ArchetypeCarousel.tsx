import type { OceanCode4, OceanCode5 } from "@workspace/domain";
import { useReducedMotion } from "motion/react";
import { useCallback, useRef } from "react";
import { ArchetypeCard } from "@/components/results/ArchetypeCard";

/** Epics Story 9.3: carousel lives in World After (marketing previews; static data). */
const HOMEPAGE_ARCHETYPE_SAMPLES: ReadonlyArray<{
	readonly name: string;
	readonly oceanCode5: OceanCode5;
	readonly oceanCode4: OceanCode4;
	readonly description: string;
	readonly color: string;
	readonly overallConfidence: number;
}> = [
	{
		name: "The Deep Current",
		oceanCode5: "OCEAR" as OceanCode5,
		oceanCode4: "OCEA" as OceanCode4,
		description: "Steady presence with room for complexity.",
		color: "var(--trait-openness)",
		overallConfidence: 86,
	},
	{
		name: "The Open Harbor",
		oceanCode5: "OCBAV" as OceanCode5,
		oceanCode4: "OCBA" as OceanCode4,
		description: "Warm boundaries without performance.",
		color: "var(--trait-agreeableness)",
		overallConfidence: 79,
	},
	{
		name: "The Quiet Architect",
		oceanCode5: "TFIDR" as OceanCode5,
		oceanCode4: "TFID" as OceanCode4,
		description: "Structure as care, not control.",
		color: "var(--trait-conscientiousness)",
		overallConfidence: 82,
	},
	{
		name: "The Steady Flame",
		oceanCode5: "MCBAN" as OceanCode5,
		oceanCode4: "MCBA" as OceanCode4,
		description: "Intensity with a long fuse.",
		color: "var(--trait-extraversion)",
		overallConfidence: 76,
	},
	{
		name: "The Soft Signal",
		oceanCode5: "TFSEN" as OceanCode5,
		oceanCode4: "TFSE" as OceanCode4,
		description: "Precision without sharp edges.",
		color: "var(--trait-neuroticism)",
		overallConfidence: 81,
	},
];

export function ArchetypeCarousel() {
	const scrollerRef = useRef<HTMLDivElement>(null);
	const reduceMotion = useReducedMotion();

	const scrollByCard = useCallback(
		(direction: -1 | 1) => {
			const el = scrollerRef.current;
			if (!el) {
				return;
			}
			const card = el.querySelector<HTMLElement>("[data-carousel-card]");
			const delta = (card?.offsetWidth ?? 280) + 16;
			el.scrollBy({ left: direction * delta, behavior: reduceMotion ? "auto" : "smooth" });
		},
		[reduceMotion],
	);

	return (
		<div
			data-slot="homepage-archetype-carousel"
			data-testid="homepage-archetype-carousel"
			className="w-full"
		>
			<div className="mb-3 flex items-center justify-between gap-2">
				<p className="text-xs font-semibold tracking-[0.22em] text-muted-foreground uppercase">
					Archetypes
				</p>
				<div className="flex gap-2">
					<button
						type="button"
						className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground shadow-sm transition-colors duration-200 hover:bg-accent"
						aria-label="Previous archetypes"
						onClick={() => scrollByCard(-1)}
					>
						←
					</button>
					<button
						type="button"
						className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground shadow-sm transition-colors duration-200 hover:bg-accent"
						aria-label="Next archetypes"
						onClick={() => scrollByCard(1)}
					>
						→
					</button>
				</div>
			</div>
			<div
				ref={scrollerRef}
				className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
				data-testid="homepage-archetype-carousel-track"
			>
				{HOMEPAGE_ARCHETYPE_SAMPLES.map((item) => (
					<div
						key={item.oceanCode5}
						data-carousel-card
						data-testid="homepage-archetype-card"
						className="w-[min(22rem,84vw)] shrink-0 snap-center"
					>
						<ArchetypeCard
							archetypeName={item.name}
							oceanCode4={item.oceanCode4}
							oceanCode5={item.oceanCode5}
							description={item.description}
							color={item.color}
							isCurated
							overallConfidence={item.overallConfidence}
							className="h-full"
						/>
					</div>
				))}
			</div>
			<p className="mt-2 text-center text-[0.7rem] text-muted-foreground">
				Swipe or use arrows — samples only
			</p>
		</div>
	);
}
