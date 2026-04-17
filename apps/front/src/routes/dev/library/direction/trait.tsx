import { createFileRoute, redirect } from "@tanstack/react-router";
import { LibraryArticleDirectionMockupTraitPage } from "@/components/dev/library-article-direction-mockup-pages";

export const Route = createFileRoute("/dev/library/direction/trait")({
	beforeLoad: () => {
		if (import.meta.env.PROD) {
			throw redirect({ to: "/" });
		}
	},
	component: LibraryArticleDirectionMockupTraitPage,
});
