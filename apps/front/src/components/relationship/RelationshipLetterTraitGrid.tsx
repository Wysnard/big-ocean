/**
 * Section B — side-by-side trait context (Story 7.3)
 */

import { BIG_FIVE_TRAITS, type TraitName } from "@workspace/domain";
import { memo } from "react";

const TRAIT_LABELS: Record<TraitName, string> = {
	openness: "Openness",
	conscientiousness: "Conscientiousness",
	extraversion: "Extraversion",
	agreeableness: "Agreeableness",
	neuroticism: "Neuroticism",
};

/** One sentence per trait: how differing patterns can complement (not a verdict on your scores). */
const TRAIT_COMPLEMENTARITY: Record<TraitName, string> = {
	openness:
		"When one of you reaches for novelty and the other steadies what's familiar, that contrast can feel like friction — or become a gentle way to widen perspective without losing ground.",
	conscientiousness:
		"A gap between structure and spontaneity often shows up as who keeps the calendar and who keeps the room breathing; naming that tradeoff tends to soften it.",
	extraversion:
		"Different social batteries mean you may alternate who leads in groups and who restores in quiet; honoring both rhythms usually matters more than matching them.",
	agreeableness:
		"Warmth and directness rarely sit in the same default setting for two people; the complement is often steadiness plus honesty, if you leave room for both.",
	neuroticism:
		"When sensitivity runs higher for one of you, the other’s calmer baseline can feel like distance — or like ballast, if you treat reactivity as information rather than a flaw.",
};

const MAX_TRAIT = 120;

export type TraitScoreMap = Record<string, { score: number; confidence: number }>;

interface RelationshipLetterTraitGridProps {
	readonly userAName: string;
	readonly userBName: string;
	readonly userATraits: TraitScoreMap;
	readonly userBTraits: TraitScoreMap;
}

function TraitBar({ score, label }: { score: number; label: string }) {
	const safe = Number.isFinite(score) ? score : 0;
	const pct = Math.min(100, Math.max(0, Math.round((safe / MAX_TRAIT) * 100)));
	return (
		<div className="min-w-0 flex-1">
			<div
				className="h-2 w-full overflow-hidden rounded-full bg-muted"
				role="progressbar"
				aria-valuenow={Math.round(safe)}
				aria-valuemin={0}
				aria-valuemax={MAX_TRAIT}
				aria-label={label}
			>
				<div
					className="h-full rounded-full bg-primary/70 motion-safe:transition-[width] motion-safe:duration-500"
					style={{ width: `${pct}%` }}
				/>
			</div>
			<p className="mt-1 text-center text-xs font-data text-muted-foreground">{Math.round(safe)}</p>
		</div>
	);
}

export const RelationshipLetterTraitGrid = memo(function RelationshipLetterTraitGrid({
	userAName,
	userBName,
	userATraits,
	userBTraits,
}: RelationshipLetterTraitGridProps) {
	return (
		<section
			data-testid="relationship-letter-trait-grid"
			data-slot="relationship-letter-trait-grid"
			aria-labelledby="relationship-letter-traits-heading"
			className="rounded-2xl border border-border/60 bg-card/40 p-6 sm:p-8"
		>
			<h3
				id="relationship-letter-traits-heading"
				className="font-heading text-xl font-semibold text-foreground"
			>
				Where you are right now
			</h3>
			<p className="mt-2 max-w-prose text-sm leading-relaxed text-muted-foreground">
				These bars show how each of you tends to show up on the five traits — context for your dynamic,
				not a scoreboard.
			</p>

			<div className="mt-6 space-y-6">
				<div className="grid grid-cols-[1fr_minmax(0,1fr)_minmax(0,1fr)] gap-x-3 gap-y-1 text-xs font-medium text-muted-foreground sm:text-sm">
					<span />
					<span className="truncate text-center">{userAName}</span>
					<span className="truncate text-center">{userBName}</span>
				</div>

				{BIG_FIVE_TRAITS.map((trait) => {
					const a = userATraits[trait]?.score ?? 0;
					const b = userBTraits[trait]?.score ?? 0;
					return (
						<div key={trait} className="space-y-2">
							<p className="text-sm font-medium text-foreground">{TRAIT_LABELS[trait]}</p>
							<div className="grid grid-cols-2 gap-4">
								<TraitBar score={a} label={`${userAName} ${TRAIT_LABELS[trait]}`} />
								<TraitBar score={b} label={`${userBName} ${TRAIT_LABELS[trait]}`} />
							</div>
							<p className="text-xs leading-relaxed text-muted-foreground">
								{TRAIT_COMPLEMENTARITY[trait]}
							</p>
						</div>
					);
				})}
			</div>
		</section>
	);
});
