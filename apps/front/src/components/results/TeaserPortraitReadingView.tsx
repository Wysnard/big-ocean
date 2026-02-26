/**
 * TeaserPortraitReadingView Component (Story 12.3)
 *
 * Focused reading view for teaser portrait — shows teaser content
 * followed by a warm CTA to reveal the full portrait. No trait scores or evidence.
 */

import { Button } from "@workspace/ui/components/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { memo, useMemo } from "react";
import Markdown from "react-markdown";
import {
	readingMarkdownComponents,
	renderHeader,
	splitMarkdownSections,
} from "./portrait-markdown";

interface TeaserPortraitReadingViewProps {
	teaserContent: string;
	onUnlock: () => void;
	onViewFullProfile: () => void;
}

export const TeaserPortraitReadingView = memo(function TeaserPortraitReadingView({
	teaserContent,
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

				{/* CTA */}
				<div className="mt-12 flex flex-col items-center gap-3">
					<p className="text-base text-muted-foreground text-center max-w-md">
						There's more Nerin wants to tell you — the full portrait goes deeper.
					</p>
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
