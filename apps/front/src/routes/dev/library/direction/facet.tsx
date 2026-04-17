import { createFileRoute, redirect } from "@tanstack/react-router";
import { LibraryArticleDirectionMockupFacetPage } from "@/components/dev/library-article-direction-mockup-pages";

export const Route = createFileRoute("/dev/library/direction/facet")({
	beforeLoad: () => {
		if (import.meta.env.PROD) {
			throw redirect({ to: "/" });
		}
	},
	component: LibraryArticleDirectionMockupFacetPage,
});
