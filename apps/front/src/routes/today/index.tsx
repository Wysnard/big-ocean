import { createFileRoute, redirect } from "@tanstack/react-router";
import { BottomNav } from "@/components/BottomNav";
import { PageMain } from "@/components/PageMain";
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
		<PageMain
			title="Today"
			data-slot="today-page"
			data-testid="today-page"
			className="min-h-[calc(100dvh-3.5rem)] bg-background pb-28 lg:pb-0"
		>
			<BottomNav />
			<div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
				<section className="mx-auto max-w-3xl rounded-[2rem] border border-border bg-card p-6 shadow-sm sm:p-8">
					<p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
						Space One
					</p>
					<h1 className="mt-3 font-heading text-3xl font-bold text-foreground">
						Today is your quiet rhythm.
					</h1>
					<p className="mt-4 text-base leading-7 text-muted-foreground">
						This space will hold your daily check-ins, weekly letters, and the small reflective rituals
						that keep the product alive between larger moments.
					</p>
				</section>
			</div>
		</PageMain>
	);
}
