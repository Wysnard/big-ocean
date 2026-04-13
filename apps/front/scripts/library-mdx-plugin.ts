import type { Plugin } from "vite";

const FRONTMATTER_REGEX = /^---\n([\s\S]*?)\n---\n?/;

function stripWrappingQuotes(value: string) {
	if (
		(value.startsWith('"') && value.endsWith('"')) ||
		(value.startsWith("'") && value.endsWith("'"))
	) {
		return value.slice(1, -1);
	}

	return value;
}

function parseFrontmatter(source: string, id: string) {
	const match = source.match(FRONTMATTER_REGEX);

	if (!match) {
		throw new Error(`Missing frontmatter block in ${id}`);
	}

	const frontmatter: Record<string, string> = {};

	for (const line of match[1].split("\n")) {
		const trimmedLine = line.trim();

		if (!trimmedLine) {
			continue;
		}

		const separatorIndex = trimmedLine.indexOf(":");

		if (separatorIndex === -1) {
			throw new Error(`Invalid frontmatter line "${trimmedLine}" in ${id}`);
		}

		const key = trimmedLine.slice(0, separatorIndex).trim();
		const value = stripWrappingQuotes(trimmedLine.slice(separatorIndex + 1).trim());

		frontmatter[key] = value;
	}

	return {
		frontmatter,
		content: source.slice(match[0].length).trim(),
	};
}

export function libraryMdxPlugin(): Plugin {
	return {
		name: "library-mdx-plugin",
		enforce: "pre",
		transform(source, id) {
			if (!id.endsWith(".mdx") || !id.includes("/src/content/library/")) {
				return null;
			}

			const { frontmatter, content } = parseFrontmatter(source, id);

			return {
				code: `
import ReactMarkdown from "react-markdown";
import { readingMarkdownComponents } from "@/components/results/portrait-markdown";

export const frontmatter = ${JSON.stringify(frontmatter)};
export const rawContent = ${JSON.stringify(content)};

export default function LibraryMdxContent() {
	return <ReactMarkdown components={readingMarkdownComponents}>{rawContent}</ReactMarkdown>;
}
				`.trim(),
				map: null,
			};
		},
	};
}
