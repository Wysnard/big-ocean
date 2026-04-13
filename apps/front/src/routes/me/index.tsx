import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { Settings } from "lucide-react";
import { useEffect } from "react";
import { BottomNav } from "@/components/BottomNav";
import { PageMain } from "@/components/PageMain";
import { completeFirstVisit } from "@/hooks/use-account";
import { getSession } from "@/lib/auth-client";

export const Route = createFileRoute("/me/")({
	ssr: false,
	beforeLoad: async () => {
		const { data: session } = await getSession();
		if (!session?.user) {
			throw redirect({ to: "/login", search: { sessionId: undefined, redirectTo: undefined } });
		}
	},
	component: MePage,
});

function MePage() {
	useEffect(() => {
		void completeFirstVisit().catch((error) => {
			console.warn("Failed to mark first visit complete", error);
		});
	}, []);

	return (
		<PageMain
			title="Me"
			data-slot="me-page"
			data-testid="me-page"
			className="min-h-[calc(100dvh-3.5rem)] bg-background pb-28 lg:pb-0"
		>
			<BottomNav />
			<div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
				<section className="mx-auto max-w-3xl rounded-[2rem] border border-border bg-card p-6 shadow-sm sm:p-8">
					<div className="flex items-start justify-between gap-4">
						<div>
							<p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
								Space Two
							</p>
							<h1 className="mt-3 font-heading text-3xl font-bold text-foreground">
								Me is your identity sanctuary.
							</h1>
						</div>
						<Link
							to="/settings"
							data-testid="me-settings-link"
							className="inline-flex min-h-11 items-center justify-center rounded-full border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent"
							aria-label="Open settings"
						>
							<Settings className="size-4" aria-hidden="true" />
						</Link>
					</div>
					<p className="mt-4 text-base leading-7 text-muted-foreground">
						This is where your portrait, your inner shape, and the identity-centered parts of the product
						will gather. For now, it introduces the space and anchors settings access.
					</p>
				</section>
			</div>
		</PageMain>
	);
}
