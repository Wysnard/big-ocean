import { createFileRoute } from "@tanstack/react-router";
import { DepthScrollProvider } from "../components/home/DepthScrollProvider";
import { HomepageHero } from "../components/home/HomepageHero";
import { HomepageTimeline } from "../components/home/HomepageTimeline";
import { StickyAuthPanel } from "../components/home/StickyAuthPanel";
import { StickyBottomCTA } from "../components/home/StickyBottomCTA";
import { PageMain } from "../components/PageMain";

export const Route = createFileRoute("/")({
	component: HomePage,
	head: () => ({
		meta: [
			{
				title: "big ocean \u2014 Understand yourself and your relationships, in one conversation",
			},
			{
				name: "description",
				content:
					"Spend ~30 minutes with Nerin, your conversational guide, and leave with a written portrait of who you are—grounded in personality science. Free, no credit card.",
			},
			{
				property: "og:title",
				content: "A portrait of who you are—through conversation, not a quiz.",
			},
			{
				property: "og:description",
				content:
					"Big Ocean is a guided conversation that gives you a written portrait of yourself—and a place to come back to as you change.",
			},
		],
	}),
});

function HomePage() {
	return (
		<PageMain className="bg-background">
			<DepthScrollProvider>
				<div className="lg:grid lg:grid-cols-[minmax(0,1.55fr)_minmax(22rem,0.95fr)]">
					<div className="min-w-0 pb-24 lg:pb-0">
						<HomepageHero />
						<HomepageTimeline />
					</div>
					<StickyAuthPanel />
				</div>
			</DepthScrollProvider>
			<StickyBottomCTA isAuthenticated={false} marketingOnly />
		</PageMain>
	);
}
