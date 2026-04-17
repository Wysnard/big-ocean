import { createFileRoute, redirect } from "@tanstack/react-router";
import { LibraryArticleRedesignIteration1 } from "@/components/dev/library-article-redesign-demos";

export const Route = createFileRoute("/dev/library/composer/redesign-1")({
	beforeLoad: () => {
		if (import.meta.env.PROD) {
			throw redirect({ to: "/" });
		}
	},
	component: LibraryArticleRedesignIteration1,
});
