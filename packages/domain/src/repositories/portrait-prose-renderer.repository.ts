import { Context, Effect } from "effect";
import type { SpineBrief } from "../types/spine-brief";
import { PortraitGenerationError } from "./portrait-pipeline.errors";

export interface PortraitProseRendererInput {
	readonly sessionId: string;
	readonly brief: SpineBrief;
}

export class PortraitProseRendererRepository extends Context.Tag("PortraitProseRendererRepository")<
	PortraitProseRendererRepository,
	{
		readonly renderPortraitProse: (
			input: PortraitProseRendererInput,
		) => Effect.Effect<string, PortraitGenerationError, never>;
	}
>() {}
