import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import type { LibraryTier } from "@/lib/library-content";

const DEFAULT_CTA_COPY: Record<LibraryTier, string> = {
	archetype: "Discover your archetype in 30 minutes",
	trait: "Where do you fall on the spectrum? Find out free",
	facet: "See how the finer-grained facets show up in you",
	science: "See the Big Five in action with the free assessment",
	guides: "Turn reflection into a clearer self-portrait",
};

interface AssessmentCTAProps {
	tier: LibraryTier;
	ctaText?: string;
}

export function AssessmentCTA({ tier, ctaText }: AssessmentCTAProps) {
	const copy = ctaText ?? DEFAULT_CTA_COPY[tier];

	return (
		<section
			data-testid="library-assessment-cta"
			className="rounded-[2rem] border border-border/70 bg-linear-to-br from-[#eef6ff] via-background to-[#fff7ed] px-6 py-8 shadow-sm"
		>
			<p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
				Free Assessment
			</p>
			<h2 className="mt-3 max-w-2xl text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
				{copy}
			</h2>
			<p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
				Get your archetype, trait profile, and facet-level detail without hitting a paywall.
			</p>
			<Link
				to="/chat"
				data-testid="library-assessment-cta-button"
				className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-medium text-background transition-transform hover:-translate-y-0.5"
			>
				Start the free assessment
				<ArrowRight className="h-4 w-4" />
			</Link>
		</section>
	);
}
