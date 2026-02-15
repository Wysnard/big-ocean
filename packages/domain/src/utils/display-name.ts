/** Convert snake_case facet name to Title Case display name */
export const toFacetDisplayName = (name: string): string =>
	name
		.split("_")
		.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
		.join(" ");
