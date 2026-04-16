import { Link } from "@tanstack/react-router";
import { letterMarkdownBodyClass } from "@workspace/ui/lib/letter-reading-typography";
import { cn } from "@workspace/ui/lib/utils";
import { memo, useMemo } from "react";
import Markdown from "react-markdown";
import {
	readingMarkdownComponents,
	renderHeader,
	splitMarkdownSections,
} from "./portrait-markdown";

interface PortraitReadingViewProps {
	content: string;
	sessionId: string;
}

/**
 * Full-screen, immersive reading experience for the personality portrait.
 * Shows only the portrait content — no trait cards, radar, OCEAN code, or geometric signature.
 * Story 7.18 AC #10: Portrait-first reveal layout.
 */
export const PortraitReadingView = memo(function PortraitReadingView({
	content,
	sessionId,
}: PortraitReadingViewProps) {
	const sections = useMemo(() => splitMarkdownSections(content), [content]);
	const firstLevel1Index = sections.findIndex((s) => s.level === 1);

	return (
		<div
			data-testid="portrait-reading-mode"
			data-slot="portrait-reading-view"
			className="min-h-[calc(100dvh-3.5rem)] bg-background"
		>
			<article
				aria-labelledby="portrait-reading-title"
				className="mx-auto max-w-[65ch] px-6 py-12 sm:py-16"
			>
				{sections.length > 0 ? (
					sections.map((section, i) => (
						<div key={section.header} className={i > 0 ? "mt-8" : ""}>
							{section.level === 1 ? (
								<div className="mb-6">
									<h1
										{...(i === firstLevel1Index ? { id: "portrait-reading-title" } : {})}
										className="text-2xl sm:text-3xl font-heading font-semibold text-foreground"
									>
										{section.header}
									</h1>
									{section.inscription && (
										<p className="text-base sm:text-lg italic text-foreground/60 mt-1">
											{section.inscription}
										</p>
									)}
								</div>
							) : (
								<h2 className="text-lg sm:text-xl font-heading font-semibold text-foreground mb-3">
									{renderHeader(section.header)}
								</h2>
							)}
							{section.body && (
								<div className={letterMarkdownBodyClass}>
									<Markdown components={readingMarkdownComponents}>{section.body}</Markdown>
								</div>
							)}
							{i < sections.length - 1 && <div className="border-b border-border/20 mt-8" />}
						</div>
					))
				) : (
					<>
						<h1 id="portrait-reading-title" className="sr-only">
							Portrait reading view
						</h1>
						<div className={cn(letterMarkdownBodyClass, "whitespace-pre-line")}>{content}</div>
					</>
				)}

				{/* End-of-letter transition (FR95) */}
				<div className="mt-16 pt-8 border-t border-border/20 text-center">
					<Link
						to="/results/$conversationSessionId"
						params={{ conversationSessionId: sessionId }}
						search={{}}
						data-testid="view-full-profile-btn"
						className="inline-flex min-h-11 min-w-min items-center justify-center rounded-lg px-4 py-2 text-center font-heading text-base text-foreground/60 transition-colors hover:text-foreground/80"
					>
						There's more to see →
					</Link>
				</div>
			</article>
		</div>
	);
});
