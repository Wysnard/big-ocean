/**
 * Ocean Hieroglyph Lookup Table
 *
 * Maps each TraitLevel letter to its geometric SVG definition.
 * Pure data — no React, no color, no rendering logic.
 *
 * Openness:          T (Traditional)   M (Moderate)     O (Open-minded)
 * Conscientiousness: F (Flexible)      S (Steady)       C (Conscientious)
 * Extraversion:      I (Introverted)   B (Balanced)     E (Extravert)
 * Agreeableness:     D (Direct)        P (Pragmatic)    A (Agreeable)
 * Neuroticism:       R (Resilient)     V (Variable)     N (Neurotic)
 */

import type { TraitLevel } from "../types/archetype";
import type { HieroglyphDef } from "../types/ocean-hieroglyph";

export const OCEAN_HIEROGLYPHS: Record<TraitLevel, HieroglyphDef> = {
	// ── Openness ──────────────────────────────────────────
	/** T — Traditional (Low): Equilateral cross */
	T: {
		viewBox: "0 0 24 24",
		elements: [{ tag: "path", attrs: { d: "M9 2h6v7h7v6h-7v7H9v-7H2V9h7z" } }],
	},
	/** M — Moderate (Mid): Horizontal rectangle */
	M: {
		viewBox: "0 0 24 24",
		elements: [{ tag: "path", attrs: { d: "M2 7h20v10H2z" } }],
	},
	/** O — Open-minded (High): Full circle */
	O: {
		viewBox: "0 0 24 24",
		elements: [{ tag: "circle", attrs: { cx: 12, cy: 12, r: 10 } }],
	},

	// ── Conscientiousness ─────────────────────────────────
	/** F — Flexible (Low): Three-quarter square */
	F: {
		viewBox: "0 0 24 24",
		elements: [{ tag: "path", attrs: { d: "M2 2h20v10H12v10H2z" } }],
	},
	/** S — Steady (Mid): Two quarter-circles facing outward */
	S: {
		viewBox: "0 0 24 24",
		elements: [
			{ tag: "path", attrs: { d: "M2 12L12 12A10 10 0 0 1 2 22Z" } },
			{ tag: "path", attrs: { d: "M22 12L12 12A10 10 0 0 1 22 2Z" } },
		],
	},
	/** C — Conscientious (High): Half-circle */
	C: {
		viewBox: "0 0 24 24",
		elements: [{ tag: "path", attrs: { d: "M18 2 A10 10 0 0 0 18 22 Z" } }],
	},

	// ── Extraversion ──────────────────────────────────────
	/** I — Introverted (Low): Vertical ellipse */
	I: {
		viewBox: "0 0 24 24",
		elements: [{ tag: "ellipse", attrs: { cx: 12, cy: 12, rx: 6, ry: 10 } }],
	},
	/** B — Balanced (Mid): Quarter-circle */
	B: {
		viewBox: "0 0 24 24",
		elements: [{ tag: "path", attrs: { d: "M2 2v20A20 20 0 0 0 22 2z" } }],
	},
	/** E — Extravert (High): Tall rectangle */
	E: {
		viewBox: "0 0 24 24",
		elements: [{ tag: "rect", attrs: { x: 7, y: 2, width: 10, height: 20, rx: 1 } }],
	},

	// ── Agreeableness ─────────────────────────────────────
	/** D — Direct (Low): Reversed half-circle */
	D: {
		viewBox: "0 0 24 24",
		elements: [{ tag: "path", attrs: { d: "M6 2 A10 10 0 0 1 6 22 Z" } }],
	},
	/** P — Pragmatic (Mid): Square on one stick */
	P: {
		viewBox: "0 0 24 24",
		elements: [
			{ tag: "rect", attrs: { x: 5, y: 2, width: 14, height: 14 } },
			{ tag: "rect", attrs: { x: 10, y: 16, width: 4, height: 6 } },
		],
	},
	/** A — Agreeable (High): Triangle */
	A: {
		viewBox: "0 0 24 24",
		elements: [{ tag: "polygon", attrs: { points: "12,2 22,22 2,22" } }],
	},

	// ── Neuroticism ───────────────────────────────────────
	/** R — Resilient (Low): Table (square on two sticks) */
	R: {
		viewBox: "0 0 24 24",
		elements: [
			{ tag: "rect", attrs: { x: 2, y: 2, width: 20, height: 14 } },
			{ tag: "rect", attrs: { x: 5, y: 16, width: 4, height: 6 } },
			{ tag: "rect", attrs: { x: 15, y: 16, width: 4, height: 6 } },
		],
	},
	/** V — Variable (Mid): Inverted triangle */
	V: {
		viewBox: "0 0 24 24",
		elements: [{ tag: "polygon", attrs: { points: "2,2 22,2 12,22" } }],
	},
	/** N — Neurotic (High): Diamond */
	N: {
		viewBox: "0 0 24 24",
		elements: [{ tag: "polygon", attrs: { points: "12,1 23,12 12,23 1,12" } }],
	},
} as const;
