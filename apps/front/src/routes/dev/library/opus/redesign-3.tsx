import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { ArrowRight, ChevronRight, ExternalLink, Info } from "lucide-react";
import { type ReactElement, useState } from "react";
import { PageMain } from "@/components/PageMain";
import { ThemeToggle } from "@/components/ThemeToggle";

export const Route = createFileRoute("/dev/library/opus/redesign-3")({
	beforeLoad: () => {
		if (import.meta.env.PROD) {
			throw redirect({ to: "/" });
		}
	},
	component: Redesign3Page,
});

/* ── Mock data ─────────────────────────────────────────── */

const TABS = ["Overview", "Spectrum", "Facets", "Related"] as const;
type Tab = (typeof TABS)[number];

const OVERVIEW_CONTENT = {
	definition:
		"Openness to experience describes how strongly a person is drawn toward novelty, abstraction, imagination, and experimentation. In the Big Five literature it captures more than artistic taste. It includes cognitive flexibility, tolerance for ambiguity, and the degree to which someone prefers the unfamiliar over the established.",
	dailyLife: [
		{
			level: "Low",
			text:
				"Respect for proven methods, concrete language, and a preference for practical solutions that have already survived real-world use.",
		},
		{
			level: "Mid",
			text:
				"Selective curiosity — open to new perspectives when they solve a real problem, not automatically persuaded by novelty.",
		},
		{
			level: "High",
			text:
				"Fast pattern recognition, appetite for experimentation, and comfort living with ideas before they are fully settled.",
		},
	],
};

const SPECTRUM_DATA = {
	tagline:
		"Openness isn't one thing. It's the thread that connects whether you prefer the familiar or the unexplored, across thinking, feeling, and doing.",
	levels: [
		{
			code: "L",
			label: "Low",
			pct: "0–35%",
			description:
				"Grounded, practical, prefers the tried-and-true. Values concrete results over abstract possibilities.",
			indicators: [
				"Sticks with trusted routines",
				"Prefers clear instructions",
				"Skeptical of untested ideas",
			],
		},
		{
			code: "M",
			label: "Moderate",
			pct: "35–65%",
			description:
				"Selectively curious. Open to novelty when there is clear benefit, but not impulsive about change.",
			indicators: [
				"Tries new things in familiar domains",
				"Balances creativity with practicality",
				"Open-minded but needs a reason",
			],
		},
		{
			code: "H",
			label: "High",
			pct: "65–100%",
			description:
				"Drawn to novelty, abstraction, and ambiguity. Finds energy in ideas that aren't fully resolved yet.",
			indicators: [
				"Seeks out unfamiliar experiences",
				"Comfortable with ambiguity",
				"Questions inherited assumptions",
			],
		},
	],
};

const FACETS_DATA = [
	{
		name: "Imagination",
		slug: "imagination",
		code: "O1",
		score: 82,
		description:
			"Vividness of your inner world — daydreaming, hypothetical scenarios, creative projection.",
	},
	{
		name: "Artistic Interests",
		slug: "artistic_interests",
		code: "O2",
		score: 71,
		description:
			"Sensitivity to beauty, form, and aesthetic experience across art, nature, and design.",
	},
	{
		name: "Emotionality",
		slug: "emotionality",
		code: "O3",
		score: 65,
		description: "Depth of emotional awareness and willingness to sit with complex feelings.",
	},
	{
		name: "Adventurousness",
		slug: "adventurousness",
		code: "O4",
		score: 88,
		description: "Drive to seek novel situations, places, foods, and activities.",
	},
	{
		name: "Intellect",
		slug: "intellect",
		code: "O5",
		score: 91,
		description: "Hunger for abstract ideas, philosophical puzzles, and intellectual debate.",
	},
	{
		name: "Liberalism",
		slug: "liberalism",
		code: "O6",
		score: 57,
		description: "Willingness to challenge convention, re-examine values, and question authority.",
	},
];

