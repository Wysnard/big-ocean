import { Link } from "@tanstack/react-router";
import { type FacetName, TRAIT_TO_FACETS, type TraitName } from "@workspace/domain";
import { cn } from "@workspace/ui/lib/utils";
import { Layers3 } from "lucide-react";
import { humanizeUnderscored } from "@/lib/humanize-slug";
import { getLibraryEntryData } from "@/lib/library-content";
import { LIBRARY_SCROLL_MT_CLASS } from "@/lib/library-layout";

export function FacetSiblingMapSection({
	parentTrait,
	currentFacet,
}: {
	parentTrait: TraitName;
	currentFacet: FacetName;
}) {
	const siblingFacets = TRAIT_TO_FACETS[parentTrait].map((slug) => ({
		slug,
		data: getLibraryEntryData("facet", slug),
		isHere: slug === currentFacet,
	}));

	return (
		<section
			id="sibling-facet-map"
			className={`mb-10 ${LIBRARY_SCROLL_MT_CLASS} rounded-[2rem] border border-border/70 bg-background p-6 shadow-sm sm:p-8`}
		>
			<div className="flex items-center gap-2 text-sm font-medium text-primary">
				<Layers3 className="size-4 shrink-0" aria-hidden />
				Facet map · {humanizeUnderscored(parentTrait)}
			</div>
			<h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
				Same trait, other facets
			</h2>
			<p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
				Grid navigation across the six facets — the article you are reading is highlighted.
			</p>
			<div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
				{siblingFacets.map(({ slug, data, isHere }) => {
					return (
						<Link
							key={slug}
							to="/library/facet/$slug"
							params={{ slug }}
							className={cn(
								"rounded-[1.75rem] border border-border/70 bg-muted/20 p-5 text-left shadow-sm transition-colors hover:border-primary/35 hover:bg-muted/30",
								isHere && "border-primary/40 bg-primary/[0.06] ring-2 ring-primary/35",
							)}
						>
							<p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Facet</p>
							<h3 className="mt-2 text-lg font-semibold tracking-tight text-foreground">
								{data?.title ?? humanizeUnderscored(slug)}
							</h3>
							{isHere ? (
								<p className="mt-2 text-xs font-medium text-primary">You are here</p>
							) : (
								<p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">
									{data?.description ?? ""}
								</p>
							)}
						</Link>
					);
				})}
			</div>
		</section>
	);
}
