/**
 * Card Generator Repository — domain interface (port)
 *
 * Generates shareable archetype card images (PNG) using Satori + Resvg.
 * Production implementation: card-generator.satori.repository.ts
 */

import { Context, Data, Effect } from "effect";

/**
 * Input for archetype card generation
 */
export interface CardGenerationInput {
	readonly archetypeName: string;
	readonly oceanCode: string;
	readonly archetypeColor: string;
	readonly traitScores: Record<string, number>;
	readonly displayName: string | null;
	readonly format: "9:16" | "1:1";
}

/**
 * Card generation error — domain error co-located with repository interface.
 */
export class CardGenerationError extends Data.TaggedError("CardGenerationError")<{
	readonly message: string;
	readonly cause?: string;
}> {}

/**
 * Card Generator Repository — domain interface (port)
 */
export class CardGeneratorRepository extends Context.Tag("CardGeneratorRepository")<
	CardGeneratorRepository,
	{
		readonly generateArchetypeCard: (
			input: CardGenerationInput,
		) => Effect.Effect<Buffer, CardGenerationError, never>;
	}
>() {}
