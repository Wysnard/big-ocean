import { createFileRoute, redirect } from "@tanstack/react-router";
import { LibraryArticleGptRedesignPage } from "@/components/library/LibraryArticleGptRedesignPage";

export const Route = createFileRoute("/dev/library/gpt/redesign-1")({
	beforeLoad: () => {
		if (import.meta.env.PROD) {
			throw redirect({ to: "/" });
		}
	},
	component: RedesignOnePage,
});

function RedesignOnePage() {
	return <LibraryArticleGptRedesignPage iteration={1} />;
}
