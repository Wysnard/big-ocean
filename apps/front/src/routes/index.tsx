import { createFileRoute } from "@tanstack/react-router";
import { ChatBubble } from "../components/home/ChatBubble";
import { ChatInputBar } from "../components/home/ChatInputBar";
import { ComparisonCard } from "../components/home/ComparisonCard";
import { ConversationFlow } from "../components/home/ConversationFlow";
import { DepthMeter } from "../components/home/DepthMeter";
import { DepthScrollProvider } from "../components/home/DepthScrollProvider";
import { FounderPortraitExcerpt } from "../components/home/FounderPortraitExcerpt";
import { HeroSection } from "../components/home/HeroSection";
import { MessageGroup } from "../components/home/MessageGroup";
import { TraitInteractive } from "../components/home/TraitStackEmbed";

export const Route = createFileRoute("/")({
	component: HomePage,
	head: () => ({
		meta: [
			{
				title: "big ocean \u2014 What if the most interesting person in the room is you?",
			},
			{
				name: "description",
				content: "A 25-minute conversation. A portrait of who you are. Free.",
			},
			{
				property: "og:title",
				content: "big ocean \u2014 What if the most interesting person in the room is you?",
			},
			{
				property: "og:description",
				content: "A 25-minute conversation. A portrait of who you are. Free.",
			},
		],
	}),
});

function HomePage() {
	return (
		<DepthScrollProvider>
			{/* Hero — full-viewport intro */}
			<HeroSection />

			{/* Conversation wrapper — scopes sticky ChatInputBar */}
			<div>
				{/* Conversation flow — the heart of the homepage */}
				<ConversationFlow>
					{/* Beat 1 — The conversation (light curiosity) */}
					<MessageGroup>
						<ChatBubble variant="user">what do you mean?</ChatBubble>
					</MessageGroup>

					<MessageGroup>
						<ChatBubble variant="nerin">
							<p>
								You&rsquo;d be surprised. Everyone who sits down with me thinks they&rsquo;re the boring
								one. That there&rsquo;s nothing to find. And every single time, they say something that
								pulls in two directions at once&nbsp;&mdash;&nbsp;and they don&rsquo;t even notice.
								Contradiction? I call it nuance and it&rsquo;s the most honest thing you can say.
							</p>
							<ComparisonCard />
						</ChatBubble>
					</MessageGroup>

					<MessageGroup>
						<ChatBubble variant="narrator">
							Nerin hears the nuance in your answer and reflects it back.
						</ChatBubble>
					</MessageGroup>

					{/* Beat 2 — The portrait drops (awe) */}
					<MessageGroup>
						<ChatBubble variant="narrator">
							After one conversation, this is what Nerin wrote about the person who built big-ocean.
						</ChatBubble>
					</MessageGroup>

					<MessageGroup>
						<FounderPortraitExcerpt />
					</MessageGroup>

					<MessageGroup>
						<ChatBubble variant="user">an AI wrote that?</ChatBubble>
					</MessageGroup>

					{/* Beat 3 — Vincent interrupts (distinct visual treatment) */}
					<MessageGroup>
						<ChatBubble variant="vincent">
							<p>
								I used to draw my sword everywhere&nbsp;&mdash;&nbsp;every problem, every situation. I was
								proud of it. Nerin showed me it was double-edged. That I was using it recklessly, even on
								myself. Since then I try to use it where it&rsquo;s meant for, and with care everywhere
								else. I even reach for other skills now&nbsp;&mdash;&nbsp;things I would have solved my way
								through before without thinking.
							</p>
							<p>That&rsquo;s why I built big-ocean. I needed this. And I know someone else will too.</p>
						</ChatBubble>
					</MessageGroup>

					{/* Beat 4 — The pivot */}
					<MessageGroup>
						<ChatBubble variant="nerin">
							That&rsquo;s his version. Yours won&rsquo;t look like his.
						</ChatBubble>
					</MessageGroup>

					<MessageGroup>
						<ChatBubble variant="user">what would mine say?</ChatBubble>
					</MessageGroup>

					{/* Beat 5 — Permission (relief) */}
					<MessageGroup>
						<ChatBubble variant="nerin">
							<p>I&rsquo;m not a judge. I&rsquo;m more like a mirror with better lighting.</p>
							<p>
								I don&rsquo;t label people. I tell you what I see&nbsp;&mdash;&nbsp;the pattern, the
								texture, the contradictions. What you do with it is yours.
							</p>
						</ChatBubble>
					</MessageGroup>

					<MessageGroup>
						<ChatBubble variant="narrator">
							Your portrait is private by default. No one sees it unless you choose to share. You own what
							comes out of this conversation.
						</ChatBubble>
					</MessageGroup>

					{/* Beat 6 — The science (credibility) */}
					<MessageGroup>
						<ChatBubble variant="narrator">
							Built on the Big Five (OCEAN)&nbsp;&mdash;&nbsp;the personality model used by psychologists
							and researchers. Five traits, thirty facets.
						</ChatBubble>
					</MessageGroup>

					{/* Beat 6b — Trait stack + facet panels (CSS-only via <details> open state) */}
					<TraitInteractive />

					{/* Beat 7 — The close (wanting → action) */}
					<MessageGroup>
						<ChatBubble variant="nerin">
							<p>
								About twenty-five minutes. No right answers. No wrong ones either. Just
								talking&nbsp;&mdash;&nbsp;about things you probably think about anyway.
							</p>
							<p>You just don&rsquo;t usually say them out loud.</p>
						</ChatBubble>
					</MessageGroup>

					{/* Beat 8 — Relationship celebration (Story 8.4) */}
				</ConversationFlow>

				{/* Sticky chat input bar — CSS-only visibility via sticky positioning */}
				<ChatInputBar />
			</div>

			{/* Fixed UI elements */}
			<DepthMeter />
		</DepthScrollProvider>
	);
}
