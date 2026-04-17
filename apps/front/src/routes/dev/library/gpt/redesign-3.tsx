import { createFileRoute, redirect } from "@tanstack/react-router";
import { LibraryArticleGptRedesignPage } from "@/components/library/LibraryArticleGptRedesignPage";

export const Route = createFileRoute("/dev/library/gpt/redesign-3")({
	beforeLoad: () => {
		if (import.meta.env.PROD) {
			throw redirect({ to: "/" });
		}
	},
	component: RedesignThreePage,
});

function RedesignThreePage() {
	return <LibraryArticleGptRedesignPage iteration={3} />;
}
