import { createFileRoute, redirect } from "@tanstack/react-router";
import { ThreeSpaceLayout } from "@/components/ThreeSpaceLayout";
import { getSession } from "@/lib/auth-client";

export const Route = createFileRoute("/circle/")({
	ssr: false,
	beforeLoad: async () => {
		const { data: session } = await getSession();
		if (!session?.user) {
			throw redirect({ to: "/login", search: { sessionId: undefined, redirectTo: undefined } });
		}
	},
	component: CirclePage,
});

function CirclePage() {
	return (
		<ThreeSpaceLayout
			title="Circle"
			data-slot="circle-page"
			data-testid="circle-page"
			className="min-h-[calc(100dvh-3.5rem)] bg-background pb-28 lg:pb-0"
		>
			<section className="w-full rounded-[2rem] border border-border bg-card p-6 shadow-sm sm:p-8">
				<p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
					Space Three
				</p>
				<h1 className="mt-3 font-heading text-3xl font-bold text-foreground">
					Circle is where relationship stories will live.
				</h1>
				<p className="mt-4 text-base leading-7 text-muted-foreground">
					This space is reserved for shared readings, invitations, and the relational view of your world.
					The shell is in place so future stories can grow into it without changing the navigation model.
				</p>
			</section>
		</ThreeSpaceLayout>
	);
}
