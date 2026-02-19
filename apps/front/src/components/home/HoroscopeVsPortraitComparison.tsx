import { useCallback, useEffect, useRef, useState } from "react";
import Markdown from "react-markdown";
import { OceanShapeSet } from "../ocean-shapes/OceanShapeSet";
import {
	markdownComponents,
	renderHeader,
	splitMarkdownSections,
} from "../results/portrait-markdown";
import portraitExcerpt from "./portrait-excerpt.md?raw";

const sections = splitMarkdownSections(portraitExcerpt).filter((s) => s.level === 2);

/* ═══════ Static horoscope prediction data ═══════ */

const PREDICTIONS = [
	{
		id: "love",
		emoji: "\u{1F496}",
		label: "Love",
		stars: 3,
		text:
			"Venus enters your fifth house this week, stirring up old feelings and new possibilities. Someone from your past may resurface with fresh energy. If you\u2019re in a relationship, expect a deeper emotional connection\u00A0\u2014\u00A0vulnerability is your superpower right now. Singles: say yes to the invite you\u2019d normally skip.",
	},
	{
		id: "career",
		emoji: "\u{1F680}",
		label: "Career",
		stars: 4,
		text:
			"Mars fuels your ambition and makes you restless for change. A bold move at work could pay off big\u00A0\u2014\u00A0but don\u2019t burn bridges on the way up. Collaboration is your hidden strength this month. That colleague you\u2019ve been clashing with? They hold the key to your next breakthrough. Swallow the pride.",
	},
	{
		id: "money",
		emoji: "\u{1F4B0}",
		label: "Money",
		stars: 2,
		text:
			"Financial clarity arrives mid-week when Mercury aligns with Jupiter. Avoid impulse purchases\u00A0\u2014\u00A0that thing in your cart can wait. The universe rewards patience and strategy right now. A conversation about money you\u2019ve been avoiding? Have it before Friday. The numbers are more in your favor than you think.",
	},
	{
		id: "wellness",
		emoji: "\u{1F33F}",
		label: "Wellness",
		stars: 5,
		text:
			"Your energy runs high but your body is quietly asking for a reset. Channel that fire into movement\u00A0\u2014\u00A0a long walk or swim could unlock your next breakthrough idea. Watch your sleep this week: the restless nights aren\u2019t random, they\u2019re your subconscious processing something big. Honor the pause.",
	},
] as const;

function StarRating({ filled }: { filled: number }) {
	return (
		<span className="text-[8px] tracking-[1px] text-horoscope-star">
			{Array.from({ length: 5 }, (_, i) => (i < filled ? "\u2605" : "\u2606")).join("")}
		</span>
	);
}

/**
 * Side-by-side comparison of a horoscope-app style prediction grid vs a specific
 * big-ocean portrait excerpt. Designed to visually demonstrate the quality gap
 * between vague cosmic personality descriptions and Nerin's precise observations.
 *
 * Horoscope side uses Quicksand font + pastel gradient to look deliberately
 * "foreign" compared to big-ocean's design system.
 */
export function HoroscopeVsPortraitComparison() {
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
		<div
			ref={ref}
			data-slot="horoscope-portrait-comparison"
			data-visible={visible || undefined}
			className="group mt-3 mb-1"
		>
			<div className="overflow-hidden rounded-[16px] border border-(--embed-border) bg-(--embed-bg)">
				<div className="grid grid-cols-1 sm:grid-cols-2">
					{/* Horoscope side — pastel prediction cards */}
					<div className="opacity-0 translate-y-3 border-b border-(--embed-border) sm:border-b-0 sm:border-r transition-all duration-500 delay-200 group-data-visible:opacity-100 group-data-visible:translate-y-0 motion-reduce:opacity-100! motion-reduce:translate-y-0! bg-[image:var(--horoscope-bg)] font-['Quicksand',sans-serif]">
						{/* Sign badge */}
						<div className="px-4 pt-4 pb-0 text-center">
							<span className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 bg-horoscope-badge-bg backdrop-blur-[4px]">
								<span className="text-[15px]">&#9800;</span>
								<span className="text-[13px] font-bold text-horoscope-sign">Aries</span>
								<span className="ml-0.5 text-[9px] font-medium text-horoscope-date">
									Mar 21 &ndash; Apr 19
								</span>
							</span>
						</div>

						{/* Aries description */}
						<p className="px-4 pt-3 pb-0 text-center text-[11px] leading-[1.6] italic text-horoscope-description">
							With Mars as your ruling planet, you lead with instinct and refuse to wait for permission.
							Your cardinal fire makes you a natural initiator&nbsp;&mdash;&nbsp;brave, direct, and
							fiercely independent.
						</p>

						{/* Prediction cards */}
						<div className="flex flex-col gap-2 p-3.5 pb-4">
							{PREDICTIONS.map((pred) => (
								<div
									key={pred.id}
									className="rounded-xl p-2.5 bg-horoscope-card-bg backdrop-blur-[4px] border border-horoscope-card-border"
								>
									<div className="mb-1.5 flex items-center justify-between">
										<span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide text-horoscope-label">
											<span className="text-[14px]">{pred.emoji}</span>
											{pred.label}
										</span>
										<StarRating filled={pred.stars} />
									</div>
									<p className="text-[10.5px] font-medium leading-[1.55] text-horoscope-body">{pred.text}</p>
								</div>
							))}
						</div>
					</div>

					{/* Portrait side */}
					<div className="opacity-0 translate-y-3 transition-all duration-500 delay-500 group-data-visible:opacity-100 group-data-visible:translate-y-0 motion-reduce:opacity-100! motion-reduce:translate-y-0!">
						<div className="px-5 py-2.5 flex items-center gap-1">
							<span className="font-heading text-[.72rem] font-black tracking-wider">big-</span>
							<OceanShapeSet size={11} />
						</div>
						<div className="px-5 pb-5 space-y-6">
							{sections.map((section, i) => (
								<div key={section.header} className="space-y-2">
									<h4 className="text-sm font-semibold text-foreground">{renderHeader(section.header)}</h4>
									{section.body && (
										<div className="text-sm leading-relaxed text-foreground/80">
											<Markdown components={markdownComponents}>{section.body}</Markdown>
										</div>
									)}
									{i < sections.length - 1 && <div className="border-b border-border/30 pt-2" />}
								</div>
							))}
						</div>
					</div>
				</div>
			</div>

			{/* Bottom text */}
			<p className="opacity-0 mt-4 text-center font-heading text-[.85rem] italic text-muted-foreground transition-opacity duration-500 delay-[900ms] group-data-visible:opacity-100">
				Which one feels like someone was actually paying attention?
			</p>
		</div>
	);
}
