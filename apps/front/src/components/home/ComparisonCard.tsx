import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Split comparison card showing 16Personalities-style agree/disagree scale
 * vs. Nerin's conversational approach.
 *
 * Designed to be embedded inside a Nerin ChatBubble, matching the pattern
 * used by ShareCardPreview and TraitStackEmbed.
 */
export function ComparisonCard() {
	const ref = useRef<HTMLDivElement>(null);
	const [visible, setVisible] = useState(false);

	const handleIntersect = useCallback((entries: IntersectionObserverEntry[]) => {
		for (const entry of entries) {
			if (entry.isIntersecting) {
				setVisible(true);
			}
		}
	}, []);

	useEffect(() => {
		const el = ref.current;
		if (!el) return;

		const observer = new IntersectionObserver(handleIntersect, {
			threshold: 0.12,
			rootMargin: "0px 0px -30px 0px",
		});
		observer.observe(el);
		return () => observer.disconnect();
	}, [handleIntersect]);

	return (
		<div ref={ref} data-slot="comparison-card" className="mt-3 mb-1">
			{/* Split container — stacked on mobile, side-by-side on desktop */}
			<div className="overflow-hidden rounded-[16px] border border-[var(--embed-border)] bg-[var(--embed-bg)]">
				<div className="grid grid-cols-1 md:grid-cols-2">
					{/* ── Traditional panel ── */}
					<div className="border-b border-[var(--embed-border)] md:border-b-0 md:border-r">
						<div className="px-5 py-2.5">
							<span className="font-heading text-[.72rem] font-semibold uppercase tracking-wider text-muted-foreground">
								Traditional
							</span>
						</div>
						<div className="px-5 pb-5">
							<TraditionalSide visible={visible} />
						</div>
					</div>

					{/* ── Conversational panel ── */}
					<div>
						<div className="px-5 py-2.5">
							<span className="font-heading text-[.72rem] font-semibold uppercase tracking-wider text-primary">
								Conversational
							</span>
						</div>
						<div className="px-5 pb-5">
							<ConversationalSide visible={visible} />
						</div>
					</div>
				</div>
			</div>

			{/* Closing tagline */}
			<p
				className="mt-4 text-center font-heading text-[.85rem] italic text-muted-foreground transition-opacity duration-500"
				style={{
					opacity: visible ? 1 : 0,
					transitionDelay: visible ? "2200ms" : "0ms",
				}}
			>
				One gives you a dot on a scale. The other hears your story.
			</p>
		</div>
	);
}

/** 16Personalities-style agree/disagree scale — appears instantly, stays frozen. */
function TraditionalSide({ visible }: { visible: boolean }) {
	return (
		<div
			className="flex flex-col items-center gap-4 transition-opacity duration-300"
			style={{ opacity: visible ? 1 : 0 }}
		>
			{/* Statement */}
			<p className="text-center text-[.85rem] leading-[1.6] text-foreground">
				&ldquo;You feel comfortable just walking up to someone you find interesting and striking up a
				conversation.&rdquo;
			</p>

			{/* Scale */}
			<div className="flex w-full max-w-[320px] items-center justify-between gap-1">
				<span className="shrink-0 text-[.68rem] font-semibold uppercase tracking-wider text-score-high">
					Agree
				</span>
				<div className="flex flex-1 items-center justify-center gap-[6px]">
					{SCALE_DOTS.map((dot) => (
						<div
							key={dot.id}
							className="flex h-[16px] w-[16px] items-center justify-center rounded-full border border-muted-foreground/30 transition-colors"
							style={
								dot.selected
									? { backgroundColor: "var(--muted-foreground)", borderColor: "var(--muted-foreground)" }
									: undefined
							}
						>
							{dot.selected && <div className="h-[7px] w-[7px] rounded-full bg-background" />}
						</div>
					))}
				</div>
				<span className="shrink-0 text-[.68rem] font-semibold uppercase tracking-wider text-score-low">
					Disagree
				</span>
			</div>

			{/* Result label */}
			<p className="text-[.78rem] font-medium text-muted-foreground">
				Result: <span className="italic">Slightly introverted</span>
			</p>
		</div>
	);
}

