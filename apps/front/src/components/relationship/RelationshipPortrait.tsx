/**
 * RelationshipPortrait Component (Story 35-3)
 *
 * Renders relationship analysis content using the Portrait Spine Renderer
 * pattern (reused from Epic 3's PersonalPortrait). Displays markdown content
 * split into sections with proper heading hierarchy.
 */

import {
	AccentCard,
	CardAccent,
	CardContent,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card";
import { Heart } from "lucide-react";
import { memo, useMemo } from "react";
import Markdown from "react-markdown";
import {
	markdownComponents,
	renderHeader,
	splitMarkdownSections,
} from "../results/portrait-markdown";

interface RelationshipPortraitProps {
	/** Full analysis markdown content */
	content: string;
	/** Name of user A */
	userAName: string;
	/** Name of user B */
	userBName: string;
	/** Whether this analysis is based on both users' latest results */
	isLatestVersion: boolean;
}

export const RelationshipPortrait = memo(function RelationshipPortrait({
	content,
	userAName,
	userBName,
	isLatestVersion,
}: RelationshipPortraitProps) {
	const sections = useMemo(() => splitMarkdownSections(content), [content]);

	return (
		<AccentCard
			data-testid="relationship-portrait"
			data-slot="relationship-portrait"
			className="col-span-full"
		>
			{/* Dual-tone accent bar */}
			<CardAccent
				style={{
					background:
						"linear-gradient(90deg, var(--trait-openness), var(--trait-agreeableness), var(--trait-extraversion))",
				}}
			/>

			<CardHeader className="pt-6">
				<div className="flex items-center gap-2">
					<Heart className="w-5 h-5 text-primary" />
					<div>
						<CardTitle className="text-lg font-display">
							{userAName} & {userBName}
						</CardTitle>
						<p className="text-sm text-muted-foreground mt-1">A portrait of your relationship dynamic</p>
					</div>
				</div>
				{!isLatestVersion && (
					<span className="mt-2 inline-block rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
						Previous version
					</span>
				)}
			</CardHeader>

			<CardContent className="pb-6 space-y-6">
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
					<div className="text-sm leading-relaxed text-foreground/80 whitespace-pre-line">{content}</div>
				)}
			</CardContent>
		</AccentCard>
	);
});
