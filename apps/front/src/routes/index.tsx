import { createFileRoute } from "@tanstack/react-router";
import { SplitHomepageLayout } from "../components/home/SplitHomepageLayout";
import { StickyAuthPanel } from "../components/home/StickyAuthPanel";
import { StickyBottomCTA } from "../components/home/StickyBottomCTA";
import { TimelinePlaceholder } from "../components/home/TimelinePlaceholder";
import { PageMain } from "../components/PageMain";
import { getServerSession } from "../lib/auth.server";

export const Route = createFileRoute("/")({
	beforeLoad: async () => {
		try {
			const session = await getServerSession();
			return { isAuthenticated: !!session?.user };
		} catch {
			return { isAuthenticated: false };
		}
	},
	loader: async ({ context }) => ({
		isAuthenticated: context.isAuthenticated,
	}),
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
	const { isAuthenticated } = Route.useLoaderData();

	return (
		<PageMain>
			<SplitHomepageLayout
				timeline={<TimelinePlaceholder />}
				authPanel={<StickyAuthPanel isAuthenticated={isAuthenticated} />}
				bottomCta={<StickyBottomCTA isAuthenticated={isAuthenticated} />}
			/>
		</PageMain>
	);
}
