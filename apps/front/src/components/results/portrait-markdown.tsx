import type { Components } from "react-markdown";

export interface PortraitSection {
	header: string;
	body: string;
	/** h1 = portrait title, h2 = body sections */
	level: 1 | 2;
}

/**
 * Split markdown content on # and ## headers into individual sections.
 * # (h1) is used for the portrait title, ## (h2) for body sections.
 */
export function splitMarkdownSections(markdown: string): PortraitSection[] {
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
export function renderHeader(header: string) {
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
export const markdownComponents: Components = {
	h3: ({ children }) => (
		<h5 className="text-[0.85rem] font-semibold text-foreground/90 mt-4 mb-1">{children}</h5>
	),
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

/** Relaxed markdown components styled for comfortable reading views. */
export const readingMarkdownComponents: Components = {
	...markdownComponents,
	p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
	blockquote: ({ children }) => (
		<blockquote className="border-l-2 border-primary/30 pl-4 my-4 italic text-foreground/60">
			{children}
		</blockquote>
	),
};
