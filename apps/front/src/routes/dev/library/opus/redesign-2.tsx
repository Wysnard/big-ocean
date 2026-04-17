import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { ArrowRight, ChevronDown, ChevronRight, Minus, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { PageMain } from "@/components/PageMain";
import { ThemeToggle } from "@/components/ThemeToggle";

export const Route = createFileRoute("/dev/library/opus/redesign-2")({
	beforeLoad: () => {
		if (import.meta.env.PROD) {
			throw redirect({ to: "/" });
		}
	},
	component: Redesign2Page,
});

/* ── Mock content ──────────────────────────────────────── */

const SECTIONS = [
	{
		id: "definition",
		heading: "Scientific definition",
		body:
			"Openness to experience describes how strongly a person is drawn toward novelty, abstraction, imagination, and experimentation. In the Big Five literature it captures more than artistic taste. It includes cognitive flexibility, tolerance for ambiguity, and the degree to which someone prefers the unfamiliar over the established.",
		depth: 0,
	},
	{
		id: "spectrum",
		heading: "Across the spectrum",
		body:
			"Openness isn't binary. The science maps a rich continuum — from people who want ideas to prove themselves in the real world, to those who are magnetically drawn to anything novel, unfinished, or abstract.",
		depth: 1,
	},
	{
		id: "low",
		heading: "Low openness in daily life",
		body:
			"Lower openness often looks like respect for proven methods, concrete language, and a preference for practical solutions that have already survived real-world use. It is less about lacking imagination and more about wanting ideas to prove themselves.",
		depth: 1,
	},
	{
		id: "mid",
		heading: "Mid-range openness in daily life",
		body:
			"Middle-range openness usually shows up as selective curiosity. You are open to new perspectives when they solve a real problem, but you are not automatically persuaded by novelty for its own sake.",
		depth: 2,
	},
	{
		id: "high",
		heading: "High openness in daily life",
		body:
			"Higher openness often brings fast pattern recognition, appetite for experimentation, and comfort living with ideas before they are fully settled. It can make people inventive, exploratory, and more willing to question inherited assumptions.",
		depth: 2,
	},
	{
		id: "facets",
		heading: "Facet breakdown",
		body:
			"The six openness facets explain where curiosity becomes visible in daily life, from imagination and artistic sensitivity to adventurousness and willingness to rethink norms.",
		depth: 3,
	},
	{
		id: "cta",
		heading: "Discover your place",
		body: "",
		depth: 3,
	},
];

const DEPTH_LABELS = ["Surface", "Shallows", "Mid", "Deep"];
const DEPTH_CSS = ["--depth-surface", "--depth-shallows", "--depth-mid", "--depth-deep"];

const SPECTRUM_LEVELS = [
	{
		level: "Low",
		code: "L",
		description: "Practical, grounded, conventional in approach.",
		color: "bg-blue-500/10 border-blue-500/20",
	},
	{
		level: "Mid",
		code: "M",
		description: "Selectively curious, open when it serves a real purpose.",
		color: "bg-primary/10 border-primary/20",
	},
	{
		level: "High",
		code: "H",
		description: "Inventive, exploratory, drawn to abstraction and novelty.",
		color: "bg-violet-500/10 border-violet-500/20",
	},
];

const FACETS = [
	{
		name: "Imagination",
		slug: "imagination",
		description: "How vividly you create inner worlds and possibilities.",
	},
	{
		name: "Artistic Interests",
		slug: "artistic_interests",
		description: "Sensitivity to beauty, pattern, and aesthetic experience.",
	},
	{
		name: "Emotionality",
		slug: "emotionality",
		description: "Awareness and willingness to explore your emotional landscape.",
	},
	{
		name: "Adventurousness",
		slug: "adventurousness",
		description: "Drive to seek novel situations, places, and activities.",
	},
	{
		name: "Intellect",
		slug: "intellect",
		description: "Appetite for abstract ideas, puzzles, and philosophical inquiry.",
	},
	{
		name: "Liberalism",
		slug: "liberalism",
		description: "Readiness to challenge convention and question established norms.",
	},
];

/* ── Progress Rail ─────────────────────────────────────── */

function ProgressRail({ progress, currentDepth }: { progress: number; currentDepth: number }) {
	return (
		<div className="fixed left-6 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col items-center gap-1">
			<div className="relative h-48 w-1 rounded-full bg-border/50 overflow-hidden">
				<div
					className="absolute bottom-0 left-0 right-0 rounded-full bg-primary transition-all duration-500 ease-out"
					style={{ height: `${progress}%` }}
				/>
			</div>
			<span className="mt-2 text-[10px] font-mono text-muted-foreground/60 uppercase tracking-widest">
				{DEPTH_LABELS[currentDepth]}
			</span>
		</div>
	);
}

/* ── Expanding Facet Panel ─────────────────────────────── */

function ExpandingFacetPanel({
	facet,
}: {
	facet: { name: string; slug: string; description: string };
}) {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<div className="border-b border-border/40 last:border-b-0">
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				className="flex w-full items-center justify-between px-6 py-5 text-left transition-colors hover:bg-foreground/[0.02]"
			>
				<span className="text-base font-semibold text-foreground">{facet.name}</span>
				{isOpen ? (
					<Minus className="h-4 w-4 text-muted-foreground" />
				) : (
					<Plus className="h-4 w-4 text-muted-foreground" />
				)}
			</button>
			<div
				className={`overflow-hidden transition-all duration-300 ${
					isOpen ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
				}`}
			>
				<div className="px-6 pb-5">
					<p className="text-sm leading-relaxed text-muted-foreground">{facet.description}</p>
					<Link
						to="/library/facet/$slug"
						params={{ slug: facet.slug }}
						className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
					>
						Read the full facet guide
						<ChevronRight className="h-3 w-3" />
					</Link>
				</div>
			</div>
		</div>
	);
}

