import {
	FACET_DESCRIPTIONS,
	FACET_LEVEL_LABELS,
	type FacetLevelCode,
	TRAIT_TO_FACETS,
	type TraitName,
} from "@workspace/domain";
import { MapPinned } from "lucide-react";
import { humanizeUnderscored } from "@/lib/humanize-slug";
import { LIBRARY_SCROLL_MT_CLASS } from "@/lib/library-layout";

export function TraitFacetMapSection({ trait }: { trait: TraitName }) {
	const facets = TRAIT_TO_FACETS[trait].map((facetName) => ({
		name: humanizeUnderscored(facetName),
		slug: facetName,
		levels: Object.entries(FACET_DESCRIPTIONS[facetName].levels).map(([code, description]) => ({
			code,
			label: FACET_LEVEL_LABELS[code as FacetLevelCode] ?? code,
			description,
		})),
	}));

	return (
		<section
			id="facet-map"
			className={`mb-10 ${LIBRARY_SCROLL_MT_CLASS} rounded-[2rem] border border-border/70 bg-background p-6 shadow-sm sm:p-8`}
		>
			<div className="flex items-center gap-2 text-sm font-medium text-primary">
				<MapPinned className="size-4 shrink-0" aria-hidden />
				Facet map
			</div>
			<h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
				Six facets at a glance
			</h2>
			<p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
				Sub-dimensions of this trait, scannable before the deeper article.
			</p>
			<div className="mt-6 grid gap-4 md:grid-cols-2">
				{facets.map((facet) => (
					<div key={facet.slug} className="rounded-[1.5rem] border border-border/70 bg-muted/20 p-5">
						<h3 className="text-base font-semibold text-foreground">{facet.name}</h3>
						<div className="mt-4 space-y-3">
							{facet.levels.map((level) => (
								<div
									key={level.code}
									className="rounded-xl border border-border/70 bg-background px-4 py-3"
								>
									<p className="text-sm font-medium text-foreground">
										{level.label}
										<span className="ml-2 font-mono text-xs text-primary/80">{level.code}</span>
									</p>
									<p className="mt-2 text-sm leading-6 text-muted-foreground">{level.description}</p>
								</div>
							))}
						</div>
					</div>
				))}
			</div>
		</section>
	);
}