/** Chat bubbles that type in one by one with staggered delays. */
function ConversationalSide({ visible }: { visible: boolean }) {
	return (
		<div className="flex flex-col gap-2.5">
			{CONVERSATION_BUBBLES.map((bubble) => (
				<div
					key={bubble.id}
					className="transition-all duration-[450ms] [transition-timing-function:cubic-bezier(.16,1,.3,1)] motion-reduce:!opacity-100 motion-reduce:!translate-y-0"
					style={{
						opacity: visible ? 1 : 0,
						transform: visible ? "translateY(0)" : "translateY(12px)",
						transitionDelay: visible ? `${bubble.delay}ms` : "0ms",
					}}
				>
					{bubble.sender === "nerin" ? (
						<NerinMini>{bubble.text}</NerinMini>
					) : (
						<UserMini>{bubble.text}</UserMini>
					)}
				</div>
			))}
		</div>
	);
}

/** Compact Nerin bubble for the comparison card. */
function NerinMini({ children }: { children: React.ReactNode }) {
	return (
		<div className="flex items-start gap-2">
			<Avatar size="sm" className="bg-gradient-to-br from-tertiary to-primary" aria-hidden="true">
				<AvatarFallback className="bg-gradient-to-br from-tertiary to-primary font-heading text-[.55rem] font-bold text-white">
					N
				</AvatarFallback>
			</Avatar>
			<div className="rounded-[12px] rounded-bl-[4px] border border-[var(--bubble-border)] bg-[var(--bubble-bg)] px-3 py-2 text-[.78rem] leading-[1.55] text-[var(--bubble-fg)]">
				{children}
			</div>
		</div>
	);
}

/** Compact user bubble for the comparison card. */
function UserMini({ children }: { children: React.ReactNode }) {
	return (
		<div className="flex flex-row-reverse items-start gap-2">
			<Avatar
				size="sm"
				className="bg-gradient-to-br from-[var(--user-avatar-from)] to-[var(--user-avatar-to)]"
				aria-hidden="true"
			>
				<AvatarFallback className="bg-gradient-to-br from-[var(--user-avatar-from)] to-[var(--user-avatar-to)] font-heading text-[.55rem] font-bold text-[var(--user-avatar-fg)]">
					Y
				</AvatarFallback>
			</Avatar>
			<div className="rounded-[12px] rounded-br-[4px] bg-gradient-to-br from-primary to-secondary px-3 py-2 text-[.78rem] leading-[1.55] text-white">
				{children}
			</div>
		</div>
	);
}

/* ═══════ Static data ═══════ */

const SCALE_DOTS = [
	{ id: 1, selected: false },
	{ id: 2, selected: false },
	{ id: 3, selected: false },
	{ id: 4, selected: true },
	{ id: 5, selected: false },
	{ id: 6, selected: false },
	{ id: 7, selected: false },
] as const;

const CONVERSATION_BUBBLES = [
	{
		id: "nerin-1",
		sender: "nerin",
		text: "How do you feel about approaching someone new?",
		delay: 600,
	},
	{
		id: "user-1",
		sender: "user",
		text:
			"It really depends on the context. At a conference about something I\u2019m passionate about? I\u2019ll walk up to anyone. But at a bar or a random social event? Absolutely not. I need a reason to talk to someone\u2009\u2014\u2009a shared interest, a purpose. Without that I just feel like I\u2019m intruding.",
		delay: 1100,
	},
	{
		id: "nerin-2",
		sender: "nerin",
		text:
			"So it\u2019s not shyness\u2009\u2014\u2009it\u2019s that you need the conversation to have a foundation before you feel comfortable starting it.",
		delay: 1800,
	},
] as const;
