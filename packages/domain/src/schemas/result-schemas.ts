/**
 * Result Schemas — Canonical FacetResult and TraitResult types
 *
 * Shared between contracts (HTTP API) and use-cases (business logic).
 * Uses TraitNameSchema / FacetNameSchema for typed literal name fields.
 */

import { Schema as S } from "effect";
import { FacetNameSchema, TraitNameSchema } from "./big-five-schemas";

export const FacetResultSchema = S.Struct({
	name: FacetNameSchema,
	traitName: TraitNameSchema,
	score: S.Number,
	confidence: S.Number,
});
export type FacetResult = typeof FacetResultSchema.Type;

export const TraitResultSchema = S.Struct({
	name: TraitNameSchema,
	score: S.Number,
	level: S.String,
	confidence: S.Number,
});
export type TraitResult = typeof TraitResultSchema.Type;