const RELATED_TRAITS = [
	{
		name: "Conscientiousness",
		slug: "conscientiousness",
		relationship: "Often inversely correlated — high openness may resist rigid structure.",
	},
	{
		name: "Extraversion",
		slug: "extraversion",
		relationship: "Shared facets around excitement-seeking, but expressed differently.",
	},
	{
		name: "Neuroticism",
		slug: "neuroticism",
		relationship: "High openness with high neuroticism can amplify emotional sensitivity.",
	},
];

/* ── Score Bar ─────────────────────────────────────────── */

function FacetScoreBar({ score, name }: { score: number; name: string }) {
	const level = score >= 65 ? "High" : score >= 35 ? "Mid" : "Low";
	const levelColor =
		score >= 65
			? "bg-emerald-500/80 text-emerald-50"
			: score >= 35
				? "bg-amber-500/80 text-amber-50"
				: "bg-blue-500/80 text-blue-50";

	return (
		<div className="flex items-center gap-3">
			<div className="flex-1 h-2 rounded-full bg-muted/50 overflow-hidden">
				<meter
					className="block h-2 w-full [&::-webkit-meter-bar]:bg-muted/50 [&::-webkit-meter-optimum-value]:rounded-full [&::-webkit-meter-optimum-value]:bg-primary"
					value={score}
					min={0}
					max={100}
					low={35}
					high={65}
					optimum={100}
					aria-label={`${name} score`}
				/>
			</div>
			<span className="text-xs font-mono text-muted-foreground tabular-nums w-8 text-right">
				{score}
			</span>
			<span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${levelColor}`}>
				{level}
			</span>
		</div>
	);
}

/* ── Tab Panels ────────────────────────────────────────── */

function OverviewPanel() {
	return (
		<div className="space-y-8">
			<div>
				<h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-3">
					Definition
				</h3>
				<p className="text-sm leading-7 text-foreground/90">{OVERVIEW_CONTENT.definition}</p>
			</div>

			<div>
				<h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-4">
					In daily life
				</h3>
				<div className="space-y-3">
					{OVERVIEW_CONTENT.dailyLife.map((item) => (
						<div key={item.level} className="flex gap-3 items-start">
							<span className="shrink-0 mt-0.5 text-xs font-bold font-mono text-primary bg-primary/10 rounded px-1.5 py-0.5">
								{item.level}
							</span>
							<p className="text-sm leading-6 text-foreground/85">{item.text}</p>
						</div>
					))}
				</div>
			</div>

			<div className="rounded-xl border border-dashed border-primary/30 bg-primary/[0.03] p-5">
				<div className="flex items-start gap-3">
					<Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
					<div>
						<p className="text-sm font-medium text-foreground mb-1">6 facets compose this trait</p>
						<p className="text-xs leading-5 text-muted-foreground">
							Switch to the Facets tab to see the granular dimensions — imagination, intellect,
							adventurousness, and more.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}

function SpectrumPanel() {
	return (
		<div className="space-y-6">
			<p className="text-sm leading-7 text-muted-foreground">{SPECTRUM_DATA.tagline}</p>

			<div className="space-y-4">
				{SPECTRUM_DATA.levels.map((level) => (
					<div
						key={level.code}
						className="rounded-xl border border-border/60 bg-background p-5 transition-all hover:border-foreground/15"
					>
						<div className="flex items-center justify-between mb-3">
							<div className="flex items-baseline gap-2">
								<span className="text-lg font-heading font-bold text-foreground">{level.label}</span>
								<span className="text-xs font-mono text-muted-foreground/60">({level.code})</span>
							</div>
							<span className="text-xs font-mono text-muted-foreground bg-muted/50 rounded-full px-2 py-0.5">
								{level.pct}
							</span>
						</div>
						<p className="text-sm leading-6 text-foreground/80 mb-4">{level.description}</p>
						<div className="flex flex-wrap gap-2">
							{level.indicators.map((indicator) => (
								<span
									key={indicator}
									className="text-xs bg-muted/40 text-muted-foreground rounded-full px-3 py-1 border border-border/40"
								>
									{indicator}
								</span>
							))}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

function FacetsPanel() {
	return (
		<div className="space-y-4">
			{FACETS_DATA.map((facet) => (
				<div
					key={facet.slug}
					className="rounded-xl border border-border/60 bg-background p-5 transition-all hover:border-foreground/15"
				>
					<div className="flex items-center justify-between mb-2">
						<div className="flex items-center gap-2">
							<span className="text-xs font-mono text-muted-foreground/50">{facet.code}</span>
							<h4 className="text-sm font-semibold text-foreground">{facet.name}</h4>
						</div>
						<Link
							to="/library/facet/$slug"
							params={{ slug: facet.slug }}
							className="text-muted-foreground/40 hover:text-primary transition-colors"
						>
							<ExternalLink className="h-3.5 w-3.5" />
						</Link>
					</div>
					<p className="text-xs leading-5 text-muted-foreground mb-3">{facet.description}</p>
					<FacetScoreBar score={facet.score} name={facet.name} />
				</div>
			))}

			<p className="text-[11px] text-muted-foreground/50 italic text-center pt-2">
				Scores shown are illustrative mock data for the kitchen sink.
			</p>
		</div>
	);
}

function RelatedPanel() {
	return (
		<div className="space-y-6">
			<div>
				<h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-4">
					Related traits
				</h3>
				<div className="space-y-3">
					{RELATED_TRAITS.map((trait) => (
						<Link
							key={trait.slug}
							to="/library/trait/$slug"
							params={{ slug: trait.slug }}
							className="group block rounded-xl border border-border/60 bg-background p-5 transition-all hover:-translate-y-0.5 hover:border-foreground/20"
						>
							<div className="flex items-center justify-between mb-2">
								<h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
									{trait.name}
								</h4>
								<ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary transition-colors" />
							</div>
							<p className="text-xs leading-5 text-muted-foreground">{trait.relationship}</p>
						</Link>
					))}
				</div>
			</div>

			<div>
				<h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-4">
					Compatible archetypes
				</h3>
				<div className="space-y-3">
					{[
						{ name: "The Beacon", slug: "beacon-personality-archetype" },
						{ name: "The Compass", slug: "compass-personality-archetype" },
					].map((archetype) => (
						<Link
							key={archetype.slug}
							to="/library/archetype/$slug"
							params={{ slug: archetype.slug }}
							className="group flex items-center justify-between rounded-xl border border-border/60 bg-background px-5 py-4 transition-all hover:-translate-y-0.5 hover:border-foreground/20"
						>
							<span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
								{archetype.name}
							</span>
							<ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary transition-colors" />
						</Link>
					))}
				</div>
			</div>
		</div>
	);
}

const TAB_PANELS: Record<Tab, () => ReactElement> = {
	Overview: OverviewPanel,
	Spectrum: SpectrumPanel,
	Facets: FacetsPanel,
	Related: RelatedPanel,
};

/* ── Main Page ─────────────────────────────────────────── */

function Redesign3Page() {
	const [activeTab, setActiveTab] = useState<Tab>("Overview");
	const Panel = TAB_PANELS[activeTab];

	return (
		<div className="min-h-screen bg-background">
			{/* ── Dev bar ────────────────────────────────── */}
			<div className="sticky top-0 z-50 flex items-center justify-between border-b bg-background/95 backdrop-blur px-6 py-2">
				<div className="flex items-center gap-3">
					<Link
						to="/dev/components"
						className="text-xs text-muted-foreground hover:text-foreground transition-colors"
					>
						← Kitchen Sink
					</Link>
					<span className="text-xs text-border">/</span>
					<span className="text-xs font-medium text-foreground">
						Redesign 3: Dashboard Knowledge Card
					</span>
				</div>
				<ThemeToggle />
			</div>

			<PageMain className="px-4 py-10 sm:px-6 lg:px-8">
				<div className="mx-auto max-w-5xl">
					{/* ── Compact Header ───────────────────── */}
					<div className="mb-6">
						{/* Breadcrumb */}
						<div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
							<Link to="/library" className="hover:text-foreground transition-colors">
								Library
							</Link>
							<ChevronRight className="h-3 w-3" />
							<Link to="/library" className="hover:text-foreground transition-colors">
								Traits
							</Link>
							<ChevronRight className="h-3 w-3" />
							<span className="text-foreground">Openness</span>
						</div>
					</div>

					{/* ── Main Card ─────────────────────────── */}
					<div className="rounded-2xl border border-border/70 bg-background shadow-sm overflow-hidden">
						{/* Card Header — trait-colored accent bar */}
						<div
							className="h-1.5 w-full"
							style={{ background: "var(--trait-openness, var(--primary))" }}
						/>

						<div className="p-6 sm:p-8 lg:flex lg:gap-8">
							{/* Left: Title + at-a-glance */}
							<div className="lg:w-72 lg:shrink-0 lg:border-r lg:border-border/40 lg:pr-8">
								<p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-2">
									Trait
								</p>
								<h1 className="text-3xl font-heading font-bold tracking-tight text-foreground sm:text-4xl">
									Openness
								</h1>
								<p className="mt-3 text-sm leading-6 text-muted-foreground">
									Curiosity, imagination, and change-seeking across the Big Five spectrum.
								</p>

								{/* At-a-glance stats */}
								<div className="mt-6 space-y-3 border-t border-border/40 pt-6">
									<div className="flex items-center justify-between">
										<span className="text-xs text-muted-foreground">Domain</span>
										<span className="text-xs font-medium text-foreground">OCEAN / Big Five</span>
									</div>
									<div className="flex items-center justify-between">
										<span className="text-xs text-muted-foreground">Facets</span>
										<span className="text-xs font-medium text-foreground">6</span>
									</div>
									<div className="flex items-center justify-between">
										<span className="text-xs text-muted-foreground">Spectrum</span>
										<span className="text-xs font-mono text-foreground">L · M · H</span>
									</div>
									<div className="flex items-center justify-between">
										<span className="text-xs text-muted-foreground">Position</span>
										<span className="text-xs font-medium text-foreground">1st of 5 traits</span>
									</div>
								</div>

								{/* CTA */}
								<Link
									to="/chat"
									className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-foreground px-4 py-3 text-sm font-medium text-background transition-transform hover:-translate-y-0.5 w-full"
								>
									Assess your openness
									<ArrowRight className="h-4 w-4" />
								</Link>

								{/* Quick facet links (compact) */}
								<div className="mt-6 hidden lg:block">
									<p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-3">
										Quick links
									</p>
									<div className="flex flex-wrap gap-1.5">
										{FACETS_DATA.map((facet) => (
											<Link
												key={facet.slug}
												to="/library/facet/$slug"
												params={{ slug: facet.slug }}
												className="text-[11px] text-muted-foreground bg-muted/40 border border-border/40 rounded-full px-2.5 py-1 hover:bg-muted/70 hover:text-foreground transition-colors"
											>
												{facet.name}
											</Link>
										))}
									</div>
								</div>
							</div>

							{/* Right: Tabbed content */}
							<div className="flex-1 min-w-0 mt-8 lg:mt-0">
								{/* Tab bar */}
								<div className="flex items-center gap-1 border-b border-border/50 mb-6">
									{TABS.map((tab) => {
										const isActive = activeTab === tab;
										return (
											<button
												key={tab}
												type="button"
												onClick={() => setActiveTab(tab)}
												className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
													isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground/70"
												}`}
											>
												{tab}
												{isActive ? (
													<span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-primary" />
												) : null}
											</button>
										);
									})}
								</div>

								{/* Tab content */}
								<div className="min-h-[400px]">
									<Panel />
								</div>
							</div>
						</div>
					</div>
				</div>
			</PageMain>
		</div>
	);
}
