/**
 * Big Five Effect Schemas — Typed literals for trait and facet names
 *
 * Single source of truth for Effect Schema representations of TraitName and FacetName.
 * Derives TypeScript types that are structurally identical to the ones in constants/big-five.ts.
 */

import { Schema as S } from "effect";
import { ALL_FACETS, TRAIT_NAMES } from "../constants/big-five";

export const TraitNameSchema = S.Literal(...TRAIT_NAMES);
export type TraitNameFromSchema = typeof TraitNameSchema.Type;

export const FacetNameSchema = S.Literal(...ALL_FACETS);
export type FacetNameFromSchema = typeof FacetNameSchema.Type;
