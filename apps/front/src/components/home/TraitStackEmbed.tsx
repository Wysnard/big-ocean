import { useCallback, useState } from "react";
import {
	BIG_FIVE_TRAITS,
	TRAIT_TO_FACETS,
	type FacetName,
	type TraitName,
} from "@workspace/domain";
import { OceanCircle } from "../ocean-shapes/OceanCircle";
import { OceanDiamond } from "../ocean-shapes/OceanDiamond";
import { OceanHalfCircle } from "../ocean-shapes/OceanHalfCircle";
import { OceanRectangle } from "../ocean-shapes/OceanRectangle";
import { OceanTriangle } from "../ocean-shapes/OceanTriangle";
import { ChatBubble } from "./ChatBubble";
import { MessageGroup } from "./MessageGroup";

/* ── Copy deck (Version A — Nerin voice) ── */

const TRAIT_DESCRIPTIONS: Record<TraitName, string> = {
	openness:
		"How hungry your mind is. Some people crave new ideas like oxygen\u00A0— others prefer what they already know and trust. We measure it through six facets\u00A0— imagination, artistic sensitivity, adventurousness, and more\u00A0— by listening to how you talk about curiosity, beauty, and change.",
	conscientiousness:
		"Your inner project manager. How you handle deadlines, messy rooms, and the gap between what you planned and what you actually did. Nerin picks up on it through the way you describe habits, goals, and the small promises you keep or break.",
	extraversion:
		'Not "are you loud at parties." It\u2019s where your battery charges\u00A0— around people, or away from them\u00A0— and what you do with that energy. We listen for how you talk about social situations, energy levels, and what excites you to tease apart six distinct facets.',
	agreeableness:
		"The tension between being kind and being honest. How you navigate that says more about you than almost anything else. It surfaces in how you describe conflicts, trust, and the compromises you\u2019re willing\u00A0— or unwilling\u00A0— to make.",
	neuroticism:
		"How your nervous system is wired. Not a flaw\u00A0— the people who feel things most intensely often understand the world the deepest. We measure it by tracking how you describe stress, worry, and emotional recovery across six facets from anxiety to vulnerability.",
};

const FACET_DESCRIPTIONS: Record<FacetName, string> = {
	// Openness
	imagination:
		'How much your mind wanders into \u201cwhat if\u201d territory. The daydreamers, the world-builders.',
	artistic_interests:
		"Whether beauty stops you in your tracks\u00A0— music, art, a particular light. Not talent. Sensitivity.",
	emotionality:
		"How tuned in you are to your own feelings. Not how emotional you are\u00A0— how much you notice it.",
	adventurousness:
		"The new restaurant or the usual? A different route or the known one? Your comfort with unfamiliar territory.",
	intellect:
		"Not IQ\u00A0— intellectual hunger. Do abstract ideas energize you, or do you prefer thinking that leads somewhere practical?",
	liberalism:
		"How willing you are to re-examine what you already believe. Your tolerance for having your assumptions challenged.",
	// Conscientiousness
	self_efficacy:
		"Your gut feeling about whether you can handle what\u2019s in front of you. Confidence isn\u2019t personality\u00A0— but this kind is.",
	orderliness:
		"Whether your desk has a system\u00A0— or IS the system. How much chaos costs you energy.",
	dutifulness:
		'How heavy the word \u201cshould\u201d sits in your vocabulary. Whether promises keep you up at night.',
	achievement_striving:
		'The gap between \u201cgood enough\u201d and \u201cmy best.\u201d How much that gap bothers you.',
	self_discipline:
		"The boring superpower. Can you stay on task when the task isn\u2019t interesting? That\u2019s this.",
	cautiousness:
		"How long you sit with a decision before making it. Impulsive vs.\u00A0deliberate\u00A0— and where you land.",
	// Extraversion
	friendliness:
		"How quickly warmth shows up. Some people are warm in 30\u00A0seconds, others in 30\u00A0days. Both are real.",
	gregariousness:
		'Not just \u201cdo you like people\u201d\u00A0— do you actively seek the crowd? Or do you pick your three and go deep?',
	assertiveness:
		"How naturally you take space in a room. Whether influence feels like effort or instinct.",
	activity_level:
		"Your idle speed. Some people\u2019s rest looks like other people\u2019s hustle. This measures the engine, not the output.",
	excitement_seeking:
		'Where your threshold is for \u201cenough stimulation.\u201d Roller coasters vs.\u00A0books. Or maybe both.',
	cheerfulness:
		"Your emotional default state. Not whether you\u2019re happy right now\u00A0— whether happiness is where your mood naturally returns to.",
	// Agreeableness
	trust:
		"Your default setting with strangers. Some people start at 100 and subtract. Others start at zero and make you earn it.",
	morality:
		"Your relationship with the straight line between thinking and saying. Some people filter everything. Others can\u2019t.",
	altruism:
		"Whether helping feels like a choice or a reflex. The difference matters.",
	cooperation:
		"What happens when you disagree. Do you push back, or find the overlap? Your reflex, not your strategy.",
	modesty:
		"How loudly you take credit. Not low self-esteem\u00A0— whether self-promotion feels natural or physically uncomfortable.",
	sympathy:
		"How much other people\u2019s pain becomes yours. The spectrum between empathic sponge and emotional Teflon.",
	// Neuroticism
	anxiety:
		'How loud the \u201cwhat could go wrong\u201d voice is. Everyone has one. This measures the volume.',
	anger:
		"How short the fuse is\u00A0— and what lights it. Not whether you\u2019re angry now, but how easily you get there.",
	depression:
		"Your vulnerability to low moods. Not clinical depression\u00A0— the tendency to dip into guilt, sadness, or hopelessness when things go sideways.",
	self_consciousness:
		'How aware you are of being watched. The volume knob on \u201cwhat do they think of me?\u201d',
	immoderation:
		"How hard it is to stop once you\u2019ve started\u00A0— food, scrolling, spending, whatever your thing is. Impulse control, unfiltered.",
	vulnerability:
		"How stress lands on you. Some people absorb impact like a sponge. Others bounce back fast. This measures the absorption rate.",
};

