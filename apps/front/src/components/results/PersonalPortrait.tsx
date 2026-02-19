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

interface PersonalPortraitProps {
	personalDescription: string;
	/** When set, shows "{name}'s Portrait" instead of "Your Personality Portrait" */
	displayName?: string | null;
}

export const PersonalPortrait = memo(function PersonalPortrait({
	personalDescription,
	displayName,
}: PersonalPortraitProps) {
	const sections = useMemo(() => splitMarkdownSections(personalDescription), [personalDescription]);

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
					/* Fallback: render raw text if no # or ## sections found */
					<div className="text-sm leading-relaxed text-foreground/80 whitespace-pre-line">
						{personalDescription}
					</div>
				)}
			</CardContent>
		</AccentCard>
	);
});
