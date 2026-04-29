import { Data } from "effect";

/**
 * Portrait pipeline LLM failures — domain errors, NOT HTTP-facing TaggedErrors.
 * Caught inside `generate-full-portrait` use-case; never remap at HTTP layer.
 */
export class PortraitGenerationError extends Data.TaggedError("PortraitGenerationError")<{
	readonly sessionId: string;
	readonly message: string;
	readonly cause?: string;
	readonly stage?: "extract" | "verify" | "prose";
}> {}
