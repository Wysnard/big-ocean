import { createFileRoute } from "@tanstack/react-router";
import { ChatBubble } from "../components/home/ChatBubble";
import { ChatInputBar } from "../components/home/ChatInputBar";
import { ComparisonCard } from "../components/home/ComparisonCard";
import { ComparisonTeaserPreview } from "../components/home/ComparisonTeaserPreview";
import { ConversationFlow } from "../components/home/ConversationFlow";
import { DepthMeter } from "../components/home/DepthMeter";
import { DepthScrollProvider } from "../components/home/DepthScrollProvider";
import { HeroSection } from "../components/home/HeroSection";
import { MessageGroup } from "../components/home/MessageGroup";
import { ShareCardPreview } from "../components/home/ShareCardPreview";
import {
	TraitFacetPair,
	TraitStackEmbed,
	useTraitSelection,
} from "../components/home/TraitStackEmbed";

export const Route = createFileRoute("/")({
	component: HomePage,
});

function HomePage() {
	const { activeTrait, isAnimating, handleTraitSelect } = useTraitSelection();

	return (
		<DepthScrollProvider>
			{/* Hero — full-viewport intro */}
			<HeroSection />

			{/* Conversation flow — the heart of the homepage */}
			<ConversationFlow>
				{/* 1. Nerin — Hook: genuine observation about human contradictions */}
				<MessageGroup>
					<ChatBubble variant="nerin">
						<h3>The Contradiction Is the Clue</h3>
						<p>
							Ever notice how you can be the most patient person in one room and completely lose it in
							another?
						</p>
						<p>Or how you'll overthink a restaurant choice but make a career move on gut instinct?</p>
						<p>
							That's not random. That's <strong>personality</strong>&nbsp;&mdash; and it's way more layered
							than any quiz can capture.
						</p>
					</ChatBubble>
				</MessageGroup>

				{/* 2. User — Skepticism */}
				<MessageGroup>
					<ChatBubble variant="user">So like Myers-Briggs but... not surface level?</ChatBubble>
				</MessageGroup>

				{/* 2b. Nerin — Comparison card (inside bubble) */}
				<MessageGroup>
					<ChatBubble variant="nerin">
						<p>Here&nbsp;&mdash; same question, two approaches.</p>
						<ComparisonCard />
					</ChatBubble>
				</MessageGroup>

				{/* 3. Nerin — Differentiation + science credit */}
				<MessageGroup>
					<ChatBubble variant="nerin">
						<h3>Not a Label. A Map.</h3>
						<h4>Built on the Big Five&nbsp;&mdash; the framework actual researchers use</h4>
						<p>
							Myers-Briggs gives you four letters and a label. I go after the{" "}
							<strong>contradictions</strong>&nbsp;&mdash; the stuff a label can't hold.
						</p>
						<p>
							You might score high on agreeableness overall, but fiercely competitive about specific
							things. Most tests call that noise.
						</p>
						<p>
							I call it a <strong>facet</strong>. You have <strong>thirty</strong> of them.
						</p>
					</ChatBubble>
				</MessageGroup>

				{/* 4. User — Curiosity + weight of it */}
				<MessageGroup>
					<ChatBubble variant="user">Thirty. That's... a lot.</ChatBubble>
				</MessageGroup>

				{/* 4b. Nerin — Brief response (rhythm break) */}
				<MessageGroup>
					<ChatBubble variant="nerin">Want to see them?</ChatBubble>
				</MessageGroup>

				{/* 5. Nerin — Trait Stack + aside + rhetorical question */}
				<MessageGroup>
					<ChatBubble variant="nerin">
						<h3>Five Traits. Six Facets Each.</h3>
						<h4>Tap a trait to explore what's underneath</h4>
						<p>
							"Openness" isn't just <em>creative or not creative</em>. It's
							<strong> Adventurousness</strong>, <strong>Artistic Interests</strong>,
							<strong> Emotionality</strong>, <strong>Imagination</strong>,<strong> Intellect</strong>,{" "}
							<strong>Liberalism</strong>. Six flavors of one trait. And every trait works this way.
						</p>
						<TraitStackEmbed activeTrait={activeTrait} onTraitSelect={handleTraitSelect} />
						<p>
							Which one surprised you? Most people think they know themselves&nbsp;&mdash; and then they
							see what's underneath.
						</p>
						<aside>Honestly, the Neuroticism facets make everyone a little nervous. That's normal.</aside>
					</ChatBubble>
				</MessageGroup>

				{/* 5b. Spawned conversation pair — inserted into the flow */}
				{activeTrait && <TraitFacetPair trait={activeTrait} isAnimating={isAnimating} />}

				{/* 6. User — Surprise + vulnerability */}
				<MessageGroup>
					<ChatBubble variant="user">That's... a lot. Is this going to psychoanalyze me?</ChatBubble>
				</MessageGroup>

				{/* 7. Nerin — Callback + reassure + humility + result reveal */}
				<MessageGroup>
					<ChatBubble variant="nerin">
						<h3>No Couch. No Judgment.</h3>
						<h4>What you get at the end</h4>
						<p>
							Remember the patience thing&nbsp;&mdash; different in different rooms? That's the kind of
							stuff we'd talk about. Not diagnosing anything, just mapping how you're wired.
						</p>
						<p>
							It won't capture everything&nbsp;&mdash; nothing can. But at the end, you get a profile like
							this&nbsp;&mdash; your own
							<strong> archetype</strong>, your <strong>OCEAN code</strong>, and a breakdown of all{" "}
							<strong>thirty facets</strong>:
						</p>
						<ShareCardPreview />
						<p>You'll probably recognize yourself in ways that surprise you.</p>
					</ChatBubble>
				</MessageGroup>

				{/* 8. User — Social instinct + insight (status flip) */}
				<MessageGroup>
					<ChatBubble variant="user">
						I already know who I'd send this to. We're so similar it drives us both crazy&nbsp;&mdash; but
						I bet the facets would show exactly where we split.
					</ChatBubble>
				</MessageGroup>

				{/* 8b. Nerin — Acknowledges user insight */}
				<MessageGroup>
					<ChatBubble variant="nerin">
						<p>See&nbsp;&mdash; you're already thinking in facets. That's exactly how this works.</p>
					</ChatBubble>
				</MessageGroup>

				{/* 9. Nerin — Social features + anecdote + privacy */}
				<MessageGroup>
					<ChatBubble variant="nerin">
						<h3>See How You Connect</h3>
						<h4>Share, compare, discover the differences</h4>
						<p>
							Your results are shareable&nbsp;&mdash; and when someone else takes it, you can{" "}
							<strong>overlay your profiles side by side</strong>. See exactly where you align and where
							you don't.
						</p>
						<ComparisonTeaserPreview />
						<p>
							One couple told me they finally understood why they fight about every vacation. One scores
							sky-high on <strong>Adventurousness</strong>, the other is all <strong>Orderliness</strong>.
							Neither was wrong&nbsp;&mdash; they just literally see "a good trip" as opposite things.
						</p>
						<aside>
							Your results stay yours&nbsp;&mdash; private by default. You decide who sees what, always.
						</aside>
					</ChatBubble>
				</MessageGroup>

				{/* 10. User + Nerin — Close (open loop) */}
				<MessageGroup>
					<ChatBubble variant="user">Alright. What's the catch?</ChatBubble>
				</MessageGroup>

				<MessageGroup>
					<ChatBubble variant="nerin">
						<h3>Just a Conversation</h3>
						<p>Thirty minutes. Free. No account. No wrong answers.</p>
						<p>
							Just talking&nbsp;&mdash; about things you probably think about anyway. You just don't
							usually say them out loud.
						</p>
						<p>
							<strong>I already have a hunch about you, actually. Want to find out if I'm right?</strong>
						</p>
					</ChatBubble>
				</MessageGroup>
			</ConversationFlow>

			{/* Fixed UI elements */}
			<DepthMeter />
			<ChatInputBar />
		</DepthScrollProvider>
	);
}
