/**
 * OCEAN Code Branded Schemas
 *
 * Runtime-validated schemas for 4-letter and 5-letter OCEAN personality codes.
 * Regex validates per-position trait letters:
 *   [TMO] Openness  [FSC] Conscientiousness  [IBE] Extraversion
 *   [DPA] Agreeableness  [RVN] Neuroticism
 *
 * Type definitions (template literal + brand intersection) live in
 * ../types/archetype.ts
 */

import { Schema as S } from "effect";

/** Branded Schema for 4-letter OCEAN codes (e.g., "OCEA") */
export const OceanCode4Schema = S.String.pipe(
	S.pattern(/^[TMO][FSC][IBE][DPA]$/),
	S.brand("OceanCode4"),
);

/** Branded Schema for 5-letter OCEAN codes (e.g., "OCEAR") */
export const OceanCode5Schema = S.String.pipe(
	S.pattern(/^[TMO][FSC][IBE][DPA][RVN]$/),
	S.brand("OceanCode5"),
);
