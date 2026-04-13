import type { LibraryTier } from "@/lib/library-content";
import { KnowledgeArticleLayout } from "./KnowledgeArticleLayout";

interface LibraryPlaceholderPageProps {
	title: string;
	description: string;
	tier: LibraryTier;
}

export function LibraryPlaceholderPage({ title, description, tier }: LibraryPlaceholderPageProps) {
	return (
		<KnowledgeArticleLayout
			title={title}
			description={description}
			tier={tier}
			breadcrumbs={[
				{ label: "Home", to: "/" },
				{ label: "Library", to: "/library" },
				{ label: title },
			]}
		>
			<div className="space-y-4">
				<p>
					This section is scaffolded so the route is live, indexable, and ready for the next batch of
					content.
				</p>
				<p>
					The current release focuses on archetype definitions and Big Five trait explainers. Facets,
					science notes, and applied guides are queued next.
				</p>
			</div>
		</KnowledgeArticleLayout>
	);
}
