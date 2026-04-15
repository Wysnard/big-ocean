import { createFileRoute, redirect } from "@tanstack/react-router";
import { ThreeSpaceLayout } from "@/components/ThreeSpaceLayout";
import { TodayCheckInSurface } from "@/components/today/TodayCheckInSurface";
import { fetchFirstVisitState } from "@/hooks/use-account";
import { getSession } from "@/lib/auth-client";

export const Route = createFileRoute("/today/")({
	ssr: false,
	beforeLoad: async () => {
		const { data: session } = await getSession();
		if (!session?.user) {
			throw redirect({ to: "/login", search: { sessionId: undefined, redirectTo: undefined } });
		}

		const { firstVisitCompleted } = await fetchFirstVisitState();
		if (!firstVisitCompleted) {
			throw redirect({ to: "/me" });
		}
	},
	component: TodayPage,
});

function TodayPage() {
	return (
		<ThreeSpaceLayout
			title="Today"
			data-slot="today-page"
			data-testid="today-page"
			className="min-h-[calc(100dvh-3.5rem)] bg-background pb-28 lg:pb-0"
		>
			<TodayCheckInSurface />
		</ThreeSpaceLayout>
	);
}
