/**
 * TeaserPortrait Component (Story 12.3)
 *
 * Renders the teaser Opening section as readable markdown followed by
 * a warm "Reveal Full Portrait" CTA — presented as a gift, not a gate.
 */

import { Button } from "@workspace/ui/components/button";
import {
	AccentCard,
	CardAccent,
	CardContent,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card";
import { Sparkles } from "lucide-react";
import { memo, useMemo } from "react";
import Markdown from "react-markdown";
import { markdownComponents, renderHeader, splitMarkdownSections } from "./portrait-markdown";

interface TeaserPortraitProps {
	teaserContent: string;
	onUnlock: () => void;
}

export const TeaserPortrait = memo(function TeaserPortrait({
	teaserContent,
	onUnlock,
}: TeaserPortraitProps) {
	const sections = useMemo(() => splitMarkdownSections(teaserContent), [teaserContent]);

	return (
		<AccentCard data-testid="teaser-portrait" data-slot="teaser-portrait" className="col-span-full">
			{/* Rainbow accent bar */}
			<CardAccent
				style={{
					background:
						"linear-gradient(90deg, var(--trait-openness), var(--trait-conscientiousness), var(--trait-extraversion), var(--trait-agreeableness), var(--trait-neuroticism))",
				}}
			/>

			<CardHeader className="pt-6">
				<div className="flex items-center gap-2">
					<Sparkles className="w-5 h-5 text-primary" />
					<div>
						<CardTitle className="text-lg font-display">Your Personality Portrait</CardTitle>
						<p className="text-sm text-muted-foreground mt-1">
							A preview of what Nerin discovered about you
						</p>
					</div>
				</div>
			</CardHeader>

			<CardContent className="pb-6 space-y-6">
				{/* Opening section content */}
				{sections.length > 0 ? (
					sections.map((section, i) => (
						<div key={section.header} className="space-y-2">
							{section.level === 1 ? (
								<h3 className="text-base font-semibold text-foreground">{section.header}</h3>
							) : (
								<h4 className="text-sm font-semibold text-foreground">{renderHeader(section.header)}</h4>
							)}
							{section.body && (
								<div className="text-sm leading-relaxed text-foreground/80">
									<Markdown components={markdownComponents}>{section.body}</Markdown>
								</div>
							)}
							{i < sections.length - 1 && <div className="border-b border-border/30 pt-2" />}
						</div>
					))
				) : (
					<div className="text-sm leading-relaxed text-foreground/80 whitespace-pre-line">
						{teaserContent}
					</div>
				)}

				{/* Reveal Full Portrait CTA */}
				<div className="flex flex-col items-center gap-3 pt-6">
					<p className="text-sm text-muted-foreground text-center max-w-sm">
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
			</CardContent>
		</AccentCard>
	);
});
