import { createFileRoute, redirect } from "@tanstack/react-router";
import { LibraryArticleDirectionMockupArchetypePage } from "@/components/dev/library-article-direction-mockup-pages";

export const Route = createFileRoute("/dev/library/direction/archetype")({
	beforeLoad: () => {
		if (import.meta.env.PROD) {
			throw redirect({ to: "/" });
		}
	},
	component: LibraryArticleDirectionMockupArchetypePage,
});
