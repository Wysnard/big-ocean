import { createFileRoute } from "@tanstack/react-router";
import { ChatBubble } from "../components/home/ChatBubble";
import { ChatInputBar } from "../components/home/ChatInputBar";
import { ComparisonCard } from "../components/home/ComparisonCard";
import { ComparisonTeaserPreview } from "../components/home/ComparisonTeaserPreview";
import { ConversationFlow } from "../components/home/ConversationFlow";
import { DepthMeter } from "../components/home/DepthMeter";
import { DepthScrollProvider } from "../components/home/DepthScrollProvider";
import { HeroSection } from "../components/home/HeroSection";
import { HoroscopeVsPortraitComparison } from "../components/home/HoroscopeVsPortraitComparison";
import { MessageGroup } from "../components/home/MessageGroup";
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
				{/* Beat 1 — Nerin: Hook */}
				<MessageGroup>
					<ChatBubble variant="nerin">
						<p>
							You know that thing where a test tells you you&rsquo;re &ldquo;introverted&rdquo; and you
							think <em>yeah, but I&rsquo;m the loudest person at dinner with my friends</em>?
						</p>
						<p>
							Or it says you&rsquo;re &ldquo;organized&rdquo; but your desk looks like a crime scene and
							somehow you still never miss a deadline?
						</p>
						<p>
							That &ldquo;but&rdquo;&nbsp;&mdash;&nbsp;that&rsquo;s the part no test captures. That&rsquo;s
							the part I&rsquo;m interested in.
						</p>
					</ChatBubble>
				</MessageGroup>

				{/* Beat 2 — User: Skeptic reveals wound */}
				<MessageGroup>
					<ChatBubble variant="user">
						I&rsquo;ve done a few of these. They never really got it right. I&rsquo;d read the result and
						think &ldquo;that&rsquo;s... someone, but not me.&rdquo;
					</ChatBubble>
				</MessageGroup>

				{/* Beat 3 — Nerin: Acknowledges wound */}
				<MessageGroup>
					<ChatBubble variant="nerin">
						<h3>That&rsquo;s Not a Bug. That&rsquo;s the Problem.</h3>
						<p>
							Those tests aren&rsquo;t broken&nbsp;&mdash;&nbsp;they&rsquo;re just measuring the wrong way.
							They ask you to rate yourself on a scale, average out the answers, and hand you a type.
						</p>
						<p>
							But you&rsquo;re not an average. You&rsquo;re a pattern of
							contradictions&nbsp;&mdash;&nbsp;and that&rsquo;s what makes you interesting. A scale of 1 to
							7 can&rsquo;t hold that. A conversation can.
						</p>
					</ChatBubble>
				</MessageGroup>

				{/* Beat 4 — Nerin: Traditional vs Conversational comparison */}
				<MessageGroup>
					<ChatBubble variant="nerin">
						<p>Same question. Two approaches.</p>
						<ComparisonCard />
					</ChatBubble>
				</MessageGroup>

				{/* Beat 5 — User: Bridges */}
				<MessageGroup>
					<ChatBubble variant="user">
						Okay I get how that&rsquo;s different. But that&rsquo;s just how you ask the questions.
					</ChatBubble>
				</MessageGroup>

				{/* Beat 6 — Nerin: Trait explorer */}
				<MessageGroup>
					<ChatBubble variant="nerin">
						<h3>What I&rsquo;m Actually Listening For</h3>
						<p>
							While we talk, I&rsquo;m mapping the texture underneath. Not five
							labels&nbsp;&mdash;&nbsp;five landscapes. Take Openness&nbsp;&mdash;&nbsp;it&rsquo;s not just
							&ldquo;creative or not creative.&rdquo; It&rsquo;s Adventurousness, Artistic Interests,
							Emotionality, Imagination, Intellect, Liberalism. Six flavors of one trait.
						</p>
						<p>Tap one and see what&rsquo;s underneath.</p>
						<TraitStackEmbed activeTrait={activeTrait} onTraitSelect={handleTraitSelect} />
						<p>You don&rsquo;t get a type. You get a landscape.</p>
					</ChatBubble>
				</MessageGroup>

				{/* Beat 6b — Conditional: Spawned conversation pair */}
				{activeTrait && <TraitFacetPair trait={activeTrait} isAnimating={isAnimating} />}

				{/* Beat 7 — User: Challenges output */}
				<MessageGroup>
					<ChatBubble variant="user">
						That&rsquo;s a lot of detail. But personality descriptions always end up saying the same
						thing. &ldquo;You&rsquo;re creative but also value stability.&rdquo; That could be anyone.
					</ChatBubble>
				</MessageGroup>

				{/* Beat 8 — Nerin: Horoscope vs Portrait comparison (climax) */}
				<MessageGroup>
					<ChatBubble variant="nerin">
						<p>
							You&rsquo;re not wrong. Two descriptions of the same person. One from a horoscope app. One
							from a conversation with me.
						</p>
						<HoroscopeVsPortraitComparison />
					</ChatBubble>
				</MessageGroup>

				{/* Beat 9 — User: Reacts to portrait quality */}
				<MessageGroup>
					<ChatBubble variant="user">
						That right side doesn&rsquo;t read like a test result. It reads like someone who actually
						knows them.
					</ChatBubble>
				</MessageGroup>

				{/* Beat 10 — Nerin: The reveal */}
				<MessageGroup>
					<ChatBubble variant="nerin">That&rsquo;s actually the person who built big-ocean.</ChatBubble>
				</MessageGroup>

				{/* Beat 10b — Vincent: Founder's personal share */}
				<MessageGroup>
					<ChatBubble variant="vincent">
						I&rsquo;d taken every test out there. MBTI, Enneagram, even a few I&rsquo;m embarrassed to
						admit. They&rsquo;d tell me things that were true on the surface but never felt complete. When
						I first read what Nerin wrote about me, I sat with it for a long time. Not because it told me
						something I didn&rsquo;t know&nbsp;&mdash;&nbsp;but because it named things I&rsquo;d been
						carrying without words for them.
						<br />
						<br />
						That&rsquo;s why I built this.
					</ChatBubble>
				</MessageGroup>

				{/* Beat 11 — User: "I'd be scared to read mine" */}
				<MessageGroup>
					<ChatBubble variant="user">...I think I&rsquo;d be scared to read mine.</ChatBubble>
				</MessageGroup>

				{/* Beat 11b — Nerin: Privacy + control */}
				<MessageGroup>
					<ChatBubble variant="nerin">
						<h3>Your Portrait. Your Rules.</h3>
						<p>
							That&rsquo;s a fair reaction&nbsp;&mdash;&nbsp;and it&rsquo;s why your results are private by
							default. No one sees your portrait unless you decide to share it. No public profile. No
							leaderboard. No data sold.
						</p>
						<p>You own what comes out of this conversation. Always.</p>
					</ChatBubble>
				</MessageGroup>

				{/* Beat 11c — User: Asks about sharing */}
				<MessageGroup>
					<ChatBubble variant="user">
						And if I want to share it? Or compare it with someone close to me?
					</ChatBubble>
				</MessageGroup>

				{/* Beat 12 — Nerin: Social comparison */}
				<MessageGroup>
					<ChatBubble variant="nerin">
						<h3>See How You Connect</h3>
						<p>
							And if you <em>do</em> decide to share&nbsp;&mdash;&nbsp;you can invite someone to take their
							own dive and overlay your profiles side by side. See exactly where you align and where you
							don&rsquo;t.
						</p>
						<ComparisonTeaserPreview />
						<p>
							One couple told me they finally understood why they fight about every vacation. One scores
							sky-high on <strong>Adventurousness</strong>, the other is all <strong>Orderliness</strong>.
							Neither was wrong&nbsp;&mdash;&nbsp;they just literally see &ldquo;a good trip&rdquo; as
							opposite things.
						</p>
					</ChatBubble>
				</MessageGroup>

				{/* Beat 13 — User: The converting line */}
				<MessageGroup>
					<ChatBubble variant="user">...I wonder what mine would say.</ChatBubble>
				</MessageGroup>

				{/* Beat 14 — Nerin: CTA close */}
				<MessageGroup>
					<ChatBubble variant="nerin">
						<h3>Just a Conversation</h3>
						<p>Thirty minutes. No account. No wrong answers.</p>
						<p>
							Just talking&nbsp;&mdash;&nbsp;about things you probably think about anyway. You just
							don&rsquo;t usually say them out loud.
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
