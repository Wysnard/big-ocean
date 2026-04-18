/**
 * Vite `?raw` imports are usually a string, but some SSR / bundler paths expose
 * `{ default: string }`, `Buffer`, or `Uint8Array`. Normalize before string ops.
 */
export function normalizeMdxRawSource(value: unknown): string | undefined {
	if (typeof value === "string") {
		return value;
	}
	if (value != null && typeof value === "object" && "default" in value) {
		return normalizeMdxRawSource((value as { default: unknown }).default);
	}
	if (typeof Buffer !== "undefined" && Buffer.isBuffer(value)) {
		return value.toString("utf8");
	}
	if (value instanceof Uint8Array) {
		return new TextDecoder("utf8").decode(value);
	}
	return undefined;
}

/** Strip YAML frontmatter from raw MDX source. */
function stripFrontmatter(source: string): string {
	return source.replace(/^---[\s\S]*?---\s*/, "");
}

/**
 * Estimate reading time from raw MDX (body only; frontmatter excluded).
 * Uses ~200 words per minute; returns at least 1 minute.
 */
export function estimateReadMinutesFromMdxRaw(source: unknown): number {
	const textSource = normalizeMdxRawSource(source);
	if (!textSource) {
		return 1;
	}
	const withoutFm = stripFrontmatter(textSource);
	const noCodeBlocks = withoutFm.replace(/```[\s\S]*?```/g, " ");
	const text = noCodeBlocks
		.replace(/<[^>]+>/g, " ")
		.replace(/[#*_`[\]()]/g, " ")
		.replace(/\s+/g, " ")
		.trim();
	const words = text.split(/\s+/).filter(Boolean).length;
	if (words === 0) {
		return 1;
	}
	return Math.max(1, Math.round(words / 200));
}

/**
 * First paragraph of text under the Overview `h2` (verbatim prose), for archetype hero pull-quotes.
 */
export function extractArchetypeOverviewFirstParagraph(rawMdx: unknown): string | null {
	const textSource = normalizeMdxRawSource(rawMdx);
	if (!textSource) {
		return null;
	}
	const body = stripFrontmatter(textSource);
	const match = body.match(/<h2[^>]*id=["']overview["'][^>]*>[\s\S]*?<\/h2>\s*([\s\S]*?)(?=<h2\s)/i);
	if (!match) {
		return null;
	}
	const chunk = match[1]?.trim() ?? "";
	const firstPara = chunk.split(/\n\s*\n/)[0]?.trim() ?? chunk;
	const text = firstPara.replace(/<[^>]+>/g, "").trim();
	return text.length ? text : null;
}

export function archetypeShortNameFromTitle(title: string): string {
	const withoutThe = title.replace(/^The\s+/i, "").trim();
	return withoutThe.split(/\s+/)[0] ?? title;
}