/* ── Wave Divider ──────────────────────────────────────── */

function WaveDivider() {
	return (
		<div className="flex items-center justify-center py-4" aria-hidden="true">
			<svg width="120" height="24" viewBox="0 0 120 24" className="text-border/60" aria-hidden="true">
				<path
					d="M0 12 Q15 0 30 12 Q45 24 60 12 Q75 0 90 12 Q105 24 120 12"
					fill="none"
					stroke="currentColor"
					strokeWidth="1.5"
				/>
			</svg>
		</div>
	);
}

/* ── Main Page ─────────────────────────────────────────── */

function Redesign2Page() {
	const [scrollProgress, setScrollProgress] = useState(0);
	const [currentDepth, setCurrentDepth] = useState(0);
	const pageRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		function handleScroll() {
			const scrollTop = window.scrollY;
			const docHeight = document.documentElement.scrollHeight - window.innerHeight;
			const progress = docHeight > 0 ? Math.min((scrollTop / docHeight) * 100, 100) : 0;
			setScrollProgress(progress);

			const depthIndex = Math.min(Math.floor(progress / 25), 3);
			setCurrentDepth(depthIndex);
		}

		window.addEventListener("scroll", handleScroll, { passive: true });
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	return (
		<div ref={pageRef} className="min-h-screen">
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
					<span className="text-xs font-medium text-foreground">Redesign 2: Immersive Depth Scroll</span>
				</div>
				<ThemeToggle />
			</div>

			<ProgressRail progress={scrollProgress} currentDepth={currentDepth} />

			<PageMain>
				{/* ── Section: Hero (Surface) ────────────── */}
				<section
					className="min-h-[80vh] flex flex-col justify-center px-4 sm:px-8 transition-colors duration-700"
					style={{ backgroundColor: `var(${DEPTH_CSS[0]})` }}
				>
					<div className="mx-auto max-w-4xl">
						<div className="flex items-center gap-2 text-xs text-muted-foreground mb-8">
							<Link to="/library" className="hover:text-foreground transition-colors">
								Library
							</Link>
							<ChevronRight className="h-3 w-3" />
							<span>Traits</span>
						</div>

						<p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary mb-4">
							Trait Guide
						</p>
						<h1 className="text-6xl font-heading font-bold tracking-tight text-foreground sm:text-8xl lg:text-9xl">
							Openness
						</h1>
						<p className="mt-8 text-xl leading-9 text-muted-foreground max-w-2xl">
							What openness means in the Big Five model and how curiosity, imagination, and change-seeking
							differ across the spectrum.
						</p>

						<div className="mt-16 flex flex-col items-center text-muted-foreground/40 animate-bounce">
							<span className="text-xs mb-2">Dive deeper</span>
							<ChevronDown className="h-5 w-5" />
						</div>
					</div>
				</section>

				{/* ── Content Sections ───────────────────── */}
				{SECTIONS.filter((s) => s.id !== "cta").map((section, i) => (
					<section
						key={section.id}
						id={section.id}
						className="min-h-[60vh] flex items-center px-4 sm:px-8 py-20 scroll-mt-12 transition-colors duration-700"
						style={{ backgroundColor: `var(${DEPTH_CSS[section.depth]})` }}
					>
						<div className="mx-auto max-w-4xl w-full">
							{/* Depth label */}
							<div className="flex items-center gap-3 mb-8">
								<span className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground/50">
									{DEPTH_LABELS[section.depth]}
								</span>
								<div className="h-px flex-1 bg-border/30" />
							</div>

							<h2 className="text-3xl font-heading font-semibold tracking-tight text-foreground sm:text-4xl mb-6">
								{section.heading}
							</h2>

							{section.body ? (
								<p className="text-lg leading-9 text-foreground/85 max-w-3xl">{section.body}</p>
							) : null}

							{/* Spectrum cards inline */}
							{section.id === "spectrum" ? (
								<div className="mt-10 grid gap-4 sm:grid-cols-3">
									{SPECTRUM_LEVELS.map((row) => (
										<div
											key={row.code}
											className={`rounded-2xl border p-6 ${row.color} transition-transform hover:-translate-y-1`}
										>
											<div className="flex items-baseline gap-2 mb-3">
												<span className="text-xl font-heading font-bold text-foreground">{row.level}</span>
												<span className="text-xs font-mono text-muted-foreground/60">({row.code})</span>
											</div>
											<p className="text-sm leading-relaxed text-foreground/80">{row.description}</p>
										</div>
									))}
								</div>
							) : null}

							{/* Expandable facet panels */}
							{section.id === "facets" ? (
								<div className="mt-10 rounded-2xl border border-border/50 bg-background/50 overflow-hidden">
									{FACETS.map((facet) => (
										<ExpandingFacetPanel key={facet.slug} facet={facet} />
									))}
								</div>
							) : null}

							{/* Wave divider between sections */}
							{i < SECTIONS.length - 2 ? <WaveDivider /> : null}
						</div>
					</section>
				))}

				{/* ── CTA Zone (Deepest) ─────────────────── */}
				<section
					className="min-h-[50vh] flex items-center justify-center px-4 sm:px-8 py-20"
					style={{ backgroundColor: `var(${DEPTH_CSS[3]})` }}
				>
					<div className="mx-auto max-w-2xl text-center">
						<p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary mb-4">
							Free Assessment
						</p>
						<h2 className="text-3xl font-heading font-semibold tracking-tight text-foreground sm:text-5xl">
							Where do you fall on the openness spectrum?
						</h2>
						<p className="mt-6 text-base leading-7 text-muted-foreground max-w-md mx-auto">
							A 30-minute conversation with Nerin reveals your full trait profile, facet detail, and
							archetype — completely free.
						</p>
						<Link
							to="/chat"
							className="mt-8 inline-flex items-center gap-2 rounded-full bg-foreground px-8 py-4 text-base font-medium text-background transition-transform hover:-translate-y-0.5"
						>
							Start the free assessment
							<ArrowRight className="h-4 w-4" />
						</Link>
					</div>
				</section>
			</PageMain>
		</div>
	);
}
