import { createFileRoute, redirect } from "@tanstack/react-router";
import { CirclePageContent } from "@/components/circle/CirclePageContent";
import { ThreeSpaceLayout } from "@/components/ThreeSpaceLayout";
import { getSession } from "@/lib/auth-client";

export const Route = createFileRoute("/circle/")({
	ssr: false,
	beforeLoad: async () => {
		const { data: session } = await getSession();
		if (!session?.user) {
			throw redirect({ to: "/login", search: { redirectTo: undefined } });
		}
	},
	component: CirclePage,
});

function CirclePage() {
	return (
		<ThreeSpaceLayout
			data-slot="circle-page"
			data-testid="circle-page"
			className="min-h-[calc(100dvh-3.5rem)] bg-background pb-28 lg:pb-0"
		>
			<CirclePageContent />
		</ThreeSpaceLayout>
	);
}
