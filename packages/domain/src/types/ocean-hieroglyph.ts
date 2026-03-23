/**
 * Ocean Hieroglyph Type Definitions
 *
 * Pure data types for the hieroglyph lookup table.
 * Each hieroglyph is a symbolic geometric representation of a trait-level letter.
 * No React dependency — portable to any renderer.
 */

/** A single SVG element within a hieroglyph definition */
export interface HieroglyphElement {
	readonly tag: "path" | "circle" | "ellipse" | "rect" | "polygon";
	readonly attrs: Record<string, string | number>;
}

/** Complete hieroglyph definition — geometry only, no color */
export interface HieroglyphDef {
	readonly viewBox: string;
	readonly elements: ReadonlyArray<HieroglyphElement>;
}
