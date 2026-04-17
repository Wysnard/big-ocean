import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { ArrowRight, BookOpen, ChevronRight, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { PageMain } from "@/components/PageMain";
import { ThemeToggle } from "@/components/ThemeToggle";

export const Route = createFileRoute("/dev/library/opus/redesign-1")({
	beforeLoad: () => {
		if (import.meta.env.PROD) {
			throw redirect({ to: "/" });
		}
	},
	component: Redesign1Page,
});

/* ── Mock content ──────────────────────────────────────── */

const MOCK_ARTICLE = {
	tier: "trait" as const,
	title: "Openness",
	subtitle: "Trait Guide",
	description:
		"What openness means in the Big Five model and how curiosity, imagination, and change-seeking differ across the spectrum.",
	sections: [
		{
			id: "definition",
			heading: "Scientific definition",
			body:
				"Openness to experience describes how strongly a person is drawn toward novelty, abstraction, imagination, and experimentation. In the Big Five literature it captures more than artistic taste. It includes cognitive flexibility, tolerance for ambiguity, and the degree to which someone prefers the unfamiliar over the established.",
		},
		{
			id: "low",
			heading: "Low openness in daily life",
			body:
				"Lower openness often looks like respect for proven methods, concrete language, and a preference for practical solutions that have already survived real-world use. It is less about lacking imagination and more about wanting ideas to prove themselves.",
			pullQuote: "It's not a lack of imagination — it's a demand for proof.",
		},
		{
			id: "mid",
			heading: "Mid-range openness in daily life",
			body:
				"Middle-range openness usually shows up as selective curiosity. You are open to new perspectives when they solve a real problem, but you are not automatically persuaded by novelty for its own sake.",
		},
		{
			id: "high",
			heading: "High openness in daily life",
			body:
				"Higher openness often brings fast pattern recognition, appetite for experimentation, and comfort living with ideas before they are fully settled. It can make people inventive, exploratory, and more willing to question inherited assumptions.",
			pullQuote:
				"The comfort of sitting with an unfinished idea — that's the high-openness superpower.",
		},
		{
			id: "facets",
			heading: "Facet breakdown",
			body:
				"The six openness facets explain where curiosity becomes visible in daily life, from imagination and artistic sensitivity to adventurousness and willingness to rethink norms.",
		},
	],
	spectrum: [
		{
			level: "Low",
			code: "L",
			description: "Practical, grounded, conventional in approach.",
		},
		{
			level: "Mid",
			code: "M",
			description: "Selectively curious, open when it serves a real purpose.",
		},
		{
			level: "High",
			code: "H",
			description: "Inventive, exploratory, drawn to abstraction and novelty.",
		},
	],
	facets: [
		{ name: "Imagination", slug: "imagination" },
		{ name: "Artistic Interests", slug: "artistic_interests" },
		{ name: "Emotionality", slug: "emotionality" },
		{ name: "Adventurousness", slug: "adventurousness" },
		{ name: "Intellect", slug: "intellect" },
		{ name: "Liberalism", slug: "liberalism" },
	],
};

/* ── Floating Table of Contents ────────────────────────── */

function FloatingTOC({
	sections,
	activeId,
}: {
	sections: Array<{ id: string; heading: string }>;
	activeId: string;
}) {
	return (
		<nav
			aria-label="Article table of contents"
			className="hidden xl:block fixed right-8 top-1/2 -translate-y-1/2 z-40"
		>
			<div className="flex flex-col gap-1.5">
				{sections.map((section) => {
					const isActive = activeId === section.id;
					return (
						<a
							key={section.id}
							href={`#${section.id}`}
							className="group flex items-center gap-3 transition-all duration-200"
						>
							<span
								className={`block h-px transition-all duration-300 ${
									isActive
										? "w-8 bg-foreground"
										: "w-4 bg-border group-hover:w-6 group-hover:bg-foreground/50"
								}`}
							/>
							<span
								className={`text-xs transition-colors duration-200 ${
									isActive
										? "text-foreground font-medium"
										: "text-muted-foreground/60 group-hover:text-muted-foreground"
								}`}
							>
								{section.heading}
							</span>
						</a>
					);
				})}
			</div>
		</nav>
	);
}

/* ── Pull Quote ────────────────────────────────────────── */

function PullQuote({ children }: { children: string }) {
	return (
		<blockquote className="relative my-12 py-6 pl-8 pr-4">
			<div className="absolute left-0 top-0 bottom-0 w-1 rounded-full bg-gradient-to-b from-primary via-primary/60 to-transparent" />
			<p className="text-2xl font-heading font-medium leading-snug tracking-tight text-foreground/80 italic sm:text-3xl">
				"{children}"
			</p>
		</blockquote>
	);
}

/* ── Inline Spectrum Callout ───────────────────────────── */

function SpectrumCallout({
	spectrum,
}: {
	spectrum: Array<{ level: string; code: string; description: string }>;
}) {
	return (
		<div className="my-12 rounded-2xl border border-border/60 bg-muted/30 p-6 sm:p-8">
			<div className="flex items-center gap-2 mb-6">
				<Sparkles className="h-4 w-4 text-primary" />
				<h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
					Across the spectrum
				</h3>
			</div>
			<div className="grid gap-4 sm:grid-cols-3">
				{spectrum.map((row) => (
					<div
						key={row.code}
						className="rounded-xl border border-border/50 bg-background p-5 transition-transform hover:-translate-y-0.5"
					>
						<div className="flex items-baseline gap-2 mb-2">
							<span className="text-lg font-heading font-bold text-foreground">{row.level}</span>
							<span className="text-xs font-mono text-muted-foreground/70">({row.code})</span>
						</div>
						<p className="text-sm leading-relaxed text-foreground/80">{row.description}</p>
					</div>
				))}
			</div>
		</div>
	);
}

/* ── Facet Grid Callout ────────────────────────────────── */

function FacetGridCallout({ facets }: { facets: Array<{ name: string; slug: string }> }) {
	return (
		<div className="my-12 rounded-2xl border border-border/60 bg-muted/30 p-6 sm:p-8">
			<div className="flex items-center gap-2 mb-6">
				<BookOpen className="h-4 w-4 text-primary" />
				<h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
					Six facets of openness
				</h3>
			</div>
			<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
				{facets.map((facet) => (
					<Link
						key={facet.slug}
						to="/library/facet/$slug"
						params={{ slug: facet.slug }}
						className="group flex items-center justify-between rounded-xl border border-border/50 bg-background px-5 py-4 transition-all hover:-translate-y-0.5 hover:border-foreground/20"
					>
						<span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
							{facet.name}
						</span>
						<ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
					</Link>
				))}
			</div>
		</div>
	);
}

/* ── Mid-Article CTA ───────────────────────────────────── */

function MidArticleCTA() {
	return (
		<div className="my-16 relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-primary/[0.06] via-background to-primary/[0.10] p-8 sm:p-12">
			<div className="relative z-10">
				<p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground mb-3">
					Free Assessment
				</p>
				<h3 className="text-2xl font-heading font-semibold tracking-tight text-foreground sm:text-3xl max-w-lg">
					Where do you fall on the openness spectrum?
				</h3>
				<p className="mt-3 text-sm leading-6 text-muted-foreground max-w-md">
					Take the free assessment to see your trait profile, facet breakdown, and archetype — no
					paywall.
				</p>
				<Link
					to="/chat"
					className="mt-6 inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-transform hover:-translate-y-0.5"
				>
					Start the free assessment
					<ArrowRight className="h-4 w-4" />
				</Link>
			</div>
			<div className="absolute -right-16 -bottom-16 h-64 w-64 rounded-full bg-primary/[0.04] blur-3xl" />
		</div>
	);
}

/* ── Main Page ─────────────────────────────────────────── */

function Redesign1Page() {
	const [activeSection, setActiveSection] = useState(MOCK_ARTICLE.sections[0].id);
	const observerRef = useRef<IntersectionObserver | null>(null);

	useEffect(() => {
		observerRef.current = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						setActiveSection(entry.target.id);
					}
				}
			},
			{ rootMargin: "-30% 0px -60% 0px" },
		);

		for (const section of MOCK_ARTICLE.sections) {
			const el = document.getElementById(section.id);
			if (el) observerRef.current.observe(el);
		}

		return () => observerRef.current?.disconnect();
	}, []);

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
					<span className="text-xs font-medium text-foreground">Redesign 1: Magazine Editorial</span>
				</div>
				<ThemeToggle />
			</div>

			{/* ── Floating TOC ───────────────────────────── */}
			<FloatingTOC sections={MOCK_ARTICLE.sections} activeId={activeSection} />

			{/* ── Hero ───────────────────────────────────── */}
			<PageMain className="relative">
				<header className="relative overflow-hidden bg-gradient-to-b from-primary/[0.04] via-background to-background px-4 pb-16 pt-20 sm:px-6 sm:pb-24 sm:pt-28">
					<div className="mx-auto max-w-3xl">
						{/* Breadcrumb */}
						<div className="flex items-center gap-2 text-xs text-muted-foreground mb-8">
							<Link to="/library" className="hover:text-foreground transition-colors">
								Library
							</Link>
							<ChevronRight className="h-3 w-3" />
							<span>Traits</span>
							<ChevronRight className="h-3 w-3" />
							<span className="text-foreground">{MOCK_ARTICLE.title}</span>
						</div>

						{/* Kicker */}
						<p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary mb-4">
							{MOCK_ARTICLE.subtitle}
						</p>

						{/* Title */}
						<h1 className="text-5xl font-heading font-bold tracking-tight text-foreground sm:text-7xl">
							{MOCK_ARTICLE.title}
						</h1>

						{/* Description */}
						<p className="mt-6 text-lg leading-8 text-muted-foreground max-w-2xl">
							{MOCK_ARTICLE.description}
						</p>

						{/* Decorative line */}
						<div className="mt-12 h-px bg-gradient-to-r from-border via-primary/30 to-transparent" />
					</div>
				</header>

				{/* ── Article body ────────────────────────── */}
				<div className="px-4 sm:px-6 pb-24">
					<div className="mx-auto max-w-3xl">
						{MOCK_ARTICLE.sections.map((section, i) => (
							<section key={section.id} id={section.id} className="scroll-mt-20">
								<h2 className="mt-16 mb-6 text-2xl font-heading font-semibold tracking-tight text-foreground sm:text-3xl">
									{section.heading}
								</h2>
								<p className="text-base leading-8 text-foreground/85">{section.body}</p>

								{"pullQuote" in section && section.pullQuote ? (
									<PullQuote>{section.pullQuote}</PullQuote>
								) : null}

								{/* Insert spectrum after "definition" section */}
								{section.id === "definition" ? <SpectrumCallout spectrum={MOCK_ARTICLE.spectrum} /> : null}

								{/* Insert facet grid in the "facets" section */}
								{section.id === "facets" ? <FacetGridCallout facets={MOCK_ARTICLE.facets} /> : null}

								{/* Mid-article CTA after the "high" section */}
								{section.id === "high" ? <MidArticleCTA /> : null}

								{/* Section divider (except last) */}
								{i < MOCK_ARTICLE.sections.length - 1 && section.id !== "high" ? (
									<div className="mt-12 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
								) : null}
							</section>
						))}
					</div>
				</div>
			</PageMain>
		</div>
	);
}
