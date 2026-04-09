import type { PortraitStatus } from "@workspace/contracts";
import { Button } from "@workspace/ui/components/button";
import {
	AccentCard,
	CardAccent,
	CardContent,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card";
import { OceanSkeleton } from "@workspace/ui/components/ocean-skeleton";
import { RefreshCw, Sparkles } from "lucide-react";
import { memo, useMemo } from "react";
import Markdown from "react-markdown";
import { markdownComponents, renderHeader, splitMarkdownSections } from "./portrait-markdown";

interface PersonalPortraitProps {
	/** When set, shows "{name}'s Portrait" instead of "Your Personality Portrait" */
	displayName?: string | null;
	/** Full portrait content when available (Story 13.3) */
	fullPortraitContent?: string | null;
	/** Full portrait generation status (Story 13.3) */
	fullPortraitStatus?: PortraitStatus;
	/** Callback to retry failed portrait generation (Story 13.3) */
	onRetryPortrait?: () => void;
}

export const PersonalPortrait = memo(function PersonalPortrait({
	displayName,
	fullPortraitContent,
	fullPortraitStatus,
	onRetryPortrait,
}: PersonalPortraitProps) {
	const content = fullPortraitContent ?? "";
	const sections = useMemo(() => splitMarkdownSections(content), [content]);

	const isGenerating = fullPortraitStatus === "generating";
	const isFailed = fullPortraitStatus === "failed";

	return (
		<AccentCard data-slot="personal-portrait" className="col-span-full">
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
						<CardTitle className="text-lg font-display">
							{displayName ? `${displayName}\u2019s Personality Portrait` : "Your Personality Portrait"}
						</CardTitle>
						<p className="text-sm text-muted-foreground mt-1">
							Patterns discovered from your conversation with Nerin
						</p>
					</div>
				</div>
			</CardHeader>

			<CardContent className="pb-6 space-y-6">
				{/* Generating state */}
				{isGenerating && (
					<div className="flex flex-col items-center justify-center py-8 gap-4">
						<OceanSkeleton autoReveal size={36} aria-label="Generating portrait" />
						<div className="text-center">
							<p className="text-sm font-medium text-foreground">Generating your portrait...</p>
							<p className="text-xs text-muted-foreground mt-1">This may take a minute</p>
						</div>
					</div>
				)}

				{/* Failed state */}
				{isFailed && (
					<div className="flex flex-col items-center justify-center py-8 gap-4">
						<div className="text-center">
							<p className="text-sm font-medium text-foreground">Portrait generation failed</p>
							<p className="text-xs text-muted-foreground mt-1">Please try again</p>
						</div>
						{onRetryPortrait && (
							<Button variant="outline" size="sm" onClick={onRetryPortrait} className="gap-2">
								<RefreshCw className="w-4 h-4" />
								Retry
							</Button>
						)}
					</div>
				)}

				{/* Portrait content */}
				{!isGenerating && !isFailed && (
					<article
						aria-label={
							displayName ? `${displayName}\u2019s Personality Portrait` : "Your Personality Portrait"
						}
					>
						{sections.length > 0 ? (
							sections.map((section, i) => (
								<div key={section.header} className="space-y-2">
									{section.level === 1 ? (
										<div>
											<h3 className="text-base font-semibold text-foreground">{section.header}</h3>
											{section.inscription && (
												<p className="text-sm italic text-foreground/60 mt-0.5">{section.inscription}</p>
											)}
										</div>
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
							/* Fallback: render raw text if no # or ## sections found */
							<div className="text-sm leading-relaxed text-foreground/80 whitespace-pre-line">
								{content}
							</div>
						)}
					</article>
				)}
			</CardContent>
		</AccentCard>
	);
});
