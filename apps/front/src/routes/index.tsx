import { createFileRoute } from "@tanstack/react-router";
import { DepthScrollProvider } from "../components/home/DepthScrollProvider";
import { HomepageTimeline } from "../components/home/HomepageTimeline";
import { MobileHero } from "../components/home/MobileHero";
import { StickyAuthPanel } from "../components/home/StickyAuthPanel";
import { StickyBottomCTA } from "../components/home/StickyBottomCTA";
import { PageMain } from "../components/PageMain";

export const Route = createFileRoute("/")({
	component: HomePage,
	head: () => ({
		meta: [
			{
				title: "big ocean \u2014 Personality portrait through conversation",
			},
			{
				name: "description",
				content:
					"A conversation with Nerin over ~30 minutes reveals your personality portrait, OCEAN code, and archetype. Compare with friends. Built on Big Five science.",
			},
			{
				property: "og:title",
				content: "big ocean \u2014 Not a personality quiz. A conversation.",
			},
			{
				property: "og:description",
				content:
					"Talk to Nerin for ~30 minutes. Get a portrait of who you are that no test has ever given you.",
			},
		],
	}),
});

function HomePage() {
	return (
		<PageMain title="Home" className="bg-background">
			<DepthScrollProvider>
				<div className="lg:grid lg:grid-cols-[minmax(0,1.55fr)_minmax(22rem,0.95fr)]">
					<div className="min-w-0 pb-24 lg:pb-0">
						<MobileHero />
						<HomepageTimeline />
					</div>
					<StickyAuthPanel />
				</div>
			</DepthScrollProvider>
			<StickyBottomCTA isAuthenticated={false} marketingOnly />
		</PageMain>
	);
}
