/**
 * Section A — letter register reading surface (Story 7.3)
 */

import { letterRelationshipBodyWrapClass } from "@workspace/ui/lib/letter-reading-typography";
import { Heart } from "lucide-react";
import { memo, useMemo } from "react";
import Markdown from "react-markdown";
import {
	markdownComponents,
	renderHeader,
	splitMarkdownSections,
} from "@/components/results/portrait-markdown";

interface RelationshipLetterBodyProps {
	readonly content: string;
	readonly userAName: string;
	readonly userBName: string;
	readonly isLatestVersion: boolean;
}

export const RelationshipLetterBody = memo(function RelationshipLetterBody({
	content,
	userAName,
	userBName,
	isLatestVersion,
}: RelationshipLetterBodyProps) {
	const sections = useMemo(() => splitMarkdownSections(content), [content]);

	return (
		<div data-slot="relationship-letter-body" data-testid="relationship-letter-body">
			<header className="mb-8 border-b border-border/20 pb-6">
				<div className="flex items-center gap-2 text-primary">
					<Heart className="size-5" aria-hidden />
					<p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
						This year&apos;s letter
					</p>
				</div>
				<h2 className="mt-3 font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
					{userAName} & {userBName}
				</h2>
				<p className="mt-2 text-sm text-muted-foreground">
					A letter about your dynamic — written to be read slowly, together.
				</p>
				{!isLatestVersion && (
					<p className="mt-3 text-xs text-muted-foreground">
						This letter reflects an earlier chapter for one or both of you.
					</p>
				)}
			</header>

			<div className={letterRelationshipBodyWrapClass}>
				{sections.length > 0 ? (
					sections.map((section, i) => (
						<div key={`${section.header}-${i}`} className={i > 0 ? "mt-8" : ""}>
							{section.level === 1 ? (
								<h3 className="text-xl font-heading font-semibold text-foreground">{section.header}</h3>
							) : (
								<h4 className="text-lg font-heading font-semibold text-foreground">
									{renderHeader(section.header)}
								</h4>
							)}
							{section.body && (
								<div className="mt-3">
									<Markdown components={markdownComponents}>{section.body}</Markdown>
								</div>
							)}
						</div>
					))
				) : (
					<div className="whitespace-pre-line">{content}</div>
				)}
			</div>
		</div>
	);
});
