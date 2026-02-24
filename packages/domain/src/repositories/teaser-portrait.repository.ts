/**
 * TeaserPortraitRepository Interface
 *
 * Pure interface for teaser portrait generation at finalization.
 * Generates the Opening section of the portrait (~200-400 words) using the
 * same voice and structure as the full portrait, but only Section 1.
 *
 * Separate from PortraitGeneratorRepository (which generates the full 4-section portrait).
 *
 * Story 11.5
 */

import { Context, Effect } from "effect";
import * as S from "effect/Schema";
import type { FinalizationEvidenceRecord } from "./finalization-evidence.repository";

export class TeaserPortraitError extends S.TaggedError<TeaserPortraitError>()(
	"TeaserPortraitError",
	{
		message: S.String,
	},
) {}

export interface TeaserPortraitInput {
	readonly sessionId: string;
	readonly evidence: ReadonlyArray<FinalizationEvidenceRecord>;
}

export interface TeaserPortraitOutput {
	readonly portrait: string;
	readonly tokenUsage: { readonly input: number; readonly output: number };
}

export class TeaserPortraitRepository extends Context.Tag("TeaserPortraitRepository")<
	TeaserPortraitRepository,
	{
		readonly generateTeaser: (
			input: TeaserPortraitInput,
		) => Effect.Effect<TeaserPortraitOutput, TeaserPortraitError>;
	}
>() {}
