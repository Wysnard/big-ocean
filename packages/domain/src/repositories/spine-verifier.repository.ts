import { Context, Effect } from "effect";
import type { SpineBrief } from "../types/spine-brief";
import type { SpineVerification } from "../types/spine-verification";
import { PortraitGenerationError } from "./portrait-pipeline.errors";

export interface SpineVerifierInput {
	readonly sessionId: string;
	readonly brief: SpineBrief;
}

export class SpineVerifierRepository extends Context.Tag("SpineVerifierRepository")<
	SpineVerifierRepository,
	{
		readonly verifySpineBrief: (
			input: SpineVerifierInput,
		) => Effect.Effect<SpineVerification, PortraitGenerationError, never>;
	}
>() {}
