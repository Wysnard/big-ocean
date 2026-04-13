/**
 * Shared Email Header — Hieroglyph Branding
 *
 * Renders the "big-" + 5 OCEAN hieroglyphs as inline SVGs for email headers.
 * Falls back to plain "big ocean" text in Outlook (mso).
 *
 * Pure function, no JSX — returns an HTML string.
 */

import type { HieroglyphDef, HieroglyphElement } from "@workspace/domain";
import { OCEAN_HIEROGLYPHS } from "@workspace/domain";

/** The 5 "high" glyph letters in OCEAN order with their dark-mode trait colors */
const BRAND_GLYPHS = [
	{ letter: "O", color: "#C084FC" },
	{ letter: "C", color: "#FF8F5E" },
	{ letter: "E", color: "#FF4DA6" },
	{ letter: "A", color: "#2DD4BF" },
	{ letter: "N", color: "#6366F1" },
] as const;

/** Convert a HieroglyphElement to an SVG child tag string */
function renderElement(el: HieroglyphElement): string {
	const attrs = Object.entries(el.attrs)
		.map(([k, v]) => `${k}="${v}"`)
		.join(" ");
	return `<${el.tag} ${attrs}/>`;
}

/** Convert a HieroglyphDef to a complete inline <svg> string */
function renderGlyphSvg(def: HieroglyphDef, fill: string): string {
	const children = def.elements.map(renderElement).join("");
	return `<svg style="display:inline-block;vertical-align:middle;width:22px;height:22px;margin:0 1px;" viewBox="${def.viewBox}" fill="${fill}" xmlns="http://www.w3.org/2000/svg">${children}</svg>`;
}

/**
 * Renders the hieroglyph-based email header HTML.
 *
 * Returns the inner content for the header `<td>`:
 * - Outlook (mso): plain "big ocean" text
 * - Other clients: "big-" text + 5 inline SVG hieroglyphs
 */
export function renderEmailHeader(): string {
	const glyphs = BRAND_GLYPHS.map(({ letter, color }) =>
		renderGlyphSvg(OCEAN_HIEROGLYPHS[letter], color),
	).join("");

	return `<!--[if mso]>
              <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #e0e7ff; letter-spacing: -0.02em;">
                big ocean
              </h1>
              <![endif]-->
              <!--[if !mso]><!-->
              <div style="margin: 0; font-size: 24px; font-weight: 600; color: #e0e7ff; letter-spacing: -0.02em;">
                <span style="display:inline-block;vertical-align:middle;">big-</span>${glyphs}
              </div>
              <!--<![endif]-->`;
}
