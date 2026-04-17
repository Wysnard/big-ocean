import { createFileRoute, redirect } from "@tanstack/react-router";
import { LibraryArticleGptRedesignPage } from "@/components/library/LibraryArticleGptRedesignPage";

export const Route = createFileRoute("/dev/library/gpt/redesign-2")({
	beforeLoad: () => {
		if (import.meta.env.PROD) {
			throw redirect({ to: "/" });
		}
	},
	component: RedesignTwoPage,
});

function RedesignTwoPage() {
	return <LibraryArticleGptRedesignPage iteration={2} />;
}
