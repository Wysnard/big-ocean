import type { ReactNode } from "react";
import { PageMain } from "@/components/PageMain";
import type { LibraryTier } from "@/lib/library-content";
import { LIBRARY_STICKY_TOP_XL_CLASS } from "@/lib/library-layout";
import { LibraryNav } from "./LibraryNav";
import { type LibraryReadingChapter, LibraryReadingRail } from "./LibraryReadingRail";
import { ReadingTimeHero } from "./ReadingTimeHero";

export type { LibraryReadingChapter };

export interface KnowledgeArticleLayoutProps {
	tier: LibraryTier;
	articlePath: string;
	title: string;
	description: string;
	readTimeMinutes: number;
	/** When false, skips the reading rail and uses a simpler two-column shell (placeholder tiers). */
	showReadingRail?: boolean;
	readingChapters: readonly LibraryReadingChapter[];
	heroEyebrow: ReactNode;
	heroPrimaryLine: ReactNode;
	pullQuote?: { body: string; footer: string };
	mainColumn: ReactNode;
	sideColumn: ReactNode;
}

export function KnowledgeArticleLayout({
	tier,
	articlePath: _articlePath,
	title,
	description,
	readTimeMinutes,
	showReadingRail = true,
	readingChapters,
	heroEyebrow,
	heroPrimaryLine,
	pullQuote,
	mainColumn,
	sideColumn,
}: KnowledgeArticleLayoutProps) {
	const hasReadingRail = showReadingRail && readingChapters.length > 0;
	const hasSideColumn = Boolean(sideColumn);
	const titleClass =
		tier === "facet"
			? "mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
			: "mt-2 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl";

	const gridClass = (() => {
		if (!hasReadingRail) {
			return "mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] xl:items-start";
		}
		return tier === "archetype"
			? "mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[14rem_minmax(0,1fr)] xl:grid-cols-[14rem_minmax(0,1fr)_18rem] xl:items-start"
			: "mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[14rem_minmax(0,1fr)] xl:grid-cols-[14rem_minmax(0,1fr)_20rem] xl:items-start";
	})();

	const sideCellClass = hasReadingRail
		? `space-y-6 lg:col-span-2 lg:col-start-1 xl:col-span-1 xl:col-start-3 xl:row-start-1 xl:sticky ${LIBRARY_STICKY_TOP_XL_CLASS} xl:self-start`
		: `space-y-6 lg:col-start-2 xl:row-start-1 xl:sticky ${LIBRARY_STICKY_TOP_XL_CLASS} xl:self-start`;

	return (
		<>
			<LibraryNav activeTier={tier} articleTitle={title} />
			<PageMain className="bg-background px-4 py-10 sm:px-6 lg:px-8">
				<div className="mx-auto max-w-7xl">
					<div className="overflow-hidden rounded-[2rem] border border-border/70 bg-linear-to-br from-primary/[0.08] via-background to-primary/[0.03] shadow-sm">
						<div
							className={
								pullQuote
									? "p-6 sm:p-10 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:items-end lg:gap-10"
									: "p-6 sm:p-8"
							}
						>
							<header className="max-w-3xl xl:max-w-5xl">
								<div className="flex flex-wrap items-center gap-2 text-sm font-medium text-primary">
									{heroEyebrow}
								</div>
								<div className="mt-3 text-sm font-medium text-primary sm:text-base">{heroPrimaryLine}</div>
								<h1 className={titleClass}>{title}</h1>
								<p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
									{description}
								</p>
								<ReadingTimeHero minutes={readTimeMinutes} />
							</header>
							{pullQuote ? (
								<blockquote className="mt-6 border-l-2 border-primary/45 pl-5 text-foreground sm:pl-6 lg:mt-0 lg:pl-8">
									<p className="font-heading text-sm italic leading-relaxed sm:text-base lg:text-lg xl:text-xl">
										{pullQuote.body}
									</p>
									<footer className="mt-3 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground sm:mt-4">
										{pullQuote.footer}
									</footer>
								</blockquote>
							) : null}
						</div>
					</div>

					<section className={gridClass}>
						{hasReadingRail ? <LibraryReadingRail chapters={readingChapters} /> : null}

						<div className="min-w-0 space-y-6">{mainColumn}</div>

						{hasSideColumn ? <div className={sideCellClass}>{sideColumn}</div> : null}
					</section>
				</div>
			</PageMain>
		</>
	);
}