/* ── Shape helper ── */

function TraitShape({ trait, size }: { trait: TraitName; size: number }) {
	const color = `var(--trait-${trait})`;
	switch (trait) {
		case "openness":
			return <OceanCircle size={size} color={color} />;
		case "conscientiousness":
			return <OceanHalfCircle size={size} color={color} />;
		case "extraversion":
			return <OceanRectangle size={size} color={color} />;
		case "agreeableness":
			return <OceanTriangle size={size} color={color} />;
		case "neuroticism":
			return <OceanDiamond size={size} color={color} />;
	}
}

function formatTraitName(trait: string): string {
	return trait.charAt(0).toUpperCase() + trait.slice(1);
}

function formatFacetName(facet: string): string {
	return facet
		.split("_")
		.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
		.join(" ");
}

/* ── Trait stack embed (lives inside a ChatBubble) ── */

interface TraitStackEmbedProps {
	activeTrait: TraitName | null;
	onTraitSelect: (trait: TraitName | null) => void;
}

export function TraitStackEmbed({
	activeTrait,
	onTraitSelect,
}: TraitStackEmbedProps) {
	return (
		<div
			data-slot="trait-stack-embed"
			className="mt-[14px] flex flex-col gap-2 rounded-xl border border-[var(--embed-border)] bg-[var(--embed-bg)] p-4 backdrop-blur-[4px] transition-[background,border-color] duration-[350ms]"
		>
			{BIG_FIVE_TRAITS.map((trait) => {
				const isActive = activeTrait === trait;
				const isDimmed = activeTrait !== null && !isActive;

				return (
					<button
						key={trait}
						type="button"
						onClick={() =>
							onTraitSelect(isActive ? null : trait)
						}
						data-slot="trait-card"
						data-state={isActive ? "active" : isDimmed ? "dimmed" : "idle"}
						className="flex cursor-pointer items-center gap-[14px] rounded-[10px] border-[1.5px] border-transparent px-4 py-[14px] text-left transition-all duration-[280ms] [transition-timing-function:cubic-bezier(.16,1,.3,1)] hover:bg-[rgba(0,0,0,0.02)] dark:hover:bg-[rgba(255,255,255,0.02)] data-[state=active]:bg-[var(--active-wash)] data-[state=active]:border-[var(--active-color)] data-[state=dimmed]:opacity-45 max-[600px]:flex-col max-[600px]:items-start max-[600px]:gap-2"
						style={
							{
								"--active-color": `var(--trait-${trait})`,
								"--active-wash": `color-mix(in oklch, var(--trait-${trait}) 6%, transparent)`,
							} as React.CSSProperties
						}
					>
						<div
							className="flex w-9 shrink-0 items-center justify-center transition-transform duration-300 [transition-timing-function:cubic-bezier(.34,1.56,.64,1)] data-[active=true]:scale-[1.15]"
							data-active={isActive}
						>
							<TraitShape trait={trait} size={32} />
						</div>
						<div className="min-w-0 flex-1">
							<div
								className="font-heading text-[1.05rem] font-bold leading-tight"
								style={{ color: `var(--trait-${trait})` }}
							>
								{formatTraitName(trait)}
							</div>
							<p className="mt-[2px] text-[.82rem] leading-[1.55] text-[var(--muted-dynamic)] transition-colors duration-[350ms]">
								{TRAIT_DESCRIPTIONS[trait]}
							</p>
						</div>
						<svg
							className="h-5 w-5 shrink-0 text-[var(--muted-dynamic)] opacity-40 transition-all duration-250 data-[active=true]:opacity-0 data-[active=true]:translate-x-1 max-[600px]:absolute max-[600px]:right-4 max-[600px]:top-[14px]"
							data-active={isActive}
							viewBox="0 0 20 20"
							fill="none"
							stroke="currentColor"
							strokeWidth="1.5"
							aria-hidden="true"
						>
							<path d="M7 4l6 6-6 6" />
						</svg>
					</button>
				);
			})}
		</div>
	);
}

