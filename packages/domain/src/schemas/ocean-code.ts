/**
 * OCEAN Code Branded Schemas
 *
 * Runtime-validated schemas for 4-letter and 5-letter OCEAN personality codes.
 * Regex validates per-position trait letters:
 *   [PGO] Openness  [FBD] Conscientiousness  [IAE] Extraversion
 *   [CNW] Agreeableness  [RTS] Neuroticism
 *
 * Type definitions (template literal + brand intersection) live in
 * ../types/archetype.ts
 */

import { Schema as S } from "effect";

/** Branded Schema for 4-letter OCEAN codes (e.g., "ODEW") */
export const OceanCode4Schema = S.String.pipe(
	S.pattern(/^[PGO][FBD][IAE][CNW]$/),
	S.brand("OceanCode4"),
);

/** Branded Schema for 5-letter OCEAN codes (e.g., "ODEWR") */
export const OceanCode5Schema = S.String.pipe(
	S.pattern(/^[PGO][FBD][IAE][CNW][RTS]$/),
	S.brand("OceanCode5"),
);
