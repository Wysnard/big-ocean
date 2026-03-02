/**
 * Portrait Rating Repository Interface (Story 19-2)
 *
 * Persists portrait quality telemetry ratings.
 */

import { Context, Effect } from "effect";
import { DatabaseError } from "../errors/http.errors";
import type {
	DepthSignalLevel,
	PortraitRating,
	PortraitRatingRecord,
	PortraitType,
} from "../types/portrait-rating.types";

export interface InsertPortraitRating {
	readonly userId: string;
	readonly assessmentSessionId: string;
	readonly portraitType: PortraitType;
	readonly rating: PortraitRating;
	readonly depthSignal: DepthSignalLevel;
	readonly evidenceCount: number;
}

export class PortraitRatingRepository extends Context.Tag("PortraitRatingRepository")<
	PortraitRatingRepository,
	{
		readonly insertRating: (
			input: InsertPortraitRating,
		) => Effect.Effect<PortraitRatingRecord, DatabaseError, never>;
	}
>() {}
