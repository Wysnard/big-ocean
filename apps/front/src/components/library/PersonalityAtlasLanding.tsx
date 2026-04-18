import { Link } from "@tanstack/react-router";
import { Button } from "@workspace/ui/components/button";
import { ArrowRight, Compass, MapPinned, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { LibraryRecommendedPathBand } from "@/components/library/LibraryRecommendedPathBand";
import type { LibraryEntryData, LibraryTier } from "@/lib/library-content";

export type LibraryContentGroup = {
	tier: LibraryTier;
	label: string;
	description: string;
	entries: LibraryEntryData[];
};

type PersonalityAtlasLandingProps = {
	groups: LibraryContentGroup[];
};

const PREVIEW_LIMIT = 5;

function AtlasColumn({ group, icon }: { group: LibraryContentGroup; icon: ReactNode }) {
	const entries = group.entries.slice(0, PREVIEW_LIMIT);
	const truncated = group.entries.length > entries.length;

	return (
		<section className="flex min-h-full flex-col rounded-[2rem] border border-border/70 bg-background p-5 shadow-sm">
			<div className="flex items-start justify-between gap-4">
				<div>
					<div className="flex items-center gap-2 text-sm font-medium text-primary">
						{icon}
						<span>{group.label}</span>
					</div>
					<h2 className="mt-3 font-heading text-xl font-semibold text-foreground">
						{group.description}
					</h2>
				</div>
				<span className="font-data text-sm text-muted-foreground">{group.entries.length}</span>
			</div>

			<div className="mt-6 flex flex-1 flex-col gap-3">
				{entries.map((entry) => (
					<Link
						key={entry.pathname}
						to={entry.pathname}
						className="group flex items-center justify-between gap-4 rounded-2xl border border-border/60 bg-muted/20 px-4 py-3 transition-colors hover:border-foreground/25"
					>
						<span className="min-w-0 text-sm font-medium text-foreground">{entry.title}</span>
						<ArrowRight className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
					</Link>
				))}
			</div>
			{truncated ? (
				<Link
					to="/library"
					hash={`all-${group.tier}`}
					className="mt-4 inline-flex min-h-10 items-center gap-2 text-sm font-medium text-primary underline-offset-4 hover:underline"
				>
					View all {group.entries.length} {group.label.toLowerCase()}
					<ArrowRight className="size-4" aria-hidden />
				</Link>
			) : null}
		</section>
	);
}

function CompleteIndexShelf({ group }: { group: LibraryContentGroup }) {
	return (
		<section
			id={`all-${group.tier}`}
			className="rounded-2xl border border-border/70 bg-background p-5"
		>
			<div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<h3 className="font-heading text-lg font-semibold text-foreground">{group.label}</h3>
					<p className="mt-1 text-sm leading-6 text-muted-foreground">{group.description}</p>
				</div>
				<span className="shrink-0 font-data text-sm text-muted-foreground">
					{group.entries.length} articles
				</span>
			</div>
			<div
				className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-3"
				{...(group.tier === "facet"
					? {
							"data-testid": "library-complete-index-facets",
							"data-facet-count": group.entries.length,
						}
					: {})}
			>
				{group.entries.length > 0 ? (
					group.entries.map((entry) => (
						<Link
							key={entry.pathname}
							to={entry.pathname}
							data-testid={`library-index-link-${entry.slug}`}
							className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3 text-sm leading-6 text-muted-foreground transition-colors hover:border-foreground/25 hover:text-foreground"
						>
							{entry.title}
						</Link>
					))
				) : (
					<p className="rounded-xl border border-dashed border-border bg-muted/15 px-4 py-3 text-sm leading-6 text-muted-foreground">
						More articles are planned.
					</p>
				)}
			</div>
		</section>
	);
}

export function PersonalityAtlasLanding({ groups }: PersonalityAtlasLandingProps) {
	const entryByTier = groups.reduce(
		(acc, group) => {
			acc[group.tier] = group.entries;
			return acc;
		},
		{} as Record<LibraryTier, LibraryEntryData[]>,
	);

	const atlasGroups = [
		groups.find((group) => group.tier === "archetype"),
		groups.find((group) => group.tier === "trait"),
		groups.find((group) => group.tier === "facet"),
	].filter((group): group is LibraryContentGroup => Boolean(group));

	return (
		<div className="mx-auto flex max-w-7xl flex-col gap-8">
			<section className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-stretch">
				<div className="rounded-[2rem] border border-border/70 bg-background p-6 shadow-sm sm:p-8">
					<div className="flex items-center gap-3">
						<img src="/ocean-icon.svg" alt="big-ocean mark" className="size-10" />
						<p className="text-sm font-medium text-primary">Knowledge Library</p>
					</div>
					<h1 className="mt-8 font-heading text-4xl font-semibold text-foreground sm:text-5xl">
						Choose the level of zoom that matches your question.
					</h1>
					<p className="mt-5 text-base leading-7 text-muted-foreground sm:text-lg">
						Archetypes name the whole pattern. Traits explain the broad forces. Facets show the specific
						places where a trait becomes visible.
					</p>
					<div className="mt-8 flex flex-wrap gap-3">
						<Button asChild>
							<Link to="/library" hash="complete-index">
								Browse library
								<ArrowRight data-icon="inline-end" />
							</Link>
						</Button>
						<Button variant="secondary" asChild>
							<Link to="/library" hash="atlas">
								Open the atlas
							</Link>
						</Button>
					</div>
				</div>

				<div className="rounded-[2rem] border border-border/70 bg-linear-to-br from-primary/[0.08] via-background to-primary/[0.03] p-6 shadow-sm sm:p-8">
					<div className="grid gap-4 sm:grid-cols-3">
						{[
							{ label: "Pattern", value: entryByTier.archetype.length, icon: Sparkles },
							{ label: "Trait", value: entryByTier.trait.length, icon: Compass },
							{ label: "Facet", value: entryByTier.facet.length, icon: MapPinned },
						].map((metric) => {
							const Icon = metric.icon;
							return (
								<div
									key={metric.label}
									className="rounded-2xl border border-border/70 bg-background/80 p-5"
								>
									<Icon className="size-5 text-primary" aria-hidden />
									<p className="mt-8 font-heading text-4xl font-semibold text-foreground">{metric.value}</p>
									<p className="mt-1 text-sm text-muted-foreground">{metric.label} articles</p>
								</div>
							);
						})}
					</div>
					<p className="mt-6 rounded-2xl border border-border/70 bg-background/80 p-5 text-sm leading-6 text-muted-foreground">
						Use the atlas when the reader is exploring. Use the recommended path when their assessment has
						already given the library a personal starting point.
					</p>
				</div>
			</section>

			<LibraryRecommendedPathBand />

			<section id="atlas" className="grid gap-4 lg:grid-cols-3">
				{atlasGroups.map((group) => (
					<AtlasColumn
						key={group.tier}
						group={group}
						icon={
							group.tier === "archetype" ? (
								<Sparkles className="size-4" aria-hidden />
							) : group.tier === "trait" ? (
								<Compass className="size-4" aria-hidden />
							) : (
								<MapPinned className="size-4" aria-hidden />
							)
						}
					/>
				))}
			</section>

			<section
				id="complete-index"
				className="rounded-[2rem] border border-border/70 bg-muted/20 p-6 sm:p-8"
			>
				<div className="grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)] lg:items-start">
					<div>
						<p className="text-sm font-medium text-primary">Complete index</p>
						<h2 className="mt-2 font-heading text-2xl font-semibold text-foreground">
							Every shelf remains close.
						</h2>
						<p className="mt-3 text-sm leading-6 text-muted-foreground">
							The atlas previews each level. This index exposes every article, including all facet pages.
						</p>
					</div>
					<div className="flex flex-col gap-4">
						{groups.map((group) => (
							<CompleteIndexShelf key={group.tier} group={group} />
						))}
					</div>
				</div>
			</section>
		</div>
	);
}
