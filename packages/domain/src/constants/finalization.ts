/**
 * Finalization Progress Constants
 *
 * Tracks the state of assessment finalization pipeline.
 * Stored as TEXT column on assessment_sessions (not pgEnum).
 *
 * Pattern: as const → type → Schema
 */
import * as S from "effect/Schema";

export const FINALIZATION_PROGRESS = ["analyzing", "generating_portrait", "completed"] as const;

export type FinalizationProgress = (typeof FINALIZATION_PROGRESS)[number];

export const FinalizationProgressSchema = S.Literal(...FINALIZATION_PROGRESS);
