import { createFileRoute } from "@tanstack/react-router";
import { ChatInputBar } from "../components/home/ChatInputBar";
import { DepthMeter } from "../components/home/DepthMeter";
import { DepthScrollProvider } from "../components/home/DepthScrollProvider";
import { FinalCta } from "../components/home/FinalCta";
import { HeroSection } from "../components/home/HeroSection";
import { HowItWorks } from "../components/home/HowItWorks";
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
		<PageMain>
			<DepthScrollProvider>
				{/* Hero — full-viewport intro */}
				<HeroSection />

				{/* Conversation section removed — Epic 9 will implement split-layout redesign */}

				{/* How It Works — scannable 3-step overview */}
				<HowItWorks />

				{/* Final conversion CTA */}
				<FinalCta />

				{/* Fixed UI elements */}
				<DepthMeter />
				<ChatInputBar />
			</DepthScrollProvider>
		</PageMain>
	);
}
