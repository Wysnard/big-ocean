/**
 * Normalized Path Strings for Ocean Hieroglyphs
 *
 * Converts all 15 hieroglyph definitions (mixed SVG primitives) into
 * single `<path d="...">` strings for use with flubber SVG morphing.
 *
 * The original OCEAN_HIEROGLYPHS lookup table remains untouched —
 * this is a parallel data layer used exclusively by OceanSpinner.
 *
 * Conversion rules applied:
 * - circle → arc-based path
 * - ellipse → arc-based path with rx/ry
 * - rect → M/h/v/H/z path (with rx for rounded corners)
 * - polygon → M/L/z path
 * - path → d attribute used directly
 * - Multi-element shapes → concatenated into single compound path
 */

import type { TraitLevel } from "../types/archetype";

export const OCEAN_HIEROGLYPH_PATHS: Record<TraitLevel, string> = {
	// ── Openness ──────────────────────────────────────────
	/** T — Traditional (Low): Equilateral cross */
	T: "M9 2h6v7h7v6h-7v7H9v-7H2V9h7z",
	/** M — Moderate (Mid): Horizontal rectangle */
	M: "M2 7h20v10H2z",
	/** O — Open-minded (High): Full circle */
	O: "M2 12a10 10 0 1 0 20 0a10 10 0 1 0-20 0z",

	// ── Conscientiousness ─────────────────────────────────
	/** F — Flexible (Low): Three-quarter square */
	F: "M2 2h20v10H12v10H2z",
	/** S — Steady (Mid): Two quarter-circles facing outward */
	S: "M2 12L12 12A10 10 0 0 1 2 22ZM22 12L12 12A10 10 0 0 1 22 2Z",
	/** C — Conscientious (High): Half-circle */
	C: "M18 2A10 10 0 0 0 18 22Z",

	// ── Extraversion ──────────────────────────────────────
	/** I — Introverted (Low): Vertical ellipse */
	I: "M6 12a6 10 0 1 0 12 0a6 10 0 1 0-12 0z",
	/** B — Balanced (Mid): Quarter-circle */
	B: "M2 2v20A20 20 0 0 0 22 2z",
	/** E — Extravert (High): Tall rectangle with rounded corners */
	E: "M8 2h8a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z",

	// ── Agreeableness ─────────────────────────────────────
	/** D — Direct (Low): Reversed half-circle */
	D: "M6 2A10 10 0 0 1 6 22Z",
	/** P — Pragmatic (Mid): Square on one stick */
	P: "M5 2h14v14H5zM10 16h4v6h-4z",
	/** A — Agreeable (High): Triangle */
	A: "M12 2L22 22L2 22z",

	// ── Neuroticism ───────────────────────────────────────
	/** R — Resilient (Low): Table (square on two sticks) */
	R: "M2 2h20v14H2zM5 16h4v6H5zM15 16h4v6h-4z",
	/** V — Variable (Mid): Inverted triangle */
	V: "M2 2L22 2L12 22z",
	/** N — Neurotic (High): Diamond */
	N: "M12 1L23 12L12 23L1 12z",
} as const;
