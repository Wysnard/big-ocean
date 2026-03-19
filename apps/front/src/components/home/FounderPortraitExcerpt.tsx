import Markdown from "react-markdown";
import { OceanShapeSet } from "../ocean-shapes/OceanShapeSet";
import {
	markdownComponents,
	renderHeader,
	splitMarkdownSections,
} from "../results/portrait-markdown";
import portraitExcerpt from "./portrait-excerpt.md?raw";

/**
 * Curated excerpt from Vincent's real portrait, displayed as a personal artifact.
 * Uses the first section of portrait-excerpt.md ("The Selective Gate") to show
 * the depth and specificity of a Nerin portrait — not a product demo, a real thing.
 */
export function FounderPortraitExcerpt() {
	const sections = splitMarkdownSections(portraitExcerpt).filter((s) => s.level === 2);
	// Use only the first section for the excerpt — concise but impactful
	const excerpt = sections[0];

	if (!excerpt) return null;

	return (
		<div
			data-slot="founder-portrait-excerpt"
			data-testid="founder-portrait-excerpt"
			className="mt-4 overflow-hidden rounded-xl border border-[var(--embed-border)] bg-[var(--embed-bg)] backdrop-blur-[4px] transition-[background,border-color] duration-[350ms]"
		>
			{/* Header — big-ocean branding to signal "this is a real portrait" */}
			<div className="flex items-center gap-1.5 border-b border-[var(--embed-border)] px-5 py-2.5">
				<span className="font-heading text-[.72rem] font-black tracking-wider text-foreground">
					big-
				</span>
				<OceanShapeSet size={11} />
				<span className="ml-auto font-mono text-[.6rem] tracking-[.06em] text-muted-foreground">
					Vincent&rsquo;s portrait
				</span>
			</div>

			{/* Portrait section content */}
			<div className="space-y-2 px-5 py-4">
				<h4 className="text-sm font-semibold text-foreground">{renderHeader(excerpt.header)}</h4>
				{excerpt.body && (
					<div className="text-sm leading-relaxed text-foreground/80">
						<Markdown components={markdownComponents}>{excerpt.body}</Markdown>
					</div>
				)}
			</div>
		</div>
	);
}
