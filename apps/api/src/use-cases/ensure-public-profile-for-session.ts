/**
 * Idempotent public profile row for a completed assessment session.
 * Invoked during Assessment Finalization so read paths (e.g. getResults) only query profile state.
 */

import { PublicProfileRepository } from "@workspace/domain";
import { Effect } from "effect";

export interface EnsurePublicProfileForSessionInput {
	readonly sessionId: string;
	readonly userId: string;
}

export const ensurePublicProfileForSession = (input: EnsurePublicProfileForSessionInput) =>
	Effect.gen(function* () {
		const profileRepo = yield* PublicProfileRepository;
		const existing = yield* profileRepo.getProfileBySessionId(input.sessionId);
		if (existing !== null) {
			return existing;
		}
		return yield* profileRepo.createProfile({
			sessionId: input.sessionId,
			userId: input.userId,
		});
	});