/* ── Facet conversation pair (lives in ConversationFlow, outside any ChatBubble) ── */

interface TraitFacetPairProps {
	trait: TraitName;
	isAnimating: boolean;
}

export function TraitFacetPair({ trait, isAnimating }: TraitFacetPairProps) {
	const facets = TRAIT_TO_FACETS[trait] ?? [];

	return (
		<div
			data-slot="facet-conversation-pair"
			className="flex flex-col gap-5 motion-reduce:!opacity-100 motion-reduce:!translate-y-0"
			style={{
				animation: isAnimating
					? "traitPairExit 200ms ease-in forwards"
					: "traitPairEnter 450ms cubic-bezier(.16,1,.3,1) forwards",
			}}
		>
			{/* User asks about the trait */}
			<MessageGroup>
				<ChatBubble variant="user">
					Tell me more about {formatTraitName(trait)}
				</ChatBubble>
			</MessageGroup>

			{/* Nerin responds with facets */}
			<MessageGroup>
				<ChatBubble variant="nerin">
					<div className="flex items-center gap-[10px] mb-3">
						<div className="motion-safe:animate-[shapeReveal_400ms_cubic-bezier(.34,1.56,.64,1)_300ms_both]">
							<TraitShape trait={trait} size={40} />
						</div>
						<span
							className="font-heading text-[.95rem] font-semibold"
							style={{
								color: `var(--trait-${trait})`,
							}}
						>
							{formatTraitName(trait)}
						</span>
					</div>

					<p className="mb-4 text-[.84rem] leading-[1.6] text-[var(--muted-dynamic)] transition-colors duration-[350ms]">
						{TRAIT_DESCRIPTIONS[trait]}
					</p>

					<div
						className="font-heading text-[.85rem] font-semibold mb-3"
						style={{ color: `var(--trait-${trait})` }}
					>
						Six facets
					</div>

					<div className="flex flex-col gap-[14px]">
						{facets.map((facet, i) => (
							<div
								key={facet}
								className="border-l-[3px] pl-[14px] motion-safe:animate-[facetCascade_300ms_cubic-bezier(.16,1,.3,1)_both]"
								style={{
									borderLeftColor: `var(--facet-${facet})`,
									animationDelay: `${400 + i * 60}ms`,
								}}
							>
								<div
									className="font-heading text-[.85rem] font-semibold"
									style={{ color: `var(--facet-${facet})` }}
								>
									{formatFacetName(facet)}
								</div>
								<p className="mt-[2px] text-[.8rem] leading-[1.55] text-[var(--muted-dynamic)] transition-colors duration-[350ms]">
									{FACET_DESCRIPTIONS[facet]}
								</p>
							</div>
						))}
					</div>
				</ChatBubble>
			</MessageGroup>
		</div>
	);
}

/* ── Hook for managing trait selection with cross-fade animation ── */

export function useTraitSelection() {
	const [activeTrait, setActiveTrait] = useState<TraitName | null>(null);
	const [isAnimating, setIsAnimating] = useState(false);

	const handleTraitSelect = useCallback(
		(trait: TraitName | null) => {
			if (isAnimating) return;

			if (trait === null || activeTrait === trait) {
				setActiveTrait(null);
				return;
			}

			if (activeTrait !== null) {
				// Cross-fade: exit current, then enter new
				setIsAnimating(true);
				setTimeout(() => {
					setActiveTrait(trait);
					setIsAnimating(false);
				}, 200);
				return;
			}

			setActiveTrait(trait);
		},
		[activeTrait, isAnimating],
	);

	return { activeTrait, isAnimating, handleTraitSelect };
}
