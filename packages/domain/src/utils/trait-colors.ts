import type { FacetName, TraitName } from "../constants/big-five";

/**
 * Return the CSS variable reference for a trait color token.
 */
export function getTraitColor(trait: TraitName): string {
	return `var(--trait-${trait})`;
}

/**
 * Return the CSS variable reference for a facet color token.
 */
export function getFacetColor(facet: FacetName): string {
	return `var(--facet-${facet})`;
}

/**
 * Return the CSS variable reference for a trait accent color token.
 */
export function getTraitAccentColor(trait: TraitName): string {
	return `var(--trait-${trait}-accent)`;
}

/**
 * Return the CSS variable reference for a trait gradient token.
 */
export function getTraitGradient(trait: TraitName): string {
	return `var(--gradient-trait-${trait})`;
}
