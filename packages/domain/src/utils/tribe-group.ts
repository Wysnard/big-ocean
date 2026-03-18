/**
 * Tribe Group Derivation (Story 32-1)
 *
 * Derives the tribe group from the Openness level letter.
 * Three groups based on the first letter of the OCEAN code:
 *   O (Open-minded)  → O-Group: Open-Minded
 *   M (Moderate)     → G-Group: Grounded
 *   T (Traditional)  → P-Group: Practical
 *
 * @module
 */

export interface TribeGroup {
	/** Short group identifier (e.g., "O-Group") */
	readonly code: string;
	/** Human-readable group label (e.g., "Open-Minded") */
	readonly label: string;
	/** Full display label (e.g., "O-Group: Open-Minded") */
	readonly fullLabel: string;
}

const TRIBE_GROUPS: Record<string, TribeGroup> = {
	O: { code: "O-Group", label: "Open-Minded", fullLabel: "O-Group: Open-Minded" },
	M: { code: "G-Group", label: "Grounded", fullLabel: "G-Group: Grounded" },
	T: { code: "P-Group", label: "Practical", fullLabel: "P-Group: Practical" },
};

/**
 * Get the tribe group for a given Openness level letter.
 *
 * @param opennessLetter - The Openness level letter: "O" | "M" | "T"
 * @returns TribeGroup with code, label, and fullLabel
 * @throws Error if the letter is not a valid Openness level
 *
 * @example
 * ```typescript
 * getTribeGroup("O") // → { code: "O-Group", label: "Open-Minded", fullLabel: "O-Group: Open-Minded" }
 * getTribeGroup(oceanCode5[0]) // derive from OCEAN code
 * ```
 */
export const getTribeGroup = (opennessLetter: string): TribeGroup => {
	const group = TRIBE_GROUPS[opennessLetter];
	if (!group) {
		throw new Error(`Invalid Openness level letter: "${opennessLetter}". Expected "O", "M", or "T".`);
	}
	return group;
};
