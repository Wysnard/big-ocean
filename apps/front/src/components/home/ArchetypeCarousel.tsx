import type { OceanCode5 } from "@workspace/domain";
import { ArchetypeSummaryTile } from "@workspace/ui/components/archetype-summary-tile";
import { ArtifactSurfaceCard } from "@workspace/ui/components/artifact-surface-card";
import { useReducedMotion } from "motion/react";
import { useCallback, useRef } from "react";

/** Epics Story 9.3: carousel lives in World After (marketing previews; static data). */
const HOMEPAGE_ARCHETYPE_SAMPLES: ReadonlyArray<{
	readonly name: string;
	readonly oceanCode5: OceanCode5;
	readonly description: string;
}> = [
	{
		name: "The Deep Current",
		oceanCode5: "OCEAR" as OceanCode5,
		description: "Steady presence with room for complexity.",
	},
	{
		name: "The Open Harbor",
		oceanCode5: "OCBAV" as OceanCode5,
		description: "Warm boundaries without performance.",
	},
	{
		name: "The Quiet Architect",
		oceanCode5: "TFIDR" as OceanCode5,
		description: "Structure as care, not control.",
	},
	{
		name: "The Steady Flame",
		oceanCode5: "MCBAN" as OceanCode5,
		description: "Intensity with a long fuse.",
	},
	{
		name: "The Soft Signal",
		oceanCode5: "TFSEN" as OceanCode5,
		description: "Precision without sharp edges.",
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
				<p className="text-xs font-semibold tracking-[0.22em] text-slate-600 uppercase dark:text-slate-400">
					Archetypes
				</p>
				<div className="flex gap-2">
					<button
						type="button"
						className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
						aria-label="Previous archetypes"
						onClick={() => scrollByCard(-1)}
					>
						←
					</button>
					<button
						type="button"
						className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
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
					<ArtifactSurfaceCard
						as="article"
						key={item.oceanCode5}
						data-carousel-card
						data-testid="homepage-archetype-card"
						className="w-[min(280px,82vw)] shrink-0 snap-center rounded-[1.5rem] border-slate-200/90 bg-white/95 p-5 shadow-md dark:border-slate-600 dark:bg-slate-900/95"
					>
						<ArchetypeSummaryTile
							name={item.name}
							oceanCode5={item.oceanCode5}
							description={item.description}
						/>
					</ArtifactSurfaceCard>
				))}
			</div>
			<p className="mt-2 text-center text-[0.7rem] text-slate-400 dark:text-slate-500">
				Swipe or use arrows — samples only
			</p>
		</div>
	);
}
