import { ArrowRight } from "lucide-react";
import { memo, useMemo } from "react";
import Markdown from "react-markdown";
import {
	readingMarkdownComponents,
	renderHeader,
	splitMarkdownSections,
} from "./portrait-markdown";

interface PortraitReadingViewProps {
	personalDescription: string;
	onViewFullProfile: () => void;
}

/**
 * Full-screen, immersive reading experience for the personality portrait.
 * Shows only the portrait content — no trait cards, radar, OCEAN code, or geometric signature.
 * Story 7.18 AC #10: Portrait-first reveal layout.
 */
export const PortraitReadingView = memo(function PortraitReadingView({
	personalDescription,
	onViewFullProfile,
}: PortraitReadingViewProps) {
	const sections = useMemo(() => splitMarkdownSections(personalDescription), [personalDescription]);

	return (
		<div
			data-testid="portrait-reading-mode"
			data-slot="portrait-reading-view"
			className="min-h-[calc(100dvh-3.5rem)] bg-background"
		>
			<article className="mx-auto max-w-[720px] px-6 py-12 sm:py-16">
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
							{i < sections.length - 1 && <div className="border-b border-border/20 mt-8" />}
						</div>
					))
				) : (
					<div className="text-base leading-[1.7] text-foreground/80 whitespace-pre-line">
						{personalDescription}
					</div>
				)}

				{/* Transition to full profile */}
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
