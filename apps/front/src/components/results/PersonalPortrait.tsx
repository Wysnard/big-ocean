import {
	AccentCard,
	CardAccent,
	CardContent,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card";
import { Sparkles } from "lucide-react";
import { memo, useMemo } from "react";
import type { Components } from "react-markdown";
import Markdown from "react-markdown";

interface PortraitSection {
	header: string;
	body: string;
	/** h1 = The Dive Log title, h2 = body sections */
	level: 1 | 2;
}

/**
 * Split markdown content on # and ## headers into individual sections.
 * # (h1) is used for "The Dive Log" title, ## (h2) for body sections.
 */
function splitMarkdownSections(markdown: string): PortraitSection[] {
	const sections: PortraitSection[] = [];
	const lines = markdown.split("\n");
	let currentSection: PortraitSection | null = null;
	const bodyLines: string[] = [];

	function flushSection() {
		if (currentSection) {
			currentSection.body = bodyLines.join("\n").trim();
			sections.push(currentSection);
			bodyLines.length = 0;
		}
	}

	for (const line of lines) {
		const h1Match = line.match(/^# (?!#)(.+)/);
		const h2Match = line.match(/^## (?!#)(.+)/);

		if (h1Match) {
			flushSection();
			currentSection = { header: h1Match[1].trim(), body: "", level: 1 };
		} else if (h2Match) {
			flushSection();
			currentSection = { header: h2Match[1].trim(), body: "", level: 2 };
		} else if (currentSection) {
			bodyLines.push(line);
		}
	}
	flushSection();

	return sections;
}

/**
 * Strip markdown italic markers (*text*) from header subtitles for clean rendering.
 */
function renderHeader(header: string) {
	const dashIndex = header.indexOf("—");
	if (dashIndex === -1) return header;

	const title = header.slice(0, dashIndex).trim();
	const subtitle = header
		.slice(dashIndex + 1)
		.trim()
		.replace(/^\*|\*$/g, "");

	return (
		<>
			{title} — <span className="italic font-normal text-foreground/60">{subtitle}</span>
		</>
	);
}

/** Custom react-markdown components styled for the portrait card. */
const markdownComponents: Components = {
	p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
	blockquote: ({ children }) => (
		<blockquote className="border-l-2 border-primary/40 pl-3 my-3 italic text-foreground/70">
			{children}
		</blockquote>
	),
	ul: ({ children }) => <ul className="list-disc pl-5 space-y-1 my-2">{children}</ul>,
	ol: ({ children }) => <ol className="list-decimal pl-5 space-y-1 my-2">{children}</ol>,
	li: ({ children }) => <li>{children}</li>,
	strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
	em: ({ children }) => <em className="italic">{children}</em>,
};

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
