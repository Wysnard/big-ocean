/**
 * TeaserPortraitReadingView Component (Story 12.3)
 *
 * Focused reading view for teaser portrait — shows teaser content
 * followed by locked sections and CTA. No trait scores or evidence.
 */

import { Button } from "@workspace/ui/components/button";
import { ArrowRight, Lock, Sparkles } from "lucide-react";
import { memo, useMemo } from "react";
import Markdown from "react-markdown";
import {
	LOCKED_SECTION_PLACEHOLDER_LINES,
	readingMarkdownComponents,
	renderHeader,
	splitMarkdownSections,
} from "./portrait-markdown";

interface TeaserPortraitReadingViewProps {
	teaserContent: string;
	lockedSectionTitles: string[];
	onUnlock: () => void;
	onViewFullProfile: () => void;
}

export const TeaserPortraitReadingView = memo(function TeaserPortraitReadingView({
	teaserContent,
	lockedSectionTitles,
	onUnlock,
	onViewFullProfile,
}: TeaserPortraitReadingViewProps) {
	const sections = useMemo(() => splitMarkdownSections(teaserContent), [teaserContent]);

	return (
		<div
			data-testid="portrait-reading-mode"
			data-slot="portrait-reading-view"
			className="min-h-[calc(100dvh-3.5rem)] bg-background"
		>
			<article className="mx-auto max-w-[720px] px-6 py-12 sm:py-16">
				{/* Opening section */}
				{sections.length > 0 ? (
					sections.map((section, i) => (
						<div key={section.header} className={i > 0 ? "mt-8" : ""}>
							{section.level === 1 ? (
								<h1 className="text-2xl sm:text-3xl font-heading font-semibold text-foreground mb-4">
									{section.header}
								</h1>
							) : (
								<h2 className="text-lg sm:text-xl font-heading font-semibold text-foreground mb-3">
									{renderHeader(section.header)}
								</h2>
							)}
							{section.body && (
								<div className="text-base leading-[1.7] text-foreground/80">
									<Markdown components={readingMarkdownComponents}>{section.body}</Markdown>
								</div>
							)}
						</div>
					))
				) : (
					<div className="text-base leading-[1.7] text-foreground/80 whitespace-pre-line">
						{teaserContent}
					</div>
				)}

				{/* Locked sections */}
				<div className="mt-12 space-y-4">
					{lockedSectionTitles.map((title, i) => (
						<div
							key={title}
							data-testid="locked-section"
							className="relative rounded-lg border border-border/40 bg-muted/30 backdrop-blur-sm p-6 overflow-hidden"
						>
							<div className="flex items-center gap-2 mb-3">
								<Lock className="w-4 h-4 text-muted-foreground/60" />
								<h3 className="text-base font-heading font-semibold text-foreground/70">{title}</h3>
							</div>
							<div className="select-none" aria-hidden="true">
								<p className="text-sm text-foreground/40 blur-[6px] leading-relaxed">
									{LOCKED_SECTION_PLACEHOLDER_LINES[i % LOCKED_SECTION_PLACEHOLDER_LINES.length]}
								</p>
							</div>
							<div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-muted/60 pointer-events-none" />
						</div>
					))}
				</div>

				{/* CTA */}
				<div className="mt-10 flex justify-center">
					<Button
						data-testid="reveal-portrait-cta"
						onClick={onUnlock}
						size="lg"
						className="bg-primary text-primary-foreground hover:bg-primary/90 font-display"
					>
						<Sparkles className="w-4 h-4 mr-2" />
						Reveal Full Portrait
					</Button>
				</div>

				{/* Back to profile */}
				<div className="mt-16 pt-8 border-t border-border/20 text-center">
					<button
						type="button"
						onClick={onViewFullProfile}
						data-testid="view-full-profile-btn"
						className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-heading text-base"
					>
						See your full personality profile
						<ArrowRight className="w-4 h-4" />
					</button>
				</div>
			</article>
		</div>
	);
});
