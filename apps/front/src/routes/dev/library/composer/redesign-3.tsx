import { createFileRoute, redirect } from "@tanstack/react-router";
import { LibraryArticleRedesignIteration3 } from "@/components/dev/library-article-redesign-demos";

export const Route = createFileRoute("/dev/library/composer/redesign-3")({
	beforeLoad: () => {
		if (import.meta.env.PROD) {
			throw redirect({ to: "/" });
		}
	},
	component: LibraryArticleRedesignIteration3,
});
