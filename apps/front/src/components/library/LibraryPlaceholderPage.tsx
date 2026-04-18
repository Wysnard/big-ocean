import type { LibraryTier } from "@/lib/library-content";
import { AssessmentCTA } from "./AssessmentCTA";
import { KnowledgeArticleLayout } from "./KnowledgeArticleLayout";
import { libraryArticleProseClass } from "./library-article-prose";

interface LibraryPlaceholderPageProps {
	title: string;
	description: string;
	tier: LibraryTier;
}

export function LibraryPlaceholderPage({ title, description, tier }: LibraryPlaceholderPageProps) {
	return (
		<KnowledgeArticleLayout
			tier={tier}
			articlePath="/library"
			title={title}
			description={description}
			readTimeMinutes={3}
			showReadingRail={false}
			readingChapters={[]}
			heroEyebrow={
				<span className="text-xs font-semibold uppercase tracking-[0.2em]">Knowledge Library</span>
			}
			heroPrimaryLine={<span>Coming soon</span>}
			mainColumn={
				<article className="rounded-[2rem] border border-border/70 bg-background p-6 shadow-sm sm:p-8">
					<div className={libraryArticleProseClass()}>
						<p>
							This section is scaffolded so the route is live, indexable, and ready for the next batch of
							content.
						</p>
						<p>
							The current release focuses on archetype definitions and Big Five trait explainers. Facets,
							science notes, and applied guides are queued next.
						</p>
					</div>
				</article>
			}
			sideColumn={<AssessmentCTA tier={tier} />}
		/>
	);
}
