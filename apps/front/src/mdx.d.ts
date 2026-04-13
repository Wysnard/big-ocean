declare module "*.mdx" {
	import type { ComponentType } from "react";

	export const frontmatter: {
		title: string;
		description: string;
		slug: string;
		tier: "archetype" | "trait" | "facet" | "science" | "guides";
		schemaType: "Article" | "DefinedTerm" | "ScholarlyArticle";
		cta: string;
	};

	const Component: ComponentType;
	export default Component;
}
